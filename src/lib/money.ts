export type Unit = "kg" | "buc" | "borcan" | "cutie" | "sticla" | "punga" | "ladita";

export const UNITS: { id: Unit; label: string }[] = [
  { id: "kg", label: "kilogram" },
  { id: "buc", label: "bucată" },
  { id: "borcan", label: "borcan" },
  { id: "cutie", label: "cutie" },
  { id: "sticla", label: "sticlă" },
  { id: "punga", label: "pungă" },
  { id: "ladita", label: "lădiță" },
];

export function unitLabel(unit: string) {
  return UNITS.find((u) => u.id === unit)?.label ?? unit;
}

export function formatLei(bani: number): string {
  const lei = (bani || 0) / 100;
  return `${lei.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
}

export function formatLeiPlain(bani: number): string {
  const lei = (bani || 0) / 100;
  return lei.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatQty(qty: number, unit: string): string {
  const n = Number(qty);
  const shown = Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("ro-RO", { maximumFractionDigits: 2 });
  return `${shown} ${unit}`;
}

export function parseLeiToBani(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace("lei", "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

/** Price per unit after quantity discount, if any. */
export function unitPriceBani(opts: {
  qty: number;
  priceBani: number;
  bulkQty: number | null;
  bulkPriceBani: number | null;
}): number {
  if (
    opts.bulkQty &&
    opts.bulkPriceBani &&
    opts.bulkQty > 0 &&
    opts.qty + 1e-9 >= opts.bulkQty
  ) {
    return opts.bulkPriceBani;
  }
  return opts.priceBani;
}

export function lineTotalBani(opts: {
  qty: number;
  priceBani: number;
  bulkQty: number | null;
  bulkPriceBani: number | null;
}): number {
  const unit = unitPriceBani(opts);
  return Math.round(opts.qty * unit);
}

export function roundToStep(qty: number, step: number): number {
  const s = step > 0 ? step : 1;
  const r = Math.round(qty / s) * s;
  const decimals = String(s).includes(".") ? String(s).split(".")[1].length : 0;
  return Number(Math.max(s, r).toFixed(decimals));
}
