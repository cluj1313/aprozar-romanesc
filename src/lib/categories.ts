export const DEFAULT_CATEGORIES = [
  { id: "fructe", label: "Fructe" },
  { id: "legume", label: "Legume" },
  { id: "cartofi-ceapa", label: "Cartofi și ceapă" },
  { id: "lactate", label: "Lactate" },
  { id: "grane", label: "Cereale" },
  { id: "panificatie", label: "Panificație" },
  { id: "miere", label: "Miere" },
  { id: "dulceturi", label: "Dulcețuri" },
  { id: "carne-oua", label: "Carne și ouă" },
  { id: "muraturi", label: "Conserve și murături" },
  { id: "bauturi", label: "Băuturi" },
  { id: "ceaiuri", label: "Plante și ceaiuri" },
  { id: "altele", label: "Altele" },
] as const;

/** @deprecated use DEFAULT_CATEGORIES or catalog.categories */
export const CATEGORIES = DEFAULT_CATEGORIES;

export type CategoryId = (typeof DEFAULT_CATEGORIES)[number]["id"];

export function categoryLabel(id: string, list?: { id: string; label: string }[]) {
  return list?.find((c) => c.id === id)?.label ?? DEFAULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const PRODUCER_PIN = "taraba";
/** @deprecated producers use PRODUCER_PIN; admin logs in with email + phone */
export const ADMIN_PIN = PRODUCER_PIN;
