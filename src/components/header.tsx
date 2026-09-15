import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Home,
  LayoutGrid,
  MegaphoneOff,
  Menu,
  Settings,
  Share2,
  Shield,
  ShoppingBasket,
  Sprout,
  Store,
  User,
  Warehouse,
  X,
} from "lucide-react";
import {
  AD_BLOCK_FOREVER_BANI,
  AD_BLOCK_YEAR_BANI,
  adsAreBlocked,
  adsBlockCopy,
} from "@/lib/ad-block";
import { formatLei } from "@/lib/money";
import { getAppPage } from "@/lib/platform-fns";
import { SEED_APP_APPS } from "@/lib/platform-seed";
import { useShop } from "@/lib/store";
import { appPageQueryKey } from "@/lib/use-app-page";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Magazin",
    items: [
      { to: "/", label: "Acasă", icon: Home },
      { to: "/producatori", label: "Producători", icon: Warehouse },
      { to: "/produse", label: "Produse", icon: Sprout },
      { to: "/povesti", label: "Povești", icon: BookOpen },
    ],
  },
  {
    label: "Contul tău",
    items: [
      { to: "/cont", label: "Cont", icon: User },
      { to: "/setari", label: "Setări", icon: Settings },
      { to: "/cos", label: "Coș", icon: ShoppingBasket, cart: true },
    ],
  },
] as const;

const APP_NAV = [
  { to: "/trimite", label: "Trimite aplicația", icon: Share2 },
  { to: "/aplicatia", label: "Pagina aplicației", icon: Store },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [adsOpen, setAdsOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(true);
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useShop((s) => s.items.length);
  const session = useShop((s) => s.session);
  const adsBlockedUntil = useShop((s) => s.adsBlockedUntil);
  const blockAds = useShop((s) => s.blockAds);
  const setFlash = useShop((s) => s.setFlash);
  const adminLabel = session.role === "producer" ? "Taraba mea" : "Admin";
  const atHome = pathname === "/";
  const blocked = adsAreBlocked(adsBlockedUntil);
  const forever = adsBlockedUntil === "forever";
  const blockNote = adsBlockCopy(adsBlockedUntil);
  const { data } = useQuery({
    queryKey: appPageQueryKey,
    queryFn: () => getAppPage({ data: {} }),
    staleTime: 60_000,
  });
  const apps = (data?.apps?.length ? data.apps : SEED_APP_APPS).filter((a) => !a.hidden);

  function close() {
    setOpen(false);
  }

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/" });
  }

  const buy = (kind: "year" | "forever") => {
    if (forever) {
      setFlash("Reclamele sunt deja oprite pentru totdeauna");
      return;
    }
    blockAds(kind);
    setFlash(kind === "forever" ? "Reclamele sunt oprite pentru totdeauna" : "Reclamele sunt oprite un an");
  };

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto max-w-xl px-3 py-1">
        <div className="flex items-center gap-1">
          {atHome ? null : (
            <button
              type="button"
              aria-label="Înapoi"
              onClick={goBack}
              className="flex size-10 shrink-0 items-center justify-center rounded-md text-primary"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <Link to="/" aria-label="Aprozar Românesc" className="relative shrink-0">
            <img src="/images/logo-badge.png" alt="" className="size-10 object-contain" />
          </Link>
          <span className="min-w-0 flex-1" aria-hidden />
          <button
            type="button"
            className="relative z-50 flex size-10 shrink-0 items-center justify-center rounded-md text-primary"
            aria-expanded={open}
            aria-label={open ? "Închide meniul" : "Deschide meniul"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
        <Link to="/" className="block pb-1">
          <span className="font-display block text-center text-base leading-tight font-bold tracking-wide text-primary uppercase">
            Aprozar Românesc
          </span>
        </Link>
      </div>
      <div
        className={cn(
          "absolute inset-x-0 top-full z-50 border-b border-border bg-bg shadow-soft",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto max-w-xl px-3 py-2">
          {GROUPS.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-1.5 border-t border-border pt-1.5")}>
              <p className="px-2 pb-0.5 text-[10px] font-semibold tracking-wider text-muted uppercase">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={close}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-2 text-sm font-medium",
                      active ? "bg-primary/10 text-primary" : "text-fg",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="flex-1">{item.label}</span>
                    {"cart" in item && count > 0 ? (
                      <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-fg tabular-nums">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="mt-0.5">
            <button
              type="button"
              aria-expanded={adsOpen}
              onClick={() => setAdsOpen((v) => !v)}
              className="flex h-11 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium text-fg"
            >
              <MegaphoneOff className="size-4 shrink-0 opacity-80" />
              <span className="flex-1 text-left">
                Fără reclame
                <span className="mt-0.5 block text-[11px] font-normal text-muted">
                  {blocked ? (forever ? "Oprite pentru totdeauna" : "Oprite pe telefonul ăsta") : "Scapi de reclame, dacă vrei"}
                </span>
              </span>
              <ChevronDown className={cn("size-4 text-muted transition-transform", adsOpen && "rotate-180")} />
            </button>
            {adsOpen ? (
              <div className="mb-1 ms-7 me-1 space-y-1.5 pb-1">
                {blockNote ? <p className="px-1 text-[11px] leading-snug text-muted">{blockNote}</p> : null}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => buy("year")}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-left",
                      blocked && !forever
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-elevated",
                    )}
                  >
                    <span className="block font-display text-base font-semibold leading-none tabular-nums">
                      {formatLei(AD_BLOCK_YEAR_BANI)}
                    </span>
                    <span className={cn("mt-1 block text-[11px]", blocked && !forever ? "text-primary-fg/80" : "text-muted")}>
                      Un an
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => buy("forever")}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-left",
                      forever ? "border-primary bg-primary text-primary-fg" : "border-border bg-elevated",
                    )}
                  >
                    <span className="block font-display text-base font-semibold leading-none tabular-nums">
                      {formatLei(AD_BLOCK_FOREVER_BANI)}
                    </span>
                    <span className={cn("mt-1 block text-[11px]", forever ? "text-primary-fg/80" : "text-muted")}>
                      Totdeauna
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-1.5 border-t border-border pt-1.5">
            <p className="px-2 pb-0.5 text-[10px] font-semibold tracking-wider text-muted uppercase">
              Aplicația
            </p>
            {APP_NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={close}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-2 text-sm font-medium",
                    active ? "bg-primary/10 text-primary" : "text-fg",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              aria-expanded={appsOpen}
              onClick={() => setAppsOpen((v) => !v)}
              className="flex h-10 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium text-fg"
            >
              <LayoutGrid className="size-4 shrink-0 opacity-80" />
              <span className="flex-1 text-left">Alte aplicații de-ale mele</span>
              <ChevronDown className={cn("size-4 text-muted transition-transform", appsOpen && "rotate-180")} />
            </button>
            {appsOpen ? (
              <div className="mb-1 space-y-0.5 pb-1">
                {apps.map((app) => {
                  const href = app.url || "/aplicatia";
                  const external = /^https?:\/\//i.test(href);
                  return (
                    <a
                      key={app.id}
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      onClick={close}
                      className="flex h-11 items-center gap-3 rounded-lg px-2 ps-9 text-sm font-medium text-fg"
                    >
                      {app.image ? (
                        <img src={app.image} alt="" className="h-7 w-11 shrink-0 rounded object-cover" />
                      ) : (
                        <span className="flex h-7 w-11 shrink-0 items-center justify-center rounded bg-sunken">
                          <ExternalLink className="size-3.5 text-muted" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate leading-tight">{app.title}</span>
                        {app.body ? (
                          <span className="block truncate text-[11px] font-normal text-muted">{app.body}</span>
                        ) : null}
                      </span>
                      <ExternalLink className="size-3.5 shrink-0 text-muted" />
                    </a>
                  );
                })}
                {session.role === "admin" ? (
                  <Link
                    to="/aplicatia"
                    hash="alte-aplicatii"
                    onClick={close}
                    className="flex h-9 items-center gap-3 rounded-lg px-2 ps-9 text-xs font-semibold text-primary"
                  >
                    Adaugă banner, link și descriere
                  </Link>
                ) : null}
              </div>
            ) : null}

            {session.role === "admin" || session.role === "producer" ? (
            <Link
              to="/admin"
              onClick={close}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-2 text-sm font-medium",
                pathname.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-fg",
              )}
            >
              <Shield
                className="size-4 shrink-0 opacity-80"
                strokeWidth={pathname.startsWith("/admin") ? 2.2 : 1.8}
              />
              <span className="flex-1">{adminLabel}</span>
            </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
