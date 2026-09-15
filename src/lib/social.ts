export type SocialKey = "facebook" | "instagram" | "youtube" | "tiktok" | "website";

export type SocialValues = {
  intro: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  website: string;
};

export type SocialFields = {
  socialIntro: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  website: string;
};

export const EMPTY_SOCIAL: SocialValues = {
  intro: "",
  facebook: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  website: "",
};

export const EMPTY_SOCIAL_FIELDS: SocialFields = {
  socialIntro: "",
  facebook: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  website: "",
};

export const DEFAULT_PRODUCER_SOCIAL_INTRO =
  "Urmărește grădina — vezi marfa de azi, ce culegem și viața de la poartă.";

export const DEFAULT_APP_SOCIAL_INTRO =
  "Urmărește aplicația — noutăți, grădini și celelalte proiecte.";

export const SOCIAL_NETWORKS: {
  id: SocialKey;
  label: string;
  placeholder: string;
  colorClass: string;
}[] = [
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "facebook.com/gradina-ta sau @gradina",
    colorClass: "text-facebook",
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "instagram.com/gradina-ta sau @gradina",
    colorClass: "text-instagram",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "youtube.com/@gradina-ta",
    colorClass: "text-youtube",
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "tiktok.com/@gradina-ta",
    colorClass: "text-tiktok",
  },
  {
    id: "website",
    label: "Alt link",
    placeholder: "site-ul tău sau altceva — https://…",
    colorClass: "text-primary",
  },
];

export function pickSocial(p: Partial<SocialFields> | null | undefined): SocialValues {
  return {
    intro: p?.socialIntro ?? "",
    facebook: p?.facebook ?? "",
    instagram: p?.instagram ?? "",
    youtube: p?.youtube ?? "",
    tiktok: p?.tiktok ?? "",
    website: p?.website ?? "",
  };
}

export function socialFromRow(r: Record<string, unknown>): SocialFields {
  return {
    socialIntro: String(r.social_intro ?? ""),
    facebook: String(r.social_facebook ?? ""),
    instagram: String(r.social_instagram ?? ""),
    youtube: String(r.social_youtube ?? ""),
    tiktok: String(r.social_tiktok ?? ""),
    website: String(r.social_website ?? ""),
  };
}

export function withSocial<T>(base: T, s: SocialValues): T & SocialFields {
  return {
    ...base,
    socialIntro: s.intro,
    facebook: s.facebook,
    instagram: s.instagram,
    youtube: s.youtube,
    tiktok: s.tiktok,
    website: s.website,
  };
}

function blockedScheme(raw: string) {
  const lower = raw.trim().toLowerCase();
  return (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  );
}

function asHttps(raw: string): string {
  const t = raw.trim();
  if (!t || blockedScheme(t)) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/\//, "")}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    u.protocol = "https:";
    return u.toString();
  } catch {
    return "";
  }
}

export function socialHref(network: SocialKey, raw: string): string {
  const t = raw.trim();
  if (!t || blockedScheme(t)) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("//") || t.includes(".")) {
    return asHttps(t);
  }
  const handle = t.replace(/^@/, "").replace(/^\//, "").trim();
  if (!handle || /[^\w.-]/.test(handle.replace(/_/g, ""))) {
    const cleaned = handle.replace(/[^\w.-]/g, "");
    if (!cleaned) return "";
    return hostUrl(network, cleaned);
  }
  return hostUrl(network, handle);
}

function hostUrl(network: SocialKey, handle: string): string {
  switch (network) {
    case "facebook":
      return `https://www.facebook.com/${handle}`;
    case "instagram":
      return `https://www.instagram.com/${handle}`;
    case "youtube":
      return handle.startsWith("UC") && handle.length >= 20
        ? `https://www.youtube.com/channel/${handle}`
        : `https://www.youtube.com/@${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "website":
      return asHttps(handle);
  }
}

export function normalizeSocial(s: SocialValues): SocialValues {
  return {
    intro: s.intro.trim().slice(0, 280),
    facebook: socialHref("facebook", s.facebook),
    instagram: socialHref("instagram", s.instagram),
    youtube: socialHref("youtube", s.youtube),
    tiktok: socialHref("tiktok", s.tiktok),
    website: socialHref("website", s.website),
  };
}
