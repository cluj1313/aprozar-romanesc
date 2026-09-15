export type Producer = {
  id: string;
  name: string;
  village: string;
  county: string;
  blurb: string;
  rating: number;
  ratingCount: number;
  km: number;
  pickup: boolean;
  delivery: boolean;
  deliveryFeeBani: number;
  freeOverBani: number;
  minOrderBani: number;
  phone: string;
  image: string;
  avatar?: string;
  socialIntro: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  website: string;
  active: boolean;
  blocked: boolean;
  warningCount: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  producerId: string;
  unit: string;
  priceBani: number;
  bulkQty: number | null;
  bulkPriceBani: number | null;
  step: number;
  stock: number;
  image: string;
  blurb: string;
  visible: boolean;
  featured: boolean;
  sortOrder: number;
};

export type Story = {
  id: string;
  slug: string;
  producerId: string;
  title: string;
  excerpt: string;
  body: string;
};

export type Category = {
  id: string;
  label: string;
  sortOrder: number;
};

export type SiteCopy = {
  id: string;
  body: string;
  sortOrder: number;
};

export type AnnouncementAudience = "all" | "buyers" | "producers" | "user";

export type Announcement = {
  id: string;
  audience: AnnouncementAudience;
  userId: string | null;
  title: string;
  body: string;
  createdAt: string;
  hidden: boolean;
  image: string;
  linkUrl: string;
};

export type AdPosition =
  | "cart_below"
  | "home_top"
  | "home_mid"
  | "home_bottom"
  | "favorites_more"
  | "checkout_more"
  | "every_fifth"
  | "account_bottom";
export type AdOrientation = "horizontal" | "vertical";
export type AdMode = "static" | "carousel";
export type AdStatus = "review" | "queued" | "live" | "rejected";

export type Ad = {
  id: string;
  producerId: string | null;
  productId: string | null;
  title: string;
  body: string;
  position: AdPosition;
  orientation: AdOrientation;
  durationHours: number;
  displaySeconds: number;
  costBani: number;
  mode: AdMode;
  active: boolean;
  image: string;
  createdAt: string;
  status: AdStatus;
  liveAt: string | null;
  rejectReason: string;
  linkUrl: string;
};

export type AdPriceKind = "place" | "days" | "seconds";

export type AdPrice = {
  id: string;
  kind: AdPriceKind;
  key: string;
  priceBani: number;
};

export type SponsorPayment = {
  id: string;
  sponsorId: string;
  monthLabel: string;
  amountBani: number;
  createdAt: string;
};

export type SponsorMessage = {
  id: string;
  sponsorId: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
  hidden: boolean;
};

export type Sponsor = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  payments: SponsorPayment[];
  messages: SponsorMessage[];
};

export type PersonRole = "buyer" | "producer";

export type ShopPerson = {
  id: string;
  name: string;
  phone: string;
  role: PersonRole;
  producerId: string | null;
  visits: number;
  purchases: number;
  warnings: number;
  blockedUntil: string | null;
  blockedForever: boolean;
};

export type ModerationKind = "warning" | "personal" | "block7" | "blockforever";

export type ModerationEvent = {
  id: string;
  personId: string;
  kind: ModerationKind;
  body: string;
  createdAt: string;
};

export type FaqPair = {
  id: string;
  question: string;
  answer: string;
  uses: number;
  createdAt: string;
};

export type HelpTicket = {
  id: string;
  authorName: string;
  authorPhone: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  trained: boolean;
  createdAt: string;
  hidden: boolean;
};

export type PlatformStats = {
  products: number;
  available: number;
  reviews: number;
};

export type AppProfile = {
  id: string;
  name: string;
  tagline: string;
  cover: string;
  avatar: string;
  phone: string;
  socialIntro: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  website: string;
};

export type AppBlock = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
};

export type AppLink = {
  id: string;
  title: string;
  body: string;
  image: string;
  url: string;
  sortOrder: number;
  hidden: boolean;
};

export type AppLiveStats = {
  uniqueVisitors: number;
  producers: number;
  activeClients: number;
};

export type AppPage = {
  profile: AppProfile;
  blocks: AppBlock[];
  apps: AppLink[];
  stats: AppLiveStats;
};

export type Platform = {
  siteCopy: SiteCopy[];
  categories: Category[];
  announcements: Announcement[];
  ads: Ad[];
  adPrices: AdPrice[];
  sponsors: Sponsor[];
  people: ShopPerson[];
  events: ModerationEvent[];
  faq: FaqPair[];
  tickets: HelpTicket[];
  stats: PlatformStats;
  appProfile: AppProfile;
  appBlocks: AppBlock[];
  appApps: AppLink[];
  live: AppLiveStats;
};

export type Catalog = {
  producers: Producer[];
  products: Product[];
  stories: Story[];
  categories: Category[];
  siteCopy: SiteCopy[];
  ads: Ad[];
  announcements: Announcement[];
  adPrices: AdPrice[];
};

export type CartItem = {
  productId: string;
  qty: number;
  fulfillment: "ridicare" | "livrare";
};

export type Session =
  | { role: "guest" }
  | { role: "admin"; name: string; email: string; phone: string }
  | { role: "producer"; producerId: string };

export type LoginHints = {
  names: string[];
  emails: string[];
  phones: string[];
};

export type LastLogin = {
  name: string;
  email: string;
  phone: string;
};

export type OrderStatus = "noua" | "confirmata" | "pregatita" | "gata" | "anulata";

export type OrderItem = {
  productId: string;
  productName: string;
  producerId: string;
  producerName: string;
  qty: number;
  unit: string;
  unitPriceBani: number;
  lineBani: number;
  fulfillment: "ridicare" | "livrare";
};

export type ShopOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  address: string;
  status: OrderStatus;
  items: OrderItem[];
  productsBani: number;
  deliveryBani: number;
  totalBani: number;
  createdAt: string;
};

export type SavedOrderItem = OrderItem & {
  productSlug: string;
  producerPhone: string;
  image: string;
  step: number;
};

export type SavedOrder = {
  id: string;
  createdAt: string;
  totalBani: number;
  productsBani: number;
  deliveryBani: number;
  address: string;
  note: string;
  customerName: string;
  customerPhone: string;
  slot: string;
  status: OrderStatus;
  items: SavedOrderItem[];
};

export type ShopMessage = {
  id: string;
  producerId: string;
  customerName: string;
  customerPhone: string;
  body: string;
  createdAt: string;
  hidden: boolean;
};
