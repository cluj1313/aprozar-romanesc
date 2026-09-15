import type { Ad, AdPosition, AdStatus, ShopPerson } from "@/lib/types";

export const LEAD_AD_SECONDS = 10;

export function isLeadAd(ad: Pick<Ad, "id" | "title" | "linkUrl">) {
  if (ad.id === "ad-servicii") return true;
  if (/cluj1313\.github\.io/i.test(ad.linkUrl ?? "")) return true;
  if (ad.title.trim().toLowerCase() === "servicii locale") return true;
  return false;
}

/** Max simultaneous live ads on one placement. Extra ads wait in queue. */
export const AD_SLOT_CAP = 10;

export const AD_STAGE_PILLS = ["Trimis către aprobare", "În așteptare", "Live"] as const;

export function adStatusOf(ad: Pick<Ad, "status"> | null | undefined): AdStatus {
  const s = ad?.status;
  if (s === "review" || s === "queued" || s === "live" || s === "rejected") return s;
  return "live";
}

function startMs(ad: Pick<Ad, "liveAt" | "createdAt">) {
  const raw = ad.liveAt || ad.createdAt;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : NaN;
}

export function remainingMs(ad: Pick<Ad, "liveAt" | "createdAt" | "durationHours">, now = Date.now()) {
  const start = startMs(ad);
  if (!Number.isFinite(start)) return ad.durationHours * 3600 * 1000;
  return ad.durationHours * 3600 * 1000 - (now - start);
}

export function isAdLive(ad: Ad, now = Date.now()) {
  if (!ad.active) return false;
  if (adStatusOf(ad) !== "live") return false;
  return remainingMs(ad, now) > 0;
}

export function daysLeft(ad: Ad, now = Date.now()) {
  const ms = remainingMs(ad, now);
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / (24 * 3600 * 1000)));
}

export function remainingLabel(ad: Ad, now = Date.now()) {
  if (adStatusOf(ad) !== "live") return "";
  const ms = remainingMs(ad, now);
  if (ms <= 0) return "Campania s-a încheiat";
  if (ms < 24 * 3600 * 1000) {
    const hours = Math.max(1, Math.ceil(ms / (3600 * 1000)));
    return hours === 1 ? "Mai e o oră" : `Mai sunt ${hours} ore`;
  }
  const days = Math.ceil(ms / (24 * 3600 * 1000));
  if (days === 1) return "Mai e o zi";
  return `Mai sunt ${days} zile`;
}

export function queuePosition(ad: Ad, all: Ad[]) {
  if (adStatusOf(ad) !== "queued") return 0;
  const queued = all
    .filter((a) => adStatusOf(a) === "queued" && a.position === ad.position)
    .sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
  const i = queued.findIndex((a) => a.id === ad.id);
  return i < 0 ? 0 : i + 1;
}

export function liveCountOn(position: AdPosition, all: Ad[], now = Date.now()) {
  return all.filter((a) => a.position === position && isAdLive(a, now)).length;
}

/** 0 review, 1 queued, 2 live, -1 rejected. */
export function adStage(ad: Ad): -1 | 0 | 1 | 2 {
  const s = adStatusOf(ad);
  if (s === "review") return 0;
  if (s === "queued") return 1;
  if (s === "live") return 2;
  return -1;
}

export function adListRank(ad: Ad, now = Date.now()) {
  const s = adStatusOf(ad);
  if (s === "review") return 0;
  if (s === "queued") return 1;
  if (s === "live" && isAdLive(ad, now)) return 2;
  if (s === "live") return 3;
  return 4;
}

export function isPersonBlocked(p: ShopPerson, now = Date.now()) {
  if (p.blockedForever) return true;
  if (!p.blockedUntil) return false;
  const t = new Date(p.blockedUntil).getTime();
  return Number.isFinite(t) && t > now;
}
