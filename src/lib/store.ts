import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adsAreBlocked, nextAdsBlockUntil } from "@/lib/ad-block";
import type { FontId } from "@/lib/fonts";
import { roundToStep } from "@/lib/money";
import type { ProducerPacket } from "@/lib/order-message";
import type { CartItem, LastLogin, LoginHints, SavedOrder, Session } from "@/lib/types";

type Prefs = {
  theme: "light" | "dark";
  text: "normal" | "large" | "xl";
  cards: "tall" | "flat";
  font: FontId;
  listsNewestFirst: boolean;
};

export type BrowseFilters = {
  km: number | null;
  category: string | null;
};

type Contact = { name: string; phone: string; address?: string };

type ShopState = {
  items: CartItem[];
  favorites: string[];
  favoriteProducers: string[];
  session: Session;
  prefs: Prefs;
  filters: BrowseFilters;
  myOrderIds: string[];
  myOrders: SavedOrder[];
  cartOpen: boolean;
  loginHints: LoginHints;
  lastLogin: LastLogin | null;
  savedLogins: LastLogin[];
  contact: Contact | null;
  flash: string | null;
  showShare: boolean;
  shareQueue: ProducerPacket[];
  adShareCredits: number;
  promoStartedAt: string | null;
  silencedNoticeIds: string[];
  sessionClosedNoticeIds: string[];
  adsBlockedUntil: string | null;
  add: (productId: string, qty: number, step: number) => void;
  setQty: (productId: string, qty: number, step: number) => void;
  setMany: (
    lines: {
      productId: string;
      qty: number;
      step: number;
      fulfillment?: CartItem["fulfillment"];
    }[],
  ) => void;
  setFulfillment: (productId: string, fulfillment: CartItem["fulfillment"]) => void;
  setProducerFulfillment: (productIds: string[], fulfillment: CartItem["fulfillment"]) => void;
  remove: (productId: string) => void;
  clear: () => void;
  toggleFavorite: (productId: string) => void;
  toggleFavoriteProducer: (producerId: string) => void;
  setSession: (session: Session) => void;
  setPrefs: (prefs: Partial<Prefs>) => void;
  setFilters: (filters: Partial<BrowseFilters>) => void;
  setCartOpen: (open: boolean) => void;
  rememberOrder: (order: SavedOrder) => void;
  hydrateOrders: (orders: SavedOrder[]) => void;
  rememberLogin: (login: LastLogin) => void;
  rememberContact: (contact: Contact) => void;
  setFlash: (flash: string | null) => void;
  setShowShare: (show: boolean) => void;
  setShareQueue: (queue: ProducerPacket[]) => void;
  shiftShareQueue: () => ProducerPacket | null;
  addAdShare: () => number;
  spendAdShares: (n: number) => boolean;
  closeNoticeSession: (id: string) => void;
  silenceNotice: (id: string) => void;
  blockAds: (kind: "year" | "forever") => void;
};

const emptyHints: LoginHints = { names: [], emails: [], phones: [] };

function publicSession(session: Session | { role: "admin" } | undefined): Session {
  if (!session || session.role === "guest") return { role: "guest" };
  if (session.role === "producer") return session;
  const s = session as { role: "admin"; name?: string };
  return {
    role: "admin",
    name: s.name?.trim() || "Administrator",
    email: "",
    phone: "",
  };
}

function cleanLogins(raw: unknown): LastLogin[] {
  if (!Array.isArray(raw)) return [];
  const out: LastLogin[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<LastLogin>;
    const name = String(item.name ?? "").trim();
    const email = String(item.email ?? "").trim();
    const phone = String(item.phone ?? "").trim();
    if (!name && !email && !phone) continue;
    const key = `${email.toLowerCase()}|${phone}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, email, phone });
    if (out.length >= 12) break;
  }
  return out;
}

function hintsFrom(logins: LastLogin[]): LoginHints {
  const names: string[] = [];
  const emails: string[] = [];
  const phones: string[] = [];
  for (const row of logins) {
    if (row.name && !names.includes(row.name)) names.push(row.name);
    if (row.email && !emails.includes(row.email)) emails.push(row.email);
    if (row.phone && !phones.includes(row.phone)) phones.push(row.phone);
  }
  return { names, emails, phones };
}

function scrubLeakedLogin() {
  if (typeof localStorage === "undefined") return;
  try {
    const flag = "aprozar-hints-scrub-1";
    const raw = localStorage.getItem("aprozar-shop-v3");
    if (!raw) {
      localStorage.setItem(flag, "1");
      return;
    }
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    if (!parsed.state) return;
    parsed.state.lastLogin = null;
    const session = parsed.state.session as { role?: string; name?: string } | undefined;
    if (session?.role === "admin") {
      parsed.state.session = publicSession(session as Session);
    }
    if (localStorage.getItem(flag) !== "1") {
      parsed.state.loginHints = emptyHints;
      parsed.state.savedLogins = [];
      localStorage.setItem(flag, "1");
    }
    localStorage.setItem("aprozar-shop-v3", JSON.stringify(parsed));
  } catch {
    /* ignore corrupt storage */
  }
}
scrubLeakedLogin();

function idsFrom(orders: SavedOrder[]) {
  return orders.map((o) => o.id);
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      items: [],
      favorites: [],
      favoriteProducers: [],
      session: { role: "guest" },
      prefs: { theme: "light", text: "normal", cards: "tall", font: "oswald", listsNewestFirst: true },
      filters: { km: null, category: null },
      myOrderIds: [],
      myOrders: [],
      cartOpen: false,
      loginHints: emptyHints,
      lastLogin: null,
      savedLogins: [],
      contact: null,
      flash: null,
      showShare: false,
      shareQueue: [],
      adShareCredits: 0,
      promoStartedAt: null,
      silencedNoticeIds: [],
      sessionClosedNoticeIds: [],
      adsBlockedUntil: null,
      add: (productId, qty, step) => {
        const items = [...get().items];
        const i = items.findIndex((x) => x.productId === productId);
        if (i >= 0) {
          items[i] = { ...items[i], qty: roundToStep(items[i].qty + qty, step) };
        } else {
          items.push({ productId, qty: roundToStep(qty, step), fulfillment: "ridicare" });
        }
        set({ items, cartOpen: true, showShare: false });
      },
      setQty: (productId, qty, step) => {
        if (qty <= 0) {
          set({ items: get().items.filter((x) => x.productId !== productId) });
          return;
        }
        const items = [...get().items];
        const i = items.findIndex((x) => x.productId === productId);
        const next = roundToStep(qty, step);
        if (i >= 0) {
          items[i] = { ...items[i], qty: next };
          set({ items });
          return;
        }
        items.push({ productId, qty: next, fulfillment: "ridicare" });
        set({ items, cartOpen: true, showShare: false });
      },
      setMany: (lines) => {
        const items = [...get().items];
        for (const line of lines) {
          const i = items.findIndex((x) => x.productId === line.productId);
          if (line.qty <= 0) {
            if (i >= 0) items.splice(i, 1);
            continue;
          }
          const next = roundToStep(line.qty, line.step || 1);
          if (i >= 0) {
            items[i] = {
              ...items[i],
              qty: next,
              fulfillment: line.fulfillment ?? items[i].fulfillment,
            };
          } else {
            items.push({
              productId: line.productId,
              qty: next,
              fulfillment: line.fulfillment ?? "ridicare",
            });
          }
        }
        set({ items, cartOpen: true, showShare: false });
      },
      setFulfillment: (productId, fulfillment) => {
        set({
          items: get().items.map((x) => (x.productId === productId ? { ...x, fulfillment } : x)),
        });
      },
      setProducerFulfillment: (productIds, fulfillment) => {
        const setIds = new Set(productIds);
        set({
          items: get().items.map((x) =>
            setIds.has(x.productId) ? { ...x, fulfillment } : x,
          ),
        });
      },
      remove: (productId) =>
        set({ items: get().items.filter((x) => x.productId !== productId) }),
      clear: () => set({ items: [] }),
      toggleFavorite: (productId) => {
        const fav = get().favorites;
        set({
          favorites: fav.includes(productId)
            ? fav.filter((id) => id !== productId)
            : [...fav, productId],
        });
      },
      toggleFavoriteProducer: (producerId) => {
        const fav = get().favoriteProducers;
        set({
          favoriteProducers: fav.includes(producerId)
            ? fav.filter((id) => id !== producerId)
            : [...fav, producerId],
        });
      },
      setSession: (session) => set({ session }),
      setPrefs: (prefs) => set({ prefs: { ...get().prefs, ...prefs } }),
      setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      rememberOrder: (order) => {
        const next = { ...order, status: order.status ?? ("noua" as const) };
        const rest = get().myOrders.filter((o) => o.id !== order.id);
        const top = get().prefs.listsNewestFirst !== false;
        const myOrders = (top ? [next, ...rest] : [...rest, next]).slice(0, 20);
        set({ myOrders, myOrderIds: idsFrom(myOrders) });
      },
      hydrateOrders: (orders) => {
        if (!orders.length) return;
        const byId = new Map(get().myOrders.map((o) => [o.id, o]));
        let changed = false;
        for (const order of orders) {
          const prev = byId.get(order.id);
          const nextStatus = order.status ?? prev?.status ?? "noua";
          if (!prev) {
            byId.set(order.id, { ...order, status: nextStatus });
            changed = true;
            continue;
          }
          const prevBare = prev.items.some((i) => !i.image);
          const nextHas = order.items.some((i) => i.image);
          const richer = prevBare && nextHas;
          const statusChanged = (prev.status ?? "noua") !== nextStatus;
          if (!richer && !statusChanged) continue;
          byId.set(order.id, {
            ...prev,
            ...order,
            items: richer ? order.items : prev.items,
            status: nextStatus,
          });
          changed = true;
        }
        if (!changed) return;
        const myOrders = [...byId.values()]
          .sort((a, b) => {
            const tb = new Date(b.createdAt).getTime();
            const ta = new Date(a.createdAt).getTime();
            if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
            return 0;
          })
          .slice(0, 20);
        set({ myOrders, myOrderIds: idsFrom(myOrders) });
      },
      rememberLogin: (login) => {
        const next = cleanLogins([login, ...get().savedLogins]);
        set({ lastLogin: null, savedLogins: next, loginHints: hintsFrom(next) });
      },
      rememberContact: (contact) => {
        const login = { name: contact.name, phone: contact.phone, email: "" };
        const next = cleanLogins([login, ...get().savedLogins]);
        set({ contact, savedLogins: next, loginHints: hintsFrom(next) });
      },
      setFlash: (flash) => set({ flash }),
      setShowShare: (showShare) => set({ showShare }),
      setShareQueue: (shareQueue) => set({ shareQueue, showShare: shareQueue.length > 0 }),
      shiftShareQueue: () => {
        const [first, ...rest] = get().shareQueue;
        if (!first) return null;
        set({ shareQueue: rest, showShare: rest.length > 0 });
        return first;
      },
      addAdShare: () => {
        const adShareCredits = get().adShareCredits + 1;
        const promoStartedAt = get().promoStartedAt ?? new Date().toISOString();
        set({ adShareCredits, promoStartedAt });
        return adShareCredits;
      },
      spendAdShares: (n) => {
        if (get().adShareCredits < n) return false;
        set({ adShareCredits: get().adShareCredits - n });
        return true;
      },
      closeNoticeSession: (id) => {
        if (get().sessionClosedNoticeIds.includes(id)) return;
        set({ sessionClosedNoticeIds: [...get().sessionClosedNoticeIds, id] });
      },
      silenceNotice: (id) => {
        if (get().silencedNoticeIds.includes(id)) return;
        set({ silencedNoticeIds: [...get().silencedNoticeIds, id] });
      },
      blockAds: (kind) => {
        const adsBlockedUntil = nextAdsBlockUntil(kind, get().adsBlockedUntil);
        set({ adsBlockedUntil });
      },
    }),
    {
      name: "aprozar-shop-v3",
      partialize: (s) => ({
        items: s.items,
        favorites: s.favorites,
        favoriteProducers: s.favoriteProducers,
        session: publicSession(s.session),
        prefs: s.prefs,
        filters: s.filters,
        myOrderIds: s.myOrderIds,
        myOrders: s.myOrders,
        contact: s.contact,
        savedLogins: s.savedLogins,
        shareQueue: s.shareQueue,
        adShareCredits: s.adShareCredits,
        promoStartedAt: s.promoStartedAt,
        silencedNoticeIds: s.silencedNoticeIds,
        adsBlockedUntil: s.adsBlockedUntil,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ShopState>;
        const myOrders = Array.isArray(p.myOrders) ? p.myOrders : current.myOrders;
        const myOrderIds = Array.isArray(p.myOrderIds)
          ? p.myOrderIds
          : myOrders.length
            ? idsFrom(myOrders)
            : current.myOrderIds;
        return {
          ...current,
          ...p,
          myOrders,
          myOrderIds,
          favoriteProducers: Array.isArray(p.favoriteProducers)
            ? p.favoriteProducers
            : current.favoriteProducers,
          shareQueue: Array.isArray(p.shareQueue) ? p.shareQueue : current.shareQueue,
          session: publicSession(p.session ?? current.session),
          contact: p.contact ?? current.contact,
          sessionClosedNoticeIds: [],
          silencedNoticeIds: Array.isArray(p.silencedNoticeIds)
            ? p.silencedNoticeIds
            : current.silencedNoticeIds,
          adsBlockedUntil:
            p.adsBlockedUntil === "forever" ||
            (typeof p.adsBlockedUntil === "string" && adsAreBlocked(p.adsBlockedUntil))
              ? p.adsBlockedUntil
              : (p.adsBlockedUntil ?? current.adsBlockedUntil ?? null),
          prefs: {
            theme: p.prefs?.theme === "dark" ? "dark" : "light",
            text: p.prefs?.text === "large" || p.prefs?.text === "xl" ? p.prefs.text : "normal",
            cards: p.prefs?.cards === "flat" ? "flat" : "tall",
            font:
              p.prefs?.font === "barlow" || p.prefs?.font === "plex" || p.prefs?.font === "rotund"
                ? p.prefs.font
                : "oswald",
            listsNewestFirst: p.prefs?.listsNewestFirst !== false,
          },
          filters: {
            km: typeof p.filters?.km === "number" ? p.filters.km : null,
            category: p.filters?.category ?? null,
          },
          loginHints: hintsFrom(cleanLogins(p.savedLogins)),
          savedLogins: cleanLogins(p.savedLogins),
          lastLogin: null,
        };
      },
    },
  ),
);
