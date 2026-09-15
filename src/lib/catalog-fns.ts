import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { loadPublicPlatform, ensureHiddenColumns } from "@/lib/platform-fns";
import { SEED_PRODUCERS, SEED_PRODUCTS, SEED_STORIES } from "@/lib/seed";
import { normalizeSocial, pickSocial, socialFromRow } from "@/lib/social";
import type {
  Catalog,
  OrderItem,
  OrderStatus,
  Producer,
  Product,
  ShopMessage,
  ShopOrder,
  Story,
} from "@/lib/types";
import { bool, newId, num } from "@/lib/utils";

function mapProducer(
  r: Record<string, unknown>,
  extra?: { blocked?: boolean; warningCount?: number },
): Producer {
  return {
    id: String(r.id),
    name: String(r.name),
    village: String(r.village),
    county: String(r.county),
    blurb: String(r.blurb),
    rating: num(r.rating),
    ratingCount: num(r.rating_count),
    km: num(r.km),
    pickup: bool(r.pickup),
    delivery: bool(r.delivery),
    deliveryFeeBani: num(r.delivery_fee_bani),
    freeOverBani: num(r.free_over_bani),
    minOrderBani: num(r.min_order_bani),
    phone: String(r.phone ?? ""),
    image: String(r.image ?? ""),
    avatar: String(r.avatar ?? r.image ?? ""),
    ...socialFromRow(r),
    active: bool(r.active),
    blocked: extra?.blocked ?? false,
    warningCount: extra?.warningCount ?? 0,
  };
}

function mapProduct(r: Record<string, unknown>): Product {
  const bulkQty = r.bulk_qty == null ? null : num(r.bulk_qty);
  const bulkPrice = r.bulk_price_bani == null ? null : num(r.bulk_price_bani);
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    category: String(r.category),
    producerId: String(r.producer_id),
    unit: String(r.unit),
    priceBani: num(r.price_bani),
    bulkQty: bulkQty && bulkQty > 0 ? bulkQty : null,
    bulkPriceBani: bulkPrice && bulkPrice > 0 ? bulkPrice : null,
    step: num(r.step) || 1,
    stock: num(r.stock),
    image: String(r.image ?? ""),
    blurb: String(r.blurb ?? ""),
    visible: bool(r.visible),
    featured: bool(r.featured),
    sortOrder: num(r.sort_order),
  };
}

function mapStory(r: Record<string, unknown>): Story {
  return {
    id: String(r.id),
    slug: String(r.slug),
    producerId: String(r.producer_id),
    title: String(r.title),
    excerpt: String(r.excerpt),
    body: String(r.body),
  };
}

async function ensureSeed() {
  const sql = await getSql();
  await ensureProducerSocial(sql);
  const rows = await sql<{ c: number }>`select count(*)::int as c from producers`;
  if ((rows[0]?.c ?? 0) === 0) {
  for (const p of SEED_PRODUCERS) {
    await sql`
      insert into producers (
        id, name, village, county, blurb, rating, rating_count, km,
        pickup, delivery, delivery_fee_bani, free_over_bani, min_order_bani,
        phone, image, avatar, active,
        social_intro, social_facebook, social_instagram, social_youtube,
        social_tiktok, social_website
      ) values (
        ${p.id}, ${p.name}, ${p.village}, ${p.county}, ${p.blurb}, ${p.rating},
        ${p.ratingCount}, ${p.km}, ${p.pickup}, ${p.delivery}, ${p.deliveryFeeBani},
        ${p.freeOverBani}, ${p.minOrderBani}, ${p.phone}, ${p.image}, ${p.avatar || p.image}, ${p.active},
        ${p.socialIntro}, ${p.facebook}, ${p.instagram}, ${p.youtube}, ${p.tiktok},
        ${p.website}
      )
    `;
  }
  for (const p of SEED_PRODUCTS) {
    await sql`
      insert into products (
        id, slug, name, category, producer_id, unit, price_bani, bulk_qty,
        bulk_price_bani, step, stock, image, blurb, visible, featured, sort_order
      ) values (
        ${p.id}, ${p.slug}, ${p.name}, ${p.category}, ${p.producerId}, ${p.unit},
        ${p.priceBani}, ${p.bulkQty}, ${p.bulkPriceBani}, ${p.step}, ${p.stock},
        ${p.image}, ${p.blurb}, ${p.visible}, ${p.featured}, ${p.sortOrder}
      )
    `;
  }
  for (const s of SEED_STORIES) {
    await sql`
      insert into stories (id, slug, producer_id, title, excerpt, body)
      values (${s.id}, ${s.slug}, ${s.producerId}, ${s.title}, ${s.excerpt}, ${s.body})
    `;
  }
  }
  await sql`
    update products
    set name = ${"Roșii Țărănești"}, slug = ${"rosii-taranesti"}
    where id = ${"rosii"}
  `;
  await sql`
    update stories
    set title = ${"Roșiile țărănești ale lui Nelu"}, slug = ${"rosiile-taranesti-ale-lui-nelu"}
    where id = ${"s-nelu"}
  `;
  await sql`
    update producers
    set blurb = ${"Roșii țărănești, ardei și vinete de pe aracii din curte. Nelu culege dimineața."}
    where id = ${"nelu"}
  `;
  for (const p of SEED_PRODUCTS) {
    await sql`
      update products
      set image = ${p.image}
      where id = ${p.id}
        and image not like ${"data:%"}
        and image <> ${p.image}
    `;
  }
}

let producerAvatarReady = false;

async function ensureProducerAvatar(sql: Awaited<ReturnType<typeof getSql>>) {
  if (producerAvatarReady) return;
  await sql.query("alter table producers add column if not exists avatar text not null default ''");
  for (const p of SEED_PRODUCERS) {
    const avatar = p.avatar || p.image;
    await sql`update producers set avatar = ${avatar} where id = ${p.id} and avatar = ''`;
  }
  producerAvatarReady = true;
}

let producerSocialReady = false;

async function ensureProducerSocial(sql: Awaited<ReturnType<typeof getSql>>) {
  if (producerSocialReady) return;
  await sql.query(
    "alter table producers add column if not exists social_intro text not null default ''",
  );
  await sql.query(
    "alter table producers add column if not exists social_facebook text not null default ''",
  );
  await sql.query(
    "alter table producers add column if not exists social_instagram text not null default ''",
  );
  await sql.query(
    "alter table producers add column if not exists social_youtube text not null default ''",
  );
  await sql.query(
    "alter table producers add column if not exists social_tiktok text not null default ''",
  );
  await sql.query(
    "alter table producers add column if not exists social_website text not null default ''",
  );
  for (const p of SEED_PRODUCERS) {
    if (!p.socialIntro && !p.facebook && !p.instagram && !p.youtube && !p.tiktok && !p.website) {
      continue;
    }
    await sql`
      update producers set
        social_intro = ${p.socialIntro},
        social_facebook = ${p.facebook},
        social_instagram = ${p.instagram},
        social_youtube = ${p.youtube},
        social_tiktok = ${p.tiktok},
        social_website = ${p.website}
      where id = ${p.id}
        and social_facebook = ''
        and social_instagram = ''
        and social_youtube = ''
        and social_tiktok = ''
        and social_website = ''
    `;
  }
  producerSocialReady = true;
}

export const getCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<Catalog> => {
    await ensureSeed();
    const pub = await loadPublicPlatform();
    const sql = await getSql();
    await ensureProducerAvatar(sql);
    await ensureProducerSocial(sql);
    const producers = (await sql`select * from producers order by km`) as Record<
      string,
      unknown
    >[];
    const products = (await sql`select * from products order by sort_order, name`) as Record<
      string,
      unknown
    >[];
    const stories = (await sql`select * from stories`) as Record<string, unknown>[];
    const blocked = new Set(pub.blockedProducerIds);
    return {
      producers: producers.map((r) => {
        const id = String(r.id);
        return mapProducer(r, {
          blocked: blocked.has(id),
          warningCount: pub.warningByProducer[id] ?? 0,
        });
      }),
      products: products.map(mapProduct),
      stories: stories.map(mapStory),
      categories: pub.categories,
      siteCopy: pub.siteCopy,
      ads: pub.ads,
      announcements: pub.announcements,
      adPrices: pub.adPrices ?? [],
    };
  },
);

const productInput = z.object({
  id: z.string(),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string(),
  producerId: z.string(),
  unit: z.string(),
  priceBani: z.number().int().nonnegative(),
  bulkQty: z.number().nullable(),
  bulkPriceBani: z.number().int().nullable(),
  step: z.number().positive(),
  stock: z.number(),
  image: z.string(),
  blurb: z.string(),
  visible: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int(),
});

export const saveProduct = createServerFn({ method: "POST" })
  .validator(productInput)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into products (
        id, slug, name, category, producer_id, unit, price_bani, bulk_qty,
        bulk_price_bani, step, stock, image, blurb, visible, featured, sort_order
      ) values (
        ${data.id}, ${data.slug}, ${data.name}, ${data.category}, ${data.producerId},
        ${data.unit}, ${data.priceBani}, ${data.bulkQty}, ${data.bulkPriceBani},
        ${data.step}, ${data.stock}, ${data.image}, ${data.blurb}, ${data.visible},
        ${data.featured}, ${data.sortOrder}
      )
      on conflict (id) do update set
        slug = excluded.slug,
        name = excluded.name,
        category = excluded.category,
        producer_id = excluded.producer_id,
        unit = excluded.unit,
        price_bani = excluded.price_bani,
        bulk_qty = excluded.bulk_qty,
        bulk_price_bani = excluded.bulk_price_bani,
        step = excluded.step,
        stock = excluded.stock,
        image = excluded.image,
        blurb = excluded.blurb,
        visible = excluded.visible,
        featured = excluded.featured,
        sort_order = excluded.sort_order
    `;
    return { ok: true as const };
  });

export const patchProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      priceBani: z.number().int().nonnegative().optional(),
      stock: z.number().optional(),
      visible: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    if (data.priceBani != null) {
      await sql`update products set price_bani = ${data.priceBani} where id = ${data.id}`;
    }
    if (data.stock != null) {
      await sql`update products set stock = ${data.stock} where id = ${data.id}`;
    }
    if (data.visible != null) {
      await sql`update products set visible = ${data.visible} where id = ${data.id}`;
    }
    return { ok: true as const };
  });

const producerInput = z.object({
  id: z.string(),
  name: z.string().min(1),
  village: z.string(),
  county: z.string(),
  blurb: z.string(),
  rating: z.number(),
  ratingCount: z.number().int(),
  km: z.number(),
  pickup: z.boolean(),
  delivery: z.boolean(),
  deliveryFeeBani: z.number().int().nonnegative(),
  freeOverBani: z.number().int().nonnegative(),
  minOrderBani: z.number().int().nonnegative(),
  phone: z.string(),
  image: z.string(),
  avatar: z.string().optional().default(""),
  active: z.boolean(),
  socialIntro: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  instagram: z.string().optional().default(""),
  youtube: z.string().optional().default(""),
  tiktok: z.string().optional().default(""),
  website: z.string().optional().default(""),
});

export const saveProducer = createServerFn({ method: "POST" })
  .validator(producerInput)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureProducerAvatar(sql);
    await ensureProducerSocial(sql);
    const social = normalizeSocial(pickSocial(data));
    const avatar = data.avatar || data.image || "";
    await sql`
      insert into producers (
        id, name, village, county, blurb, rating, rating_count, km,
        pickup, delivery, delivery_fee_bani, free_over_bani, min_order_bani,
        phone, image, avatar, active,
        social_intro, social_facebook, social_instagram, social_youtube,
        social_tiktok, social_website
      ) values (
        ${data.id}, ${data.name}, ${data.village}, ${data.county}, ${data.blurb},
        ${data.rating}, ${data.ratingCount}, ${data.km}, ${data.pickup}, ${data.delivery},
        ${data.deliveryFeeBani}, ${data.freeOverBani}, ${data.minOrderBani},
        ${data.phone}, ${data.image}, ${avatar}, ${data.active},
        ${social.intro}, ${social.facebook}, ${social.instagram}, ${social.youtube},
        ${social.tiktok}, ${social.website}
      )
      on conflict (id) do update set
        name = excluded.name,
        village = excluded.village,
        county = excluded.county,
        blurb = excluded.blurb,
        rating = excluded.rating,
        rating_count = excluded.rating_count,
        km = excluded.km,
        pickup = excluded.pickup,
        delivery = excluded.delivery,
        delivery_fee_bani = excluded.delivery_fee_bani,
        free_over_bani = excluded.free_over_bani,
        min_order_bani = excluded.min_order_bani,
        phone = excluded.phone,
        image = excluded.image,
        avatar = excluded.avatar,
        active = excluded.active,
        social_intro = excluded.social_intro,
        social_facebook = excluded.social_facebook,
        social_instagram = excluded.social_instagram,
        social_youtube = excluded.social_youtube,
        social_tiktok = excluded.social_tiktok,
        social_website = excluded.social_website
    `;
    return { ok: true as const };
  });

export const renameProducer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), name: z.string().min(2).max(80) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update producers set name = ${data.name.trim()} where id = ${data.id}`;
    return { ok: true as const };
  });

const storyInput = z.object({
  id: z.string(),
  slug: z.string(),
  producerId: z.string(),
  title: z.string(),
  excerpt: z.string(),
  body: z.string(),
});

export const saveStory = createServerFn({ method: "POST" })
  .validator(storyInput)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into stories (id, slug, producer_id, title, excerpt, body)
      values (${data.id}, ${data.slug}, ${data.producerId}, ${data.title}, ${data.excerpt}, ${data.body})
      on conflict (id) do update set
        slug = excluded.slug,
        producer_id = excluded.producer_id,
        title = excluded.title,
        excerpt = excluded.excerpt,
        body = excluded.body
    `;
    return { ok: true as const };
  });

const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  producerId: z.string(),
  producerName: z.string(),
  qty: z.number(),
  unit: z.string(),
  unitPriceBani: z.number().int(),
  lineBani: z.number().int(),
  fulfillment: z.enum(["ridicare", "livrare"]),
});

export const createOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerName: z.string().min(2),
      customerPhone: z.string().min(8),
      customerNote: z.string(),
      address: z.string(),
      items: z.array(orderItemSchema).min(1),
      productsBani: z.number().int(),
      deliveryBani: z.number().int(),
      totalBani: z.number().int(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("cmd");
    await sql`
      insert into orders (
        id, customer_name, customer_phone, customer_note, address, status,
        items_json, products_bani, delivery_bani, total_bani
      ) values (
        ${id}, ${data.customerName}, ${data.customerPhone}, ${data.customerNote},
        ${data.address}, ${"noua"}, ${JSON.stringify(data.items)},
        ${data.productsBani}, ${data.deliveryBani}, ${data.totalBani}
      )
    `;
    for (const item of data.items) {
      await sql`
        update products
        set stock = greatest(0, stock - ${item.qty})
        where id = ${item.productId}
      `;
    }
    return { id };
  });

export const listOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShopOrder[]> => {
    const sql = await getSql();
    const rows = (await sql`select * from orders order by created_at desc`) as Record<
      string,
      unknown
    >[];
    return rows.map((r) => {
      let items: OrderItem[] = [];
      try {
        items = JSON.parse(String(r.items_json || "[]")) as OrderItem[];
      } catch {
        items = [];
      }
      return {
        id: String(r.id),
        customerName: String(r.customer_name),
        customerPhone: String(r.customer_phone),
        customerNote: String(r.customer_note ?? ""),
        address: String(r.address ?? ""),
        status: String(r.status) as OrderStatus,
        items,
        productsBani: num(r.products_bani),
        deliveryBani: num(r.delivery_bani),
        totalBani: num(r.total_bani),
        createdAt: String(r.created_at),
      };
    });
  },
);

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      status: z.enum(["noua", "confirmata", "pregatita", "gata", "anulata"]),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update orders set status = ${data.status} where id = ${data.id}`;
    return { ok: true as const };
  });

export const createMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      producerId: z.string(),
      customerName: z.string().min(2),
      customerPhone: z.string().min(8),
      body: z.string().min(2),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("msg");
    await sql`
      insert into messages (id, producer_id, customer_name, customer_phone, body)
      values (${id}, ${data.producerId}, ${data.customerName}, ${data.customerPhone}, ${data.body})
    `;
    return { id };
  });

export const listMessages = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShopMessage[]> => {
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    const rows = (await sql`select * from messages order by created_at desc`) as Record<
      string,
      unknown
    >[];
    return rows.map((r) => ({
      id: String(r.id),
      producerId: String(r.producer_id),
      customerName: String(r.customer_name),
      customerPhone: String(r.customer_phone),
      body: String(r.body),
      createdAt: String(r.created_at),
      hidden: bool(r.hidden),
    }));
  },
);

export const updateMessage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), body: z.string().min(2) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update messages set body = ${data.body.trim()} where id = ${data.id}`;
    return { ok: true as const };
  });

export const setMessageHidden = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), hidden: z.boolean() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureHiddenColumns(sql);
    await sql`update messages set hidden = ${data.hidden} where id = ${data.id}`;
    return { ok: true as const };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`delete from messages where id = ${data.id}`;
    return { ok: true as const };
  });
