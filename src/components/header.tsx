import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Home,
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
import { useShop } from "@/lib/store";
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
  {
    label: "Aplicația",
    items: [
      { to: "/trimite", label: "Trimite aplicația", icon: Share2 },
      { to: "/aplicatia", label: "Pagina aplicației", icon: Store },
      { to: "/admin", label: "Admin", icon: Shield, admin: true },
    ],
  },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useShop((s) => s.items.length);
  const session = useShop((s) => s.session);
  const adminLabel = session.role === "producer" ? "Taraba mea" : "Admin";

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-xl items-center gap-2 px-4 py-1">
        <Link to="/" aria-label="Aprozar Românesc" className="relative shrink-0">
          <img src="/images/logo-badge.png" alt="" className="size-10 object-contain" />
        </Link>
        <Link to="/" className="min-w-0 flex-1">
          <span className="block truncate text-lg leading-none font-extrabold tracking-tight text-primary uppercase whitespace-nowrap">
            Aprozar Românesc
          </span>
        </Link>
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
                const label = "admin" in item && item.admin ? adminLabel : item.label;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-2 text-sm font-medium",
                      active ? "bg-primary/10 text-primary" : "text-fg",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="flex-1">{label}</span>
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
        </nav>
      </div>
    </header>
  );
}
