export const AD_BLOCK_YEAR_BANI = 5000;
export const AD_BLOCK_FOREVER_BANI = 10000;
export const AD_BLOCK_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type AdsBlockedUntil = string | null;

export function adsAreBlocked(until: AdsBlockedUntil) {
  if (!until) return false;
  if (until === "forever") return true;
  const t = Date.parse(until);
  return Number.isFinite(t) && t > Date.now();
}

export function nextAdsBlockUntil(kind: "year" | "forever", current: AdsBlockedUntil): string {
  if (kind === "forever" || current === "forever") return "forever";
  const base = current ? Date.parse(current) : NaN;
  const from = Number.isFinite(base) && base > Date.now() ? base : Date.now();
  return new Date(from + AD_BLOCK_YEAR_MS).toISOString();
}

export function adsBlockCopy(until: AdsBlockedUntil) {
  if (!adsAreBlocked(until)) return null;
  if (until === "forever") return "Reclamele sunt oprite pentru totdeauna, pe telefonul ăsta.";
  const d = new Date(until as string);
  const label = d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
  return `Reclamele sunt oprite până pe ${label}.`;
}
