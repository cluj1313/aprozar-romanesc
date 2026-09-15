import { stripDiacritics } from "@/lib/utils";

export type AdVerdict = { ok: true } | { ok: false; reason: string; category: string };

type Rule = {
  category: string;
  reason: string;
  terms: string[];
};

/** Whole terms / phrases. Matched after diacritics + leet folding. Food, wine, țuică stay allowed. */
const RULES: Rule[] = [
  {
    category: "droguri",
    reason: "Reclama pare să vândă droguri sau substanțe interzise.",
    terms: [
      "cocaina",
      "heroina",
      "metanfetamina",
      "amfetamina",
      "mdma",
      "extasy",
      "ecstasy",
      "lsd",
      "fentanil",
      "fentanyl",
      "hasis",
      "hashish",
      "marijuana",
      "cannabis",
      "canabis",
      "weed",
      "skunk",
      "ketamina",
      "cristal meth",
      "metamfetamina",
      "opiacee",
      "opiu",
      "crack cocaine",
    ],
  },
  {
    category: "arme",
    reason: "Reclama pare să vândă arme, muniție sau explozibili.",
    terms: [
      "arma de foc",
      "arme de foc",
      "vand pistol",
      "vand pusca",
      "vand arma",
      "kalashnikov",
      "ak-47",
      "ak47",
      "explozibil",
      "explozibili",
      "dinamita",
      "grenada",
      "munitie",
      "gloante",
      "glonte",
    ],
  },
  {
    category: "medicamente",
    reason: "Reclama pare să vândă medicamente fără rețetă sau substanțe controlate.",
    terms: [
      "viagra",
      "cialis",
      "tramadol",
      "xanax",
      "anabolizante",
      "steroizi",
      "steroid",
      "oxiContin",
      "oxycodone",
      "fentanyl",
    ],
  },
  {
    category: "acte false",
    reason: "Reclama pare să vândă acte false sau falsificate.",
    terms: [
      "buletin fals",
      "permis fals",
      "pasaport fals",
      "diploma falsa",
      "acte false",
      "documente false",
      "falsific",
    ],
  },
  {
    category: "hotie",
    reason: "Reclama pare să vândă marfă furată.",
    terms: ["marfa furata", "din spargere", "hotie", "furat de la"],
  },
  {
    category: "adult",
    reason: "Reclama are conținut sexual, interzis pe tarabă.",
    terms: ["pornografie", "porno", "xxx video", "escorta", "escort", "camgirl", "onlyfans"],
  },
  {
    category: "inselaciune",
    reason: "Reclama pare o înșelătorie sau schemă de bani rapizi.",
    terms: [
      "castig garantat",
      "schema ponzi",
      "ponzi",
      "investitie crypto garantat",
      "forex semnale",
      "bani de acasa garantat",
      "piramida financiara",
    ],
  },
  {
    category: "trafic",
    reason: "Reclama atinge trafic de persoane sau organe — interzis.",
    terms: ["trafic de persoane", "vand organe", "trafic de organe"],
  },
];

function foldLeet(s: string) {
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i] ?? "";
    const nearLetter = /[a-z]/i.test(s[i - 1] ?? "") || /[a-z]/i.test(s[i + 1] ?? "");
    if (!nearLetter) {
      out += ch;
      continue;
    }
    if (ch === "0") out += "o";
    else if (ch === "1") out += "i";
    else if (ch === "3") out += "e";
    else if (ch === "4") out += "a";
    else if (ch === "5") out += "s";
    else if (ch === "@") out += "a";
    else if (ch === "$") out += "s";
    else out += ch;
  }
  return out;
}

function normalizeAdText(raw: string) {
  const folded = foldLeet(stripDiacritics(raw));
  return folded.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function hasTerm(hay: string, term: string) {
  const needle = normalizeAdText(term);
  if (!needle) return false;
  const padded = ` ${hay} `;
  if (needle.includes(" ")) return padded.includes(` ${needle} `);
  return padded.includes(` ${needle} `);
}

export function moderateAdCopy(title: string, body = ""): AdVerdict {
  const hay = normalizeAdText(`${title} ${body}`);
  if (!hay) return { ok: true };
  for (const rule of RULES) {
    for (const term of rule.terms) {
      if (hasTerm(hay, term)) {
        return { ok: false, reason: rule.reason, category: rule.category };
      }
    }
  }
  return { ok: true };
}
