export const FONT_CHOICES = [
  { id: "oswald", label: "Oswald", hint: "înalt, clar la preț", family: "Oswald, sans-serif" },
  { id: "barlow", label: "Condensat", hint: "îngust și înalt", family: "Barlow Condensed, sans-serif" },
  { id: "plex", label: "Plex", hint: "litere drepte", family: "IBM Plex Sans Condensed, sans-serif" },
  { id: "rotund", label: "Rotund", hint: "moale, rotunjit", family: "Oswald, sans-serif" },
] as const;

export type FontId = (typeof FONT_CHOICES)[number]["id"];
