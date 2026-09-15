import { DEFAULT_CATEGORIES } from "@/lib/categories";

export const SEED_SITE_COPY = [
  {
    id: "p1",
    sortOrder: 1,
    body: "Aici, producătorii locali români își pun roșiile, cașul, mierea și pâinea de casă direct la oameni, fără raft de supermarket și fără drum lung. Cumpărătorul vede de unde vine mâncarea, vorbește cu omul care a crescut-o și plătește un preț cinstit. Banii rămân în sat.",
  },
  {
    id: "p2",
    sortOrder: 2,
    body: "Asta vrem: gust adevărat, oameni cu nume și prenume, drum scurt de la brazdă până la farfurie. Dacă ții o grădină, o livadă sau o stupină — pune-ți taraba. Dacă vrei mâncare ca acasă — comandă de lângă tine.",
  },
  {
    id: "p3",
    sortOrder: 3,
    body: "(Șterge aceste rânduri și scrie tu ce vrei să faci cu aplicația.)",
  },
];

export const SEED_CATEGORIES = DEFAULT_CATEGORIES.map((c, i) => ({
  id: c.id,
  label: c.label,
  sortOrder: i + 1,
}));

export const SEED_ANNOUNCEMENTS = [
  {
    id: "an-promo-an",
    audience: "all" as const,
    userId: null as string | null,
    title: "Reclame gratis 1 an",
    body: "Reclamele vor fi gratis în primul an de când v-ați logat în aplicație.",
    createdAt: "2026-09-06T08:00:00.000Z",
    image: "",
    linkUrl: "",
  },
];

export const SEED_APP_PROFILE = {
  id: "main",
  name: "Aprozar Românesc",
  tagline: "Cioban Iosif Gabriel — 100% românesc, direct din grădină.",
  cover: "/images/splash.png",
  avatar: "/images/logo-badge.png",
  phone: "0770148119",
  socialIntro: "Urmărește aplicația — noutăți, grădini și celelalte proiecte.",
  facebook: "https://www.facebook.com/aprozarromanesc",
  instagram: "",
  youtube: "",
  tiktok: "",
  website: "https://aprozar-rom.com",
};

export const SEED_APP_BLOCKS = [
  {
    id: "b1",
    sortOrder: 1,
    title: "De la brazdă la farfurie",
    body: "Aici, producătorii locali români își pun roșiile, cașul, mierea și pâinea de casă direct la oameni, fără raft de supermarket și fără drum lung. Cumpărătorul vede de unde vine mâncarea, vorbește cu omul care a crescut-o și plătește un preț cinstit. Banii rămân în sat.",
  },
  {
    id: "b2",
    sortOrder: 2,
    title: "Gust adevărat, oameni cu nume",
    body: "Asta vrem: gust adevărat, oameni cu nume și prenume, drum scurt de la brazdă până la farfurie. Dacă ții o grădină, o livadă sau o stupină — pune-ți taraba. Dacă vrei mâncare ca acasă — comandă de lângă tine.",
  },
  {
    id: "b3",
    sortOrder: 3,
    title: "Cine ține aplicația",
    body: "Aplicația e a lui Cioban Iosif Gabriel. El pune categoriile, anunțurile și reclamele. Taraba rămâne a ta. Dacă vrei să-i scrii, WhatsApp și telefonul sunt pe copertă.",
  },
];

export const SEED_APP_APPS = [
  {
    id: "app-servicii",
    sortOrder: 0,
    title: "Servicii Locale",
    body: "Toți meșterii din jurul tău",
    image: "/images/banner-servicii-apps.jpg",
    url: "https://cluj1313.github.io/",
  },
  {
    id: "app-trading",
    sortOrder: 1,
    title: "Ciubi Trading Companion",
    body: "Planul, jurnalul și disciplina — forex și acțiuni.",
    image: "/images/banner-trading-apps.jpg",
    url: "https://cluj1313.github.io/ciubi-trading-companion3/",
  },
];

export const SEED_SPONSORS = [
  {
    id: "sp-somes",
    name: "Mihai Someșan",
    company: "Lactate Someș",
    phone: "0740 200 100",
    email: "lactate@somes.ro",
  },
  {
    id: "sp-cluj",
    name: "Ioan Brutar",
    company: "Panificație Cluj",
    phone: "0740 200 200",
    email: "paine@cluj.ro",
  },
];

export const SEED_SPONSOR_PAYMENTS = [
  {
    id: "pay-somes-1",
    sponsorId: "sp-somes",
    monthLabel: "septembrie 2026",
    amountBani: 25000,
  },
];

export const SEED_SPONSOR_MESSAGES = [
  {
    id: "smsg-1",
    sponsorId: "sp-somes",
    fromAdmin: true,
    body: "Mulțumim pentru sprijin. Reclama Lactate Someș e sus pe Acasă.",
    createdAt: "2026-09-05T10:00:00.000Z",
  },
];

export const SEED_PEOPLE = [
  {
    id: "buy-ana",
    name: "Ana Pop",
    phone: "0744 111 222",
    role: "buyer" as const,
    producerId: null as string | null,
    visits: 12,
    purchases: 4,
    warnings: 0,
  },
  {
    id: "buy-mihai",
    name: "Mihai Radu",
    phone: "0722 333 444",
    role: "buyer" as const,
    producerId: null as string | null,
    visits: 7,
    purchases: 2,
    warnings: 0,
  },
  {
    id: "buy-ioana",
    name: "Ioana Enache",
    phone: "0755 666 777",
    role: "buyer" as const,
    producerId: null as string | null,
    visits: 3,
    purchases: 1,
    warnings: 0,
  },
  {
    id: "buy-elena",
    name: "Elena Dinu",
    phone: "0733 888 999",
    role: "buyer" as const,
    producerId: null as string | null,
    visits: 1,
    purchases: 0,
    warnings: 0,
  },
  {
    id: "prod-nelu",
    name: "Nelu",
    phone: "0744 100 201",
    role: "producer" as const,
    producerId: "nelu" as string | null,
    visits: 40,
    purchases: 0,
    warnings: 0,
  },
  {
    id: "prod-mama",
    name: "Ioana",
    phone: "0745 200 302",
    role: "producer" as const,
    producerId: "mama" as string | null,
    visits: 28,
    purchases: 0,
    warnings: 0,
  },
  {
    id: "prod-marin",
    name: "Marin",
    phone: "0722 300 403",
    role: "producer" as const,
    producerId: "marin" as string | null,
    visits: 22,
    purchases: 0,
    warnings: 0,
  },
  {
    id: "prod-moise",
    name: "Moise",
    phone: "0733 400 504",
    role: "producer" as const,
    producerId: "moise" as string | null,
    visits: 18,
    purchases: 0,
    warnings: 0,
  },
  {
    id: "prod-vasile",
    name: "Vasile",
    phone: "0766 500 605",
    role: "producer" as const,
    producerId: "vasile" as string | null,
    visits: 15,
    purchases: 0,
    warnings: 0,
  },
  {
    id: "sp-person-somes",
    name: "Mihai Someșan",
    phone: "0740 200 100",
    role: "sponsor" as const,
    producerId: null as string | null,
    visits: 6,
    purchases: 0,
    warnings: 0,
  },
  {
    id: "sp-person-cluj",
    name: "Ioan Brutar",
    phone: "0740 200 200",
    role: "sponsor" as const,
    producerId: null as string | null,
    visits: 4,
    purchases: 0,
    warnings: 0,
  },
];

export const SEED_MODERATION: { id: string; personId: string; kind: string; body: string }[] = [];

export const SEED_FAQ = [
  {
    id: "faq-1",
    question: "Cum comand?",
    answer:
      "Pui marfa în coș, apoi Mergi la comandă. Ridicare din curte sau livrare, după ce-ți spune producătorul.",
  },
  {
    id: "faq-2",
    question: "Cine e administratorul?",
    answer: "Cioban Iosif Gabriel ține aplicația — categorii, anunțuri, reclame. Nu intră în taraba ta.",
  },
  {
    id: "faq-3",
    question: "Cum pun o reclamă?",
    answer:
      "Din tarabă sau din Admin alegi locul, zilele și secundele. Plătești trimițând aplicația la 3–5 oameni. Reclama trece întâi pe la aprobare. Dacă sunt deja 10 reclame live pe același loc, așteaptă la rând — poziția se vede în Cont. Primul an e gratis.",
  },
];

export const SEED_TICKETS = [
  {
    id: "tkt-1",
    authorName: "Ana Pop",
    authorPhone: "0744 111 222",
    question: "Livrați sâmbăta după-amiază?",
  },
];

export const SEED_ADS = [
  {
    id: "ad-ferma",
    producerId: "marin",
    productId: null as string | null,
    title: "Ferma Dâmbovița",
    body: "Cașul de la Marin, afumat pe fag.",
    position: "home_bottom" as const,
    orientation: "horizontal" as const,
    durationHours: 72,
    displaySeconds: 5,
    mode: "static" as const,
    active: true,
    image: "/images/ferma.jpg",
    status: "live" as const,
  },
  {
    id: "ad-rosii",
    producerId: "nelu",
    productId: "rosii",
    title: "Roșii Țărănești astăzi 20% reducere !!!",
    body: "",
    position: "home_bottom" as const,
    orientation: "horizontal" as const,
    durationHours: 48,
    displaySeconds: 5,
    mode: "static" as const,
    active: true,
    image: "/images/rosii.jpg",
    status: "live" as const,
  },
  {
    id: "ad-miere-review",
    producerId: "vasile",
    productId: "miere",
    title: "Miere de tei",
    body: "Nepasteurizată, din teiul de la Fetești.",
    position: "home_bottom" as const,
    orientation: "horizontal" as const,
    durationHours: 168,
    displaySeconds: 5,
    mode: "static" as const,
    active: true,
    image: "/images/miere.jpg",
    status: "review" as const,
  },
  {
    id: "ad-servicii",
    producerId: null as string | null,
    productId: null as string | null,
    title: "Servicii Locale",
    body: "Toți meșterii din jurul tău",
    position: "home_bottom" as const,
    orientation: "horizontal" as const,
    durationHours: 8760,
    displaySeconds: 10,
    mode: "static" as const,
    active: true,
    image: "/images/banner-servicii-v2.jpg",
    status: "live" as const,
    linkUrl: "https://cluj1313.github.io/",
  },
];
