import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import {
  SEED_ADS,
  SEED_ANNOUNCEMENTS,
  SEED_APP_APPS,
  SEED_APP_BLOCKS,
  SEED_APP_PROFILE,
  SEED_CATEGORIES,
  SEED_FAQ,
  SEED_MODERATION,
  SEED_PEOPLE,
  SEED_SITE_COPY,
  SEED_SPONSOR_MESSAGES,
  SEED_SPONSOR_PAYMENTS,
  SEED_SPONSORS,
  SEED_TICKETS,
} from "@/lib/platform-seed";
import type {
  Ad,
  AdMode,
  AdOrientation,
  AdPosition,
  AdPrice,
  AdStatus,
  Announcement,
  AnnouncementAudience,
  AppBlock,
  AppLink,
  AppLiveStats,
  AppProfile,
  Category,
  FaqPair,
  HelpTicket,
  ModerationKind,
  PersonRole,
  Platform,
  ShopPerson,
  SiteCopy,
  Sponsor,
  SponsorMessage,
  SponsorPayment,
} from "@/lib/types";
import { phonesMatch } from "@/lib/admin-identity";
import { isAdLive, AD_SLOT_CAP, adStatusOf } from "@/lib/ad-live";
import { defaultAdPrices } from "@/lib/ad-pricing";
import { moderateAdCopy, type AdVerdict } from "@/lib/ad-moderation";
import { normalizeSocial, pickSocial, socialFromRow } from "@/lib/social";
import { bool, newId, num, slugify, stripDiacritics } from "@/lib/utils";

function mapCopy(r: Record<string, unknown>): SiteCopy {
  return { id: String(r.id), body: String(r.body), sortOrder: num(r.sort_order) };
}

function mapCategory(r: Record<string, unknown>): Category {
  return { id: String(r.id), label: String(r.label), sortOrder: num(r.sort_order) };
}

function mapAnnouncement(r: Record<string, unknown>): Announcement {
  return {
    id: String(r.id),
    audience: String(r.audience) as AnnouncementAudience,
    userId: r.user_id == null ? null : String(r.user_id),
    title: String(r.title),
    body: String(r.body),
    createdAt: String(r.created_at),
    hidden: bool(r.hidden),
    image: String(r.image ?? ""),
    linkUrl: String(r.link_url ?? ""),
  };
}

function mapAppProfile(r: Record<string, unknown>): AppProfile {
  return {
    id: String(r.id),
    name: String(r.name),
    tagline: String(r.tagline ?? ""),
    cover: String(r.cover ?? ""),
    avatar: String(r.avatar ?? ""),
    phone: String(r.phone ?? ""),
    ...socialFromRow(r),
  };
}

function mapAppBlock(r: Record<string, unknown>): AppBlock {
  return {
    id: String(r.id),
    title: String(r.title),
    body: String(r.body),
    sortOrder: num(r.sort_order),
  };
}

function mapAppLink(r: Record<string, unknown>): AppLink {
  return {
    id: String(r.id),
    title: String(r.title),
    body: String(r.body ?? ""),
    image: String(r.image ?? ""),
    url: String(r.url ?? ""),
    sortOrder: num(r.sort_order),
    hidden: bool(r.hidden),
  };
}

let adColumnsReady = false;

async function ensureAdColumns(sql: Awaited<ReturnType<typeof getSql>>) {
  if (adColumnsReady) return;
  await sql.query(
    "alter table ads add column if not exists display_seconds integer not null default 5",
  );
  await sql.query("alter table ads add column if not exists cost_bani integer not null default 0");
  await sql.query("alter table ads add column if not exists status text not null default 'live'");
  await sql.query("alter table ads add column if not exists live_at timestamptz");
  await sql.query(
    "alter table ads add column if not exists reject_reason text not null default ''",
  );
  await sql.query("alter table ads add column if not exists link_url text not null default ''");
  await sql.query(
    "update ads set live_at = created_at where live_at is null and status = 'live'",
  );
  adColumnsReady = true;
}

function mapAdPrice(r: Record<string, unknown>): AdPrice {
  const kind = String(r.kind);
  return {
    id: String(r.id),
    kind: kind === "days" || kind === "seconds" || kind === "place" ? kind : "place",
    key: String(r.key),
    priceBani: num(r.price_bani),
  };
}

async function ensureAdPrices(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    create table if not exists ad_prices (
      id text primary key,
      kind text not null,
      key text not null,
      price_bani integer not null
    )
  `);
  for (const p of defaultAdPrices()) {
    await sql`
      insert into ad_prices (id, kind, key, price_bani)
      values (${p.id}, ${p.kind}, ${p.key}, ${p.priceBani})
      on conflict (id) do nothing
    `;
  }
}

async function loadAdPrices(sql: Awaited<ReturnType<typeof getSql>>): Promise<AdPrice[]> {
  await ensureAdPrices(sql);
  const rows = (await sql`select * from ad_prices`) as Record<string, unknown>[];
  return rows.map(mapAdPrice);
}

function mapAdStatus(v: unknown): AdStatus {
  const s = String(v ?? "live");
  if (s === "review" || s === "queued" || s === "live" || s === "rejected") return s;
  return "live";
}

function mapAd(r: Record<string, unknown>): Ad {
  const status = mapAdStatus(r.status);
  const liveAt =
    r.live_at == null || r.live_at === ""
      ? status === "live"
        ? String(r.created_at)
        : null
      : String(r.live_at);
  return {
    id: String(r.id),
    producerId: r.producer_id == null ? null : String(r.producer_id),
    productId: r.product_id == null ? null : String(r.product_id),
    title: String(r.title),
    body: String(r.body ?? ""),
    position: String(r.position) as AdPosition,
    orientation: String(r.orientation) as AdOrientation,
    durationHours: num(r.duration_hours) || 72,
    displaySeconds: num(r.display_seconds) || 10,
    costBani: num(r.cost_bani) || 0,
    mode: String(r.mode) as AdMode,
    active: bool(r.active),
    image: String(r.image ?? ""),
    createdAt: String(r.created_at),
    status,
    liveAt,
    rejectReason: String(r.reject_reason ?? ""),
    linkUrl: String(r.link_url ?? ""),
  };
}

async function moderateAdServer(title: string, body: string): Promise<AdVerdict> {
  const local = moderateAdCopy(title, body);
  if (!local.ok) return local;
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 120,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Ești filtrul de reclame al Aprozar Românesc, o piață de mâncare de la producători. Alcool de casă, carne, miere, legume, pui de sex mixt, pistol de stropit, iarbă de leuștean sunt permise. Blochează: droguri, arme de foc, medicamente fără rețetă, acte false, marfă furată, pornografie, înșelătorii, trafic de persoane. Răspunde DOAR JSON: {\"block\":false} sau {\"block\":true,\"reason\":\"propoziție scurtă în română\"}.",
          },
          {
            role: "user",
            content: `Titlu: ${title.trim().slice(0, 200)}\nText: ${body.trim().slice(0, 400)}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: true };
    const match = ((await res.json()).choices?.[0]?.message?.content ?? "").match(/\{[\s\S]*\}/);
    if (!match) return { ok: true };
    const parsed = JSON.parse(match[0]) as { block?: boolean; reason?: string };
    if (parsed.block) {
      return {
        ok: false,
        reason: (parsed.reason?.trim() || "Conținut interzis sau nepotrivit.").slice(0, 220),
        category: "ai",
      };
    }
  } catch {
    return { ok: true };
  } finally {
    clearTimeout(timer);
  }
  return { ok: true };
}

async function promoteQueuedAds(sql: Awaited<ReturnType<typeof getSql>>) {
  await ensureAdColumns(sql);
  const ads = ((await sql`select * from ads order by created_at`) as Record<string, unknown>[]).map(
    mapAd,
  );
  const now = Date.now();
  const positions = [...new Set(ads.map((a) => a.position))];
  for (const position of positions) {
    let free = AD_SLOT_CAP - ads.filter((a) => a.position === position && isAdLive(a, now)).length;
    if (free <= 0) continue;
    const queued = ads
      .filter((a) => a.position === position && adStatusOf(a) === "queued" && a.active)
      .sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
        return a.id.localeCompare(b.id);
      });
    for (const ad of queued) {
      if (free <= 0) break;
      const liveAt = new Date().toISOString();
      await sql`update ads set status = ${"live"}, live_at = ${liveAt} where id = ${ad.id}`;
      ad.status = "live";
      ad.liveAt = liveAt;
      free -= 1;
    }
  }
}

async function backfillReviewAd(sql: Awaited<ReturnType<typeof getSql>>) {
  const review = SEED_ADS.find((a) => a.status === "review");
  if (!review) return;
  await sql`
    insert into ads (
      id, producer_id, product_id, title, body, position, orientation,
      duration_hours, mode, active, image, status
    ) values (
      ${review.id}, ${review.producerId}, ${review.productId}, ${review.title}, ${review.body},
      ${review.position}, ${review.orientation}, ${review.durationHours}, ${review.mode},
      ${review.active}, ${review.image}, ${review.status}
    )
    on conflict (id) do nothing
  `;
}

function mapPerson(r: Record<string, unknown>): ShopPerson {
  return {
    id: String(r.id),
    name: String(r.name),
    phone: String(r.phone ?? ""),
    role: String(r.role) as PersonRole,
    producerId: r.producer_id == null ? null : String(r.producer_id),
    visits: num(r.visits),
    purchases: num(r.purchases),
    warnings: num(r.warnings),
    blockedUntil: r.blocked_until == null ? null : String(r.blocked_until),
    blockedForever: bool(r.blocked_forever),
  };
}

function mapEvent(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    personId: String(r.person_id),
    kind: String(r.kind) as ModerationKind,
    body: String(r.body ?? ""),
    createdAt: String(r.created_at),
  };
}

function mapFaq(r: Record<string, unknown>): FaqPair {
  return {
    id: String(r.id),
    question: String(r.question),
    answer: String(r.answer),
    uses: num(r.uses),
    createdAt: String(r.created_at),
  };
}

function mapTicket(r: Record<string, unknown>): HelpTicket {
  return {
    id: String(r.id),
    authorName: String(r.author_name ?? ""),
    authorPhone: String(r.author_phone ?? ""),
    question: String(r.question),
    answer: r.answer == null ? null : String(r.answer),
    answeredAt: r.answered_at == null ? null : String(r.answered_at),
    trained: bool(r.trained),
    createdAt: String(r.created_at),
    hidden: bool(r.hidden),
  };
}

let hiddenColumnsReady = false;

export async function ensureHiddenColumns(sql: Awaited<ReturnType<typeof getSql>>) {
  if (hiddenColumnsReady) return;
  await sql.query(
    "alter table announcements add column if not exists hidden boolean not null default false",
  );
  await sql.query(
    "alter table messages add column if not exists hidden boolean not null default false",
  );
  await sql.query(
    "alter table sponsor_messages add column if not exists hidden boolean not null default false",
  );
  await sql.query(
    "alter table help_tickets add column if not exists hidden boolean not null default false",
  );
  await sql.query("alter table announcements add column if not exists image text not null default ''");
  await sql.query(
    "alter table announcements add column if not exists link_url text not null default ''",
  );
  hiddenColumnsReady = true;
}

let appPageReady = false;

async function ensureAppPage(sql: Awaited<ReturnType<typeof getSql>>) {
  if (appPageReady) return;
  await sql.query(`
    create table if not exists app_profile (
      id text primary key,
      name text not null,
      tagline text not null default '',
      cover text not null default '',
      avatar text not null default '',
      phone text not null default ''
    )
  `);
  await sql.query(`
    create table if not exists app_blocks (
      id text primary key,
      title text not null,
      body text not null,
      sort_order integer not null default 0
    )
  `);
  await sql.query(`
    create table if not exists app_apps (
      id text primary key,
      title text not null,
      body text not null default '',
      image text not null default '',
      url text not null default '',
      sort_order integer not null default 0
    )
  `);
  await sql.query(
    "alter table app_apps add column if not exists hidden boolean not null default false",
  );
  await sql.query(`
    create table if not exists app_visitors (
      visitor_key text primary key,
      first_seen timestamptz not null default now(),
      last_seen timestamptz not null default now()
    )
  `);
  await sql.query(
    "alter table app_profile add column if not exists social_intro text not null default ''",
  );
  await sql.query(
    "alter table app_profile add column if not exists social_facebook text not null default ''",
  );
  await sql.query(
    "alter table app_profile add column if not exists social_instagram text not null default ''",
  );
  await sql.query(
    "alter table app_profile add column if not exists social_youtube text not null default ''",
  );
  await sql.query(
    "alter table app_profile add column if not exists social_tiktok text not null default ''",
  );
  await sql.query(
    "alter table app_profile add column if not exists social_website text not null default ''",
  );
  appPageReady = true;
}

async function seedAppPage(sql: Awaited<ReturnType<typeof getSql>>) {
  await ensureAppPage(sql);
  const profileCount = await sql<{ c: number }>`select count(*)::int as c from app_profile`;
  if ((profileCount[0]?.c ?? 0) === 0) {
    const p = SEED_APP_PROFILE;
    await sql`
      insert into app_profile (
        id, name, tagline, cover, avatar, phone,
        social_intro, social_facebook, social_instagram, social_youtube,
        social_tiktok, social_website
      )
      values (
        ${p.id}, ${p.name}, ${p.tagline}, ${p.cover}, ${p.avatar}, ${p.phone},
        ${p.socialIntro}, ${p.facebook}, ${p.instagram}, ${p.youtube}, ${p.tiktok},
        ${p.website}
      )
    `;
    for (const b of SEED_APP_BLOCKS) {
      await sql`
        insert into app_blocks (id, title, body, sort_order)
        values (${b.id}, ${b.title}, ${b.body}, ${b.sortOrder})
      `;
    }
    for (const a of SEED_APP_APPS) {
      await sql`
        insert into app_apps (id, title, body, image, url, sort_order)
        values (${a.id}, ${a.title}, ${a.body}, ${a.image}, ${a.url}, ${a.sortOrder})
      `;
    }
    for (const person of SEED_PEOPLE) {
      await sql`
        insert into app_visitors (visitor_key)
        values (${`seed-${person.id}`})
        on conflict (visitor_key) do nothing
      `;
    }
  }
  await sql`delete from app_apps where id = ${"app-livada"}`;
  const p = SEED_APP_PROFILE;
  if (p.socialIntro || p.facebook || p.instagram || p.youtube || p.tiktok || p.website) {
    await sql`
      update app_profile set
        social_intro = ${p.socialIntro},
        social_facebook = ${p.facebook},
        social_instagram = ${p.instagram},
        social_youtube = ${p.youtube},
        social_tiktok = ${p.tiktok},
        social_website = ${p.website}
      where id = ${"main"}
        and social_facebook = ''
        and social_instagram = ''
        and social_youtube = ''
        and social_tiktok = ''
        and social_website = ''
    `;
  }
}

async function loadLiveStats(sql: Awaited<ReturnType<typeof getSql>>): Promise<AppLiveStats> {
  const rows = (await sql`
    select
      (select count(*)::int from app_visitors) as visitors,
      (select count(*)::int from producers where active = true) as producers,
      (select count(*)::int from shop_people where role = 'buyer' and purchases > 0) as clients
  `) as Record<string, unknown>[];
  return {
    uniqueVisitors: num(rows[0]?.visitors),
    producers: num(rows[0]?.producers),
    activeClients: num(rows[0]?.clients),
  };
}

async function loadAppPageData(sql: Awaited<ReturnType<typeof getSql>>) {
  await seedAppPage(sql);
  await sql.query(
    "alter table app_apps add column if not exists hidden boolean not null default false",
  );
  const profileRows = (await sql`select * from app_profile where id = ${"main"}`) as Record<
    string,
    unknown
  >[];
  const blockRows = (await sql`select * from app_blocks order by sort_order, title`) as Record<
    string,
    unknown
  >[];
  const appRows = (await sql`select * from app_apps order by sort_order, title`) as Record<
    string,
    unknown
  >[];
  return {
    profile: profileRows[0] ? mapAppProfile(profileRows[0]) : SEED_APP_PROFILE,
    blocks: blockRows.map(mapAppBlock),
    apps: appRows.map(mapAppLink),
    stats: await loadLiveStats(sql),
  };
}

async function ensurePlatformSeed() {
  const sql = await getSql();
  await ensureAdColumns(sql);
  const cats = await sql<{ c: number }>`select count(*)::int as c from categories`;
  if ((cats[0]?.c ?? 0) === 0) {
    for (const c of SEED_CATEGORIES) {
      await sql`insert into categories (id, label, sort_order) values (${c.id}, ${c.label}, ${c.sortOrder})`;
    }
  }
  const copy = await sql<{ c: number }>`select count(*)::int as c from site_copy`;
  if ((copy[0]?.c ?? 0) === 0) {
    for (const p of SEED_SITE_COPY) {
      await sql`insert into site_copy (id, body, sort_order) values (${p.id}, ${p.body}, ${p.sortOrder})`;
    }
  }
  const ads = await sql<{ c: number }>`select count(*)::int as c from ads`;
  if ((ads[0]?.c ?? 0) === 0) {
    for (const a of SEED_ADS) {
      await sql`
        insert into ads (
          id, producer_id, product_id, title, body, position, orientation,
          duration_hours, display_seconds, mode, active, image, status, live_at
        ) values (
          ${a.id}, ${a.producerId}, ${a.productId}, ${a.title}, ${a.body}, ${a.position},
          ${a.orientation}, ${a.durationHours}, ${a.displaySeconds}, ${a.mode}, ${a.active},
          ${a.image}, ${a.status}, ${a.status === "live" ? new Date().toISOString() : null}
        )
      `;
    }
  }
  await sql.query(
    "update ads set position = 'home_bottom' where id = 'ad-rosii' and position = 'every_fifth'",
  );
  await backfillReviewAd(sql);
  const servicii = SEED_ADS.find((a) => a.id === "ad-servicii");
  if (servicii) {
    const link = "linkUrl" in servicii ? String(servicii.linkUrl ?? "") : "";
    await sql`
      insert into ads (
        id, producer_id, product_id, title, body, position, orientation,
        duration_hours, display_seconds, mode, active, image, status, live_at, link_url
      ) values (
        ${servicii.id}, ${servicii.producerId}, ${servicii.productId}, ${servicii.title},
        ${servicii.body}, ${servicii.position}, ${servicii.orientation}, ${servicii.durationHours},
        ${servicii.displaySeconds}, ${servicii.mode}, ${servicii.active}, ${servicii.image},
        ${"live"}, ${new Date().toISOString()}, ${link}
      )
      on conflict (id) do update set
        title = excluded.title,
        body = excluded.body,
        position = excluded.position,
        image = excluded.image,
        duration_hours = excluded.duration_hours,
        display_seconds = ${10},
        link_url = excluded.link_url
    `;
  }
  await sql.query(
    "update ads set live_at = created_at where live_at is null and status = 'live'",
  );
  await sql.query(
    "update ads set duration_hours = 8760 where id in ('ad-ferma','ad-rosii') and duration_hours < 8760",
  );
  await sql`
    update ads
    set title = ${"Roșii Țărănești astăzi 20% reducere !!!"},
        body = ${""},
        image = ${"/images/rosii.jpg"}
    where id = ${"ad-rosii"}
  `;
  await sql`
    update ads
    set body = ${"Toți meșterii din jurul tău"}
    where id = ${"ad-servicii"}
  `;
  const sponsors = await sql<{ c: number }>`select count(*)::int as c from sponsors`;
  if ((sponsors[0]?.c ?? 0) === 0) {
    for (const s of SEED_SPONSORS) {
      await sql`
        insert into sponsors (id, name, company, phone, email)
        values (${s.id}, ${s.name}, ${s.company}, ${s.phone}, ${s.email})
      `;
    }
    for (const p of SEED_SPONSOR_PAYMENTS) {
      await sql`
        insert into sponsor_payments (id, sponsor_id, month_label, amount_bani)
        values (${p.id}, ${p.sponsorId}, ${p.monthLabel}, ${p.amountBani})
      `;
    }
    for (const m of SEED_SPONSOR_MESSAGES) {
      await sql`
        insert into sponsor_messages (id, sponsor_id, from_admin, body, created_at)
        values (${m.id}, ${m.sponsorId}, ${m.fromAdmin}, ${m.body}, ${m.createdAt})
      `;
    }
  }
  const people = await sql<{ c: number }>`select count(*)::int as c from shop_people`;
  if ((people[0]?.c ?? 0) === 0) {
    for (const p of SEED_PEOPLE) {
      await sql`
        insert into shop_people (
          id, name, phone, role, producer_id, visits, purchases, warnings
        ) values (
          ${p.id}, ${p.name}, ${p.phone}, ${p.role}, ${p.producerId},
          ${p.visits}, ${p.purchases}, ${p.warnings}
        )
      `;
    }
    for (const e of SEED_MODERATION) {
      await sql`
        insert into moderation_events (id, person_id, kind, body)
        values (${e.id}, ${e.personId}, ${e.kind}, ${e.body})
      `;
    }
  }
  const faq = await sql<{ c: number }>`select count(*)::int as c from faq_pairs`;
  if ((faq[0]?.c ?? 0) === 0) {
    for (const f of SEED_FAQ) {
      await sql`insert into faq_pairs (id, question, answer) values (${f.id}, ${f.question}, ${f.answer})`;
    }
  }
  const tickets = await sql<{ c: number }>`select count(*)::int as c from help_tickets`;
  if ((tickets[0]?.c ?? 0) === 0) {
    for (const t of SEED_TICKETS) {
      await sql`
        insert into help_tickets (id, author_name, author_phone, question)
        values (${t.id}, ${t.authorName}, ${t.authorPhone}, ${t.question})
      `;
    }
  }
  const anns = await sql<{ c: number }>`select count(*)::int as c from announcements`;
  if ((anns[0]?.c ?? 0) === 0) {
    for (const a of SEED_ANNOUNCEMENTS) {
      await sql`
        insert into announcements (id, audience, user_id, title, body, created_at)
        values (${a.id}, ${a.audience}, ${a.userId}, ${a.title}, ${a.body}, ${a.createdAt})
      `;
    }
  }
  await seedAppPage(await getSql());
}

async function loadPlatform(): Promise<Platform> {
  await ensurePlatformSeed();
  const sql = await getSql();
  await ensureHiddenColumns(sql);
  await ensureAdColumns(sql);
  await ensureAdPrices(sql);
  await promoteQueuedAds(sql);
  const appPage = await loadAppPageData(sql);
  const copyRows = (await sql`select * from site_copy order by sort_order`) as Record<
    string,
    unknown
  >[];
  const catRows = (await sql`select * from categories order by sort_order, label`) as Record<
    string,
    unknown
  >[];
  const annRows = (await sql`select * from announcements order by created_at desc`) as Record<
    string,
    unknown
  >[];
  const adRows = (await sql`select * from ads order by created_at desc`) as Record<
    string,
    unknown
  >[];
  const sponsorRows = (await sql`select * from sponsors order by name`) as Record<
    string,
    unknown
  >[];
  const payRows = (await sql`select * from sponsor_payments order by created_at`) as Record<
    string,
    unknown
  >[];
  const msgRows = (await sql`select * from sponsor_messages order by created_at`) as Record<
    string,
    unknown
  >[];
  const peopleRows = (await sql`select * from shop_people order by name`) as Record<
    string,
    unknown
  >[];
  const eventRows = (await sql`select * from moderation_events order by created_at desc`) as Record<
    string,
    unknown
  >[];
  const faqRows = (await sql`select * from faq_pairs order by created_at desc`) as Record<
    string,
    unknown
  >[];
  const ticketRows = (await sql`select * from help_tickets order by created_at desc`) as Record<
    string,
    unknown
  >[];
  const statsRows = (await sql`
    select
      (select count(*)::int from products) as products,
      (select count(*)::int from products where visible = true and stock > 0) as available,
      (select coalesce(sum(rating_count), 0)::int from producers) as reviews
  `) as Record<string, unknown>[];
  const payments: SponsorPayment[] = payRows.map((r) => ({
    id: String(r.id),
    sponsorId: String(r.sponsor_id),
    monthLabel: String(r.month_label),
    amountBani: num(r.amount_bani),
    createdAt: String(r.created_at),
  }));
  const messages: SponsorMessage[] = msgRows.map((r) => ({
    id: String(r.id),
    sponsorId: String(r.sponsor_id),
    fromAdmin: bool(r.from_admin),
    body: String(r.body),
    createdAt: String(r.created_at),
    hidden: bool(r.hidden),
  }));
  const sponsors: Sponsor[] = sponsorRows.map((r) => {
    const id = String(r.id);
    return {
      id,
      name: String(r.name),
      company: String(r.company ?? ""),
      phone: String(r.phone ?? ""),
      email: String(r.email ?? ""),
      payments: payments.filter((p) => p.sponsorId === id),
      messages: messages.filter((m) => m.sponsorId === id),
    };
  });
  return {
    siteCopy: copyRows.map(mapCopy),
    categories: catRows.map(mapCategory),
    announcements: annRows.map(mapAnnouncement),
    ads: adRows.map(mapAd),
    adPrices: await loadAdPrices(sql),
    sponsors,
    people: peopleRows.map(mapPerson),
    events: eventRows.map(mapEvent),
    faq: faqRows.map(mapFaq),
    tickets: ticketRows.map(mapTicket),
    stats: {
      products: num(statsRows[0]?.products),
      available: num(statsRows[0]?.available),
      reviews: num(statsRows[0]?.reviews),
    },
    appProfile: appPage.profile,
    appBlocks: appPage.blocks,
    appApps: appPage.apps,
    live: appPage.stats,
  };
}

export async function loadPublicPlatform() {
  await ensurePlatformSeed();
  const sql = await getSql();
  await ensureHiddenColumns(sql);
  await ensureAdColumns(sql);
  await ensureAdPrices(sql);
  await promoteQueuedAds(sql);
  const copyRows = (await sql`select * from site_copy order by sort_order`) as Record<
    string,
    unknown
  >[];
  const catRows = (await sql`select * from categories order by sort_order, label`) as Record<
    string,
    unknown
  >[];
  const annRows = (await sql`
    select * from announcements
    where audience in ('all', 'buyers') and hidden = false
    order by created_at desc
    limit 12
  `) as Record<string, unknown>[];
  const adRows = (await sql`select * from ads order by created_at desc`) as Record<
    string,
    unknown
  >[];
  const blocked = (await sql`
    select producer_id from shop_people
    where role = 'producer' and (blocked_forever = true or blocked_until > now())
  `) as Record<string, unknown>[];
  const warnings = (await sql`
    select producer_id, warnings from shop_people where role = 'producer'
  `) as Record<string, unknown>[];
  return {
    siteCopy: copyRows.map(mapCopy),
    categories: catRows.map(mapCategory),
    announcements: annRows.map(mapAnnouncement),
    ads: adRows.map(mapAd),
    adPrices: await loadAdPrices(sql),
    blockedProducerIds: blocked.map((r) => String(r.producer_id)).filter(Boolean),
    warningByProducer: Object.fromEntries(
      warnings
        .filter((r) => r.producer_id != null)
        .map((r) => [String(r.producer_id), num(r.warnings)]),
    ) as Record<string, number>,
  };
}

export const getPlatform = createServerFn({ method: "GET" }).handler(async () => loadPlatform());

export const saveSiteCopy = createServerFn({ method: "POST" })
  .validator(z.object({ items: z.array(z.object({ id: z.string(), body: z.string() })) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    for (const item of data.items) {
      await sql`
        insert into site_copy (id, body, sort_order)
        values (${item.id}, ${item.body}, ${0})
        on conflict (id) do update set body = excluded.body
      `;
    }
    return { ok: true };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().optional(), label: z.string().min(2) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = data.id && data.id !== "nou" ? data.id : slugify(data.label) || newId("cat");
    const max = await sql<{ m: number }>`select coalesce(max(sort_order), 0)::int as m from categories`;
    await sql`
      insert into categories (id, label, sort_order)
      values (${id}, ${data.label.trim()}, ${(max[0]?.m ?? 0) + 1})
      on conflict (id) do update set label = excluded.label
    `;
    return { ok: true, id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const used = await sql<{ c: number }>`select count(*)::int as c from products where category = ${data.id}`;
    if ((used[0]?.c ?? 0) > 0) {
      return { ok: false, error: "Categoria e folosită de produse. Mută-le întâi sau redenumește." };
    }
    const remaining = await sql<{ c: number }>`select count(*)::int as c from categories`;
    if ((remaining[0]?.c ?? 0) <= 1) {
      return { ok: false, error: "Trebuie să rămână măcar o categorie." };
    }
    await sql`delete from categories where id = ${data.id}`;
    return { ok: true };
  });

export const sendAnnouncement = createServerFn({ method: "POST" })
  .validator(
    z.object({
      audience: z.enum(["all", "buyers", "producers", "user"]),
      userId: z.string().nullable().optional(),
      title: z.string().min(2),
      body: z.string().min(2),
      image: z.string().optional(),
      linkUrl: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    const id = newId("an");
    await sql`
      insert into announcements (id, audience, user_id, title, body, image, link_url)
      values (
        ${id}, ${data.audience}, ${data.userId ?? null}, ${data.title.trim()}, ${data.body.trim()},
        ${data.image?.trim() ?? ""}, ${data.linkUrl?.trim() ?? ""}
      )
    `;
    return { ok: true, id };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await (await getSql())`delete from announcements where id = ${data.id}`;
    return { ok: true };
  });

export const updateAnnouncement = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      audience: z.enum(["all", "buyers", "producers", "user"]),
      userId: z.string().nullable().optional(),
      title: z.string().min(2),
      body: z.string().min(2),
      image: z.string().optional(),
      linkUrl: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    await sql`
      update announcements
      set audience = ${data.audience},
          user_id = ${data.userId ?? null},
          title = ${data.title.trim()},
          body = ${data.body.trim()},
          image = ${data.image?.trim() ?? ""},
          link_url = ${data.linkUrl?.trim() ?? ""}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const setAnnouncementHidden = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), hidden: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    await sql`update announcements set hidden = ${data.hidden} where id = ${data.id}`;
    return { ok: true };
  });

export const updateSponsorMessage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), body: z.string().min(1) }))
  .handler(async ({ data }) => {
    await (await getSql())`update sponsor_messages set body = ${data.body.trim()} where id = ${data.id}`;
    return { ok: true };
  });

export const setSponsorMessageHidden = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), hidden: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    await sql`update sponsor_messages set hidden = ${data.hidden} where id = ${data.id}`;
    return { ok: true };
  });

export const deleteSponsorMessage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await (await getSql())`delete from sponsor_messages where id = ${data.id}`;
    return { ok: true };
  });

export const updateTicket = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      question: z.string().min(2).optional(),
      answer: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    if (data.question != null) {
      await sql`update help_tickets set question = ${data.question.trim()} where id = ${data.id}`;
    }
    if (data.answer !== undefined) {
      await sql`update help_tickets set answer = ${data.answer?.trim() || null} where id = ${data.id}`;
    }
    return { ok: true };
  });

export const setTicketHidden = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), hidden: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    await sql`update help_tickets set hidden = ${data.hidden} where id = ${data.id}`;
    return { ok: true };
  });

export const deleteTicket = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await (await getSql())`delete from help_tickets where id = ${data.id}`;
    return { ok: true };
  });

const adInput = z.object({
  producerId: z.string().nullable(),
  productId: z.string().nullable().optional(),
  title: z.string().min(2),
  body: z.string(),
  position: z.enum([
    "cart_below",
    "home_top",
    "home_mid",
    "home_bottom",
    "favorites_more",
    "checkout_more",
    "every_fifth",
    "account_bottom",
  ]),
  orientation: z.enum(["horizontal", "vertical"]),
  durationHours: z.number().int().positive(),
  displaySeconds: z.number().int().positive(),
  costBani: z.number().int().nonnegative(),
  mode: z.enum(["static", "carousel"]),
  image: z.string(),
  linkUrl: z.string().optional(),
  publish: z.boolean().optional(),
});

export const saveAd = createServerFn({ method: "POST" })
  .validator(adInput)
  .handler(async ({ data }) => {
    const verdict = await moderateAdServer(data.title, data.body);
    if (!verdict.ok) return { ok: false as const, error: verdict.reason };
    const sql = await getSql();
    await ensureAdColumns(sql);
    const id = newId("ad");
    const goLive = Boolean(data.publish);
    const liveAt = goLive ? new Date().toISOString() : null;
    await sql`
      insert into ads (
        id, producer_id, product_id, title, body, position, orientation,
        duration_hours, display_seconds, cost_bani, mode, active, image, status, live_at, link_url
      ) values (
        ${id}, ${data.producerId}, ${data.productId ?? null}, ${data.title.trim()}, ${data.body.trim()},
        ${data.position}, ${data.orientation}, ${data.durationHours}, ${data.displaySeconds},
        ${data.costBani}, ${data.mode}, ${true},
        ${data.image}, ${goLive ? "live" : "review"}, ${liveAt}, ${data.linkUrl?.trim() ?? ""}
      )
    `;
    return { ok: true as const, id, status: (goLive ? "live" : "review") as "live" | "review" };
  });

export const saveAdPrice = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      priceBani: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAdPrices(sql);
    const parts = data.id.split(":");
    const kind = parts[0] === "days" || parts[0] === "seconds" ? parts[0] : "place";
    const key = parts.slice(1).join(":") || data.id;
    await sql`
      insert into ad_prices (id, kind, key, price_bani)
      values (${data.id}, ${kind}, ${key}, ${data.priceBani})
      on conflict (id) do update set price_bani = excluded.price_bani
    `;
    return { ok: true as const };
  });

export const updateAd = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      title: z.string().min(2).optional(),
      body: z.string().optional(),
      image: z.string().optional(),
      linkUrl: z.string().optional(),
      displaySeconds: z.number().int().positive().optional(),
      active: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAdColumns(sql);
    const rows = (await sql`select * from ads where id = ${data.id}`) as Record<string, unknown>[];
    if (!rows[0]) return { ok: false as const, error: "Reclama nu există" };
    const cur = mapAd(rows[0]);
    const title = data.title?.trim() ?? cur.title;
    const body = data.body ?? cur.body;
    const verdict = await moderateAdServer(title, body);
    if (!verdict.ok) return { ok: false as const, error: verdict.reason };
    const seconds = data.displaySeconds ?? cur.displaySeconds;
    const image = data.image ?? cur.image;
    const link = data.linkUrl !== undefined ? data.linkUrl.trim() : cur.linkUrl;
    const active = data.active ?? cur.active;
    await sql`
      update ads
      set title = ${title},
          body = ${body},
          image = ${image},
          link_url = ${link},
          display_seconds = ${seconds},
          active = ${active}
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const approveAd = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAdColumns(sql);
    await promoteQueuedAds(sql);
    const rows = (await sql`select * from ads where id = ${data.id}`) as Record<string, unknown>[];
    if (!rows[0]) return { ok: false as const, error: "Reclama nu există" };
    const ad = mapAd(rows[0]);
    const verdict = await moderateAdServer(ad.title, ad.body);
    if (!verdict.ok) {
      await sql`
        update ads
        set status = ${"rejected"}, reject_reason = ${verdict.reason}, live_at = ${null}
        where id = ${data.id}
      `;
      return { ok: false as const, error: verdict.reason };
    }
    const now = Date.now();
    const liveOnSlot = (
      (await sql`select * from ads where position = ${ad.position}`) as Record<string, unknown>[]
    )
      .map(mapAd)
      .filter((a) => a.id !== ad.id && isAdLive(a, now));
    if (liveOnSlot.length >= AD_SLOT_CAP) {
      await sql`
        update ads
        set status = ${"queued"}, live_at = ${null}, reject_reason = ${""}, active = ${true}
        where id = ${data.id}
      `;
      return { ok: true as const, stage: "queued" as const };
    }
    await sql`
      update ads
      set status = ${"live"}, live_at = ${new Date().toISOString()}, reject_reason = ${""}, active = ${true}
      where id = ${data.id}
    `;
    return { ok: true as const, stage: "live" as const };
  });

export const rejectAd = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), reason: z.string().optional() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAdColumns(sql);
    await sql`
      update ads
      set status = ${"rejected"},
          reject_reason = ${data.reason?.trim() || "Conținut nepotrivit, interzis sau ilegal"},
          live_at = ${null}
      where id = ${data.id}
    `;
    await promoteQueuedAds(sql);
    return { ok: true };
  });

export const toggleAd = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), active: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update ads set active = ${data.active} where id = ${data.id}`;
    await promoteQueuedAds(sql);
    return { ok: true };
  });

export const deleteAd = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`delete from ads where id = ${data.id}`;
    await promoteQueuedAds(sql);
    return { ok: true };
  });

export const saveSponsor = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2),
      company: z.string(),
      phone: z.string().min(8),
      email: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("sp");
    await sql`
      insert into sponsors (id, name, company, phone, email)
      values (${id}, ${data.name.trim()}, ${data.company.trim()}, ${data.phone.trim()}, ${data.email.trim()})
    `;
    await sql`
      insert into shop_people (id, name, phone, role, producer_id, visits, purchases, warnings)
      values (${`spon-${id}`}, ${data.name.trim()}, ${data.phone.trim()}, ${"sponsor"}, ${null}, ${0}, ${0}, ${0})
    `;
    return { ok: true, id };
  });

export const addSponsorPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sponsorId: z.string(),
      monthLabel: z.string().min(2),
      amountBani: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("pay");
    await sql`
      insert into sponsor_payments (id, sponsor_id, month_label, amount_bani)
      values (${id}, ${data.sponsorId}, ${data.monthLabel.trim()}, ${data.amountBani})
    `;
    return { ok: true, id };
  });

export const sendSponsorMessage = createServerFn({ method: "POST" })
  .validator(z.object({ sponsorId: z.string(), body: z.string().min(1), fromAdmin: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("smsg");
    await sql`
      insert into sponsor_messages (id, sponsor_id, from_admin, body)
      values (${id}, ${data.sponsorId}, ${data.fromAdmin}, ${data.body.trim()})
    `;
    return { ok: true, id };
  });

export const moderatePerson = createServerFn({ method: "POST" })
  .validator(
    z.object({
      personId: z.string(),
      kind: z.enum(["warning", "personal", "block7", "blockforever"]),
      body: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("mod");
    await sql`
      insert into moderation_events (id, person_id, kind, body)
      values (${id}, ${data.personId}, ${data.kind}, ${data.body.trim()})
    `;
    if (data.kind === "warning") {
      await sql`update shop_people set warnings = warnings + 1 where id = ${data.personId}`;
    }
    if (data.kind === "block7") {
      await sql`update shop_people set blocked_until = ${new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()}, blocked_forever = false where id = ${data.personId}`;
    }
    if (data.kind === "blockforever") {
      await sql`update shop_people set blocked_forever = true where id = ${data.personId}`;
    }
    if (data.kind === "personal" && data.body.trim()) {
      const person = (await sql`select name from shop_people where id = ${data.personId}`) as Record<
        string,
        unknown
      >[];
      const title = `Pentru ${String(person[0]?.name ?? "tine")}`;
      await sql`
        insert into announcements (id, audience, user_id, title, body)
        values (${newId("an")}, ${"user"}, ${data.personId}, ${title}, ${data.body.trim()})
      `;
    }
    return { ok: true, id };
  });

export const saveFaq = createServerFn({ method: "POST" })
  .validator(z.object({ question: z.string().min(2), answer: z.string().min(2) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("faq");
    await sql`
      insert into faq_pairs (id, question, answer)
      values (${id}, ${data.question.trim()}, ${data.answer.trim()})
    `;
    return { ok: true, id };
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await (await getSql())`delete from faq_pairs where id = ${data.id}`;
    return { ok: true };
  });

export const answerTicket = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), answer: z.string().min(2), train: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = (await sql`select question from help_tickets where id = ${data.id}`) as Record<
      string,
      unknown
    >[];
    const question = String(rows[0]?.question ?? "");
    await sql`
      update help_tickets
      set answer = ${data.answer.trim()}, answered_at = now(), trained = ${data.train}
      where id = ${data.id}
    `;
    if (data.train && question) {
      await sql`
        insert into faq_pairs (id, question, answer)
        values (${newId("faq")}, ${question}, ${data.answer.trim()})
      `;
    }
    return { ok: true };
  });

function faqScore(question: string, faqQ: string) {
  const qWords = stripDiacritics(question)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  const fWords = stripDiacritics(faqQ)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  if (!qWords.length || !fWords.length) return 0;
  const fset = new Set(fWords);
  let n = 0;
  for (const w of qWords) if (fset.has(w)) n += 1;
  const qn = stripDiacritics(question);
  const fn = stripDiacritics(faqQ);
  if (qn.includes(fn) || fn.includes(qn)) n += 3;
  return n;
}

export const askHelpBot = createServerFn({ method: "POST" })
  .validator(z.object({ question: z.string().min(3), authorName: z.string(), authorPhone: z.string() }))
  .handler(async ({ data }) => {
    await ensurePlatformSeed();
    const sql = await getSql();
    const ticketId = newId("t");
    await sql`
      insert into help_tickets (id, author_name, author_phone, question)
      values (${ticketId}, ${data.authorName.trim() || "Vizitat"}, ${data.authorPhone.trim()}, ${data.question.trim()})
    `;
    const faq = ((await sql`select * from faq_pairs`) as Record<string, unknown>[]).map(mapFaq);
    let best: FaqPair | null = null;
    let bestScore = 0;
    for (const f of faq) {
      const s = faqScore(data.question, f.question);
      if (s > bestScore) {
        best = f;
        bestScore = s;
      }
    }
    if (best && bestScore >= 2) {
      await sql`update faq_pairs set uses = uses + 1 where id = ${best.id}`;
      await sql`
        update help_tickets
        set answer = ${best.answer}, answered_at = now(), trained = true
        where id = ${ticketId}
      `;
      return { ok: true as const, source: "training" as const, text: best.answer, ticketId };
    }
    const apiKey = process.env.XAI_API_KEY;
    if (apiKey) {
      const training = faq
        .map((f) => `Î: ${f.question}\nR: ${f.answer}`)
        .join("\n\n")
        .slice(0, 6000);
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            max_tokens: 280,
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content:
                  "Ești botul de ajutor al Aprozarului Românesc, antrenat de administratorul Cioban Iosif Gabriel. Răspunzi scurt, în română, doar din perechile de antrenament. Dacă nu ești sigur, spui clar că trimiți întrebarea administratorului. Nu inventa prețuri, stocuri sau date personale. Nu intra în conturile oamenilor.",
              },
              {
                role: "user",
                content: `Antrenament:\n${training || "(gol)"}\n\nÎntrebarea omului: ${data.question}`,
              },
            ],
          }),
        });
        if (res.ok) {
          const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
          const unsure = !text || /nu (știu|stiu)|administrator|Gabriel|nu am (în|in) antrenament/i.test(text);
          if (text && !unsure) {
            await sql`
              update help_tickets set answer = ${text}, answered_at = now() where id = ${ticketId}
            `;
            return { ok: true as const, source: "bot" as const, text, ticketId };
          }
        }
      } catch {
        /* fall through to inbox */
      }
    }
    return {
      ok: true as const,
      source: "inbox" as const,
      text: "Am trimis întrebarea lui Cioban Iosif Gabriel. Îți răspunde el, din Admin. Botul învață din răspunsurile deja date.",
      ticketId,
    };
  });

export const listMyNotices = createServerFn({ method: "POST" })
  .validator(z.object({ phone: z.string(), producerId: z.string().nullable() }))
  .handler(async ({ data }) => {
    await ensurePlatformSeed();
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    const rows = (await sql`
      select a.*, p.phone as person_phone, p.producer_id as person_producer
      from announcements a
      left join shop_people p on p.id = a.user_id
      where a.hidden = false
      order by a.created_at desc
      limit 40
    `) as Record<string, unknown>[];
    return rows
      .filter((r) => {
        const audience = String(r.audience);
        if (audience === "all") return true;
        if (audience === "buyers" && !data.producerId) return true;
        if (audience === "producers" && data.producerId) return true;
        if (audience === "user") {
          const personProducer = r.person_producer == null ? null : String(r.person_producer);
          const personPhone = String(r.person_phone ?? "");
          if (data.producerId && personProducer === data.producerId) return true;
          if (data.phone && personPhone && phonesMatch(personPhone, data.phone)) return true;
        }
        return false;
      })
      .map(mapAnnouncement);
  });

export const getAppPage = createServerFn({ method: "POST" })
  .validator(z.object({ visitorKey: z.string().optional() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensurePlatformSeed();
    if (data.visitorKey && data.visitorKey.length >= 8) {
      await sql`
        insert into app_visitors (visitor_key, first_seen, last_seen)
        values (${data.visitorKey}, now(), now())
        on conflict (visitor_key) do update set last_seen = now()
      `;
    }
    return loadAppPageData(sql);
  });

export const touchVisitor = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(8) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAppPage(sql);
    await sql`
      insert into app_visitors (visitor_key, first_seen, last_seen)
      values (${data.key}, now(), now())
      on conflict (visitor_key) do update set last_seen = now()
    `;
    return loadLiveStats(sql);
  });

export const saveAppProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2),
      tagline: z.string(),
      cover: z.string(),
      avatar: z.string(),
      phone: z.string(),
      socialIntro: z.string().optional().default(""),
      facebook: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      youtube: z.string().optional().default(""),
      tiktok: z.string().optional().default(""),
      website: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAppPage(sql);
    const social = normalizeSocial(pickSocial(data));
    await sql`
      insert into app_profile (
        id, name, tagline, cover, avatar, phone,
        social_intro, social_facebook, social_instagram, social_youtube,
        social_tiktok, social_website
      )
      values (
        ${"main"}, ${data.name.trim()}, ${data.tagline.trim()}, ${data.cover}, ${data.avatar},
        ${data.phone.trim()},
        ${social.intro}, ${social.facebook}, ${social.instagram}, ${social.youtube},
        ${social.tiktok}, ${social.website}
      )
      on conflict (id) do update set
        name = excluded.name,
        tagline = excluded.tagline,
        cover = excluded.cover,
        avatar = excluded.avatar,
        phone = excluded.phone,
        social_intro = excluded.social_intro,
        social_facebook = excluded.social_facebook,
        social_instagram = excluded.social_instagram,
        social_youtube = excluded.social_youtube,
        social_tiktok = excluded.social_tiktok,
        social_website = excluded.social_website
    `;
    return { ok: true };
  });

export const saveAppBlock = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().optional(), title: z.string().min(2), body: z.string().min(2) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAppPage(sql);
    const id = data.id && data.id !== "nou" ? data.id : newId("blk");
    const max = await sql<{ m: number }>`select coalesce(max(sort_order), 0)::int as m from app_blocks`;
    await sql`
      insert into app_blocks (id, title, body, sort_order)
      values (${id}, ${data.title.trim()}, ${data.body.trim()}, ${(max[0]?.m ?? 0) + 1})
      on conflict (id) do update set title = excluded.title, body = excluded.body
    `;
    return { ok: true, id };
  });

export const deleteAppBlock = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await (await getSql())`delete from app_blocks where id = ${data.id}`;
    return { ok: true };
  });

export const saveAppLink = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      title: z.string().min(2),
      body: z.string(),
      image: z.string(),
      url: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.image.startsWith("data:") && data.image.length > 450_000) {
      return { ok: false as const, error: "Poza e prea mare. Alege o imagine mai mică." };
    }
    const sql = await getSql();
    await ensureAppPage(sql);
    const id = data.id && data.id !== "nou" ? data.id : newId("app");
    const max = await sql<{ m: number }>`select coalesce(max(sort_order), 0)::int as m from app_apps`;
    await sql`
      insert into app_apps (id, title, body, image, url, sort_order)
      values (
        ${id}, ${data.title.trim()}, ${data.body.trim()}, ${data.image}, ${data.url.trim()},
        ${(max[0]?.m ?? 0) + 1}
      )
      on conflict (id) do update set
        title = excluded.title,
        body = excluded.body,
        image = excluded.image,
        url = excluded.url
    `;
    return { ok: true as const, id };
  });

export const hideAppLink = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), hidden: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureAppPage(sql);
    await sql`update app_apps set hidden = ${data.hidden} where id = ${data.id}`;
    return { ok: true };
  });

export const deleteAppLink = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await (await getSql())`delete from app_apps where id = ${data.id}`;
    return { ok: true };
  });
