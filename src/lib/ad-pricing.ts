import type { AdPosition, AdPrice, AdPriceKind } from "@/lib/types";

export const SHARE_MIN = 3;
export const SHARE_MAX = 5;

export type Placement = {
  id: AdPosition;
  label: string;
  hint: string;
  priceBani: number;
};

export const AD_PLACEMENTS: Placement[] = [
  {
    id: "home_bottom",
    label: "Jos pe Acasă",
    hint: "Deasupra meniului, tot timpul pe pagina principală",
    priceBani: 2000,
  },
  {
    id: "every_fifth",
    label: "Al cincilea card",
    hint: "Între produse, la fiecare al 5-lea card",
    priceBani: 1200,
  },
  {
    id: "checkout_more",
    label: "La plată",
    hint: "Deasupra prețului de checkout",
    priceBani: 1000,
  },
  {
    id: "favorites_more",
    label: "Favorite",
    hint: "Sub produse, la „Poate te-ar mai interesa și…”",
    priceBani: 600,
  },
  {
    id: "account_bottom",
    label: "Setări / Cont",
    hint: "Jos, pe paginile de setări și cont",
    priceBani: 500,
  },
];

export const AD_DAYS = [
  { days: 1, priceBani: 400 },
  { days: 3, priceBani: 900 },
  { days: 7, priceBani: 1800 },
  { days: 14, priceBani: 3200 },
  { days: 30, priceBani: 5500 },
] as const;

export const AD_SECONDS = [
  { seconds: 3, priceBani: 150 },
  { seconds: 5, priceBani: 250 },
  { seconds: 8, priceBani: 400 },
  { seconds: 10, priceBani: 500 },
  { seconds: 12, priceBani: 650 },
] as const;

export const DEFAULT_AD_SECONDS = 10;

export function priceRowId(kind: AdPriceKind, key: string | number) {
  return `${kind}:${key}`;
}

export function defaultAdPrices(): AdPrice[] {
  return [
    ...AD_PLACEMENTS.map((p) => ({
      id: priceRowId("place", p.id),
      kind: "place" as const,
      key: p.id,
      priceBani: p.priceBani,
    })),
    ...AD_DAYS.map((d) => ({
      id: priceRowId("days", d.days),
      kind: "days" as const,
      key: String(d.days),
      priceBani: d.priceBani,
    })),
    ...AD_SECONDS.map((s) => ({
      id: priceRowId("seconds", s.seconds),
      kind: "seconds" as const,
      key: String(s.seconds),
      priceBani: s.priceBani,
    })),
  ];
}

export function mergeAdPrices(saved: AdPrice[] | undefined): AdPrice[] {
  const map = new Map((saved ?? []).map((p) => [p.id, p]));
  return defaultAdPrices().map((d) => map.get(d.id) ?? d);
}

function priceOf(prices: AdPrice[] | undefined, kind: AdPriceKind, key: string | number, fallback: number) {
  const id = priceRowId(kind, key);
  const hit = (prices ?? []).find((p) => p.id === id);
  return hit?.priceBani ?? fallback;
}

export function placementsOf(prices?: AdPrice[]): Placement[] {
  const merged = mergeAdPrices(prices);
  return AD_PLACEMENTS.map((p) => ({
    ...p,
    priceBani: priceOf(merged, "place", p.id, p.priceBani),
  }));
}

export function daysOf(prices?: AdPrice[]) {
  const merged = mergeAdPrices(prices);
  return AD_DAYS.map((d) => ({
    days: d.days,
    priceBani: priceOf(merged, "days", d.days, d.priceBani),
  }));
}

export function secondsOf(prices?: AdPrice[]) {
  const merged = mergeAdPrices(prices);
  return AD_SECONDS.map((s) => ({
    seconds: s.seconds,
    priceBani: priceOf(merged, "seconds", s.seconds, s.priceBani),
  }));
}

export function daysPrice(days: number, prices?: AdPrice[]) {
  const row = daysOf(prices).find((d) => d.days === days);
  return row?.priceBani ?? AD_DAYS[2].priceBani;
}

export function secondsPrice(seconds: number, prices?: AdPrice[]) {
  const rows = secondsOf(prices);
  return (
    rows.find((s) => s.seconds === seconds)?.priceBani ??
    rows.find((s) => s.seconds === DEFAULT_AD_SECONDS)?.priceBani ??
    rows[3]?.priceBani ??
    500
  );
}

export function placementPrice(ids: AdPosition[], prices?: AdPrice[]) {
  return placementsOf(prices)
    .filter((p) => ids.includes(p.id))
    .reduce((n, p) => n + p.priceBani, 0);
}

export function adTotal(ids: AdPosition[], days: number, seconds: number, prices?: AdPrice[]) {
  return placementPrice(ids, prices) + daysPrice(days, prices) + secondsPrice(seconds, prices);
}

export const SHARE_TEXT =
  "Piețe locale din jurul tău — Aprozar Românesc. 100% naturale, direct din grădină.";
