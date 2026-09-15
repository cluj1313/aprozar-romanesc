import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, ShoppingBasket, User } from "lucide-react";
import { useShop } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Acasă", icon: Home },
  { to: "/mesaje", label: "Mesaje", icon: MessageCircle },
  { to: "/favorite", label: "Favorite", icon: Heart },
  { to: "/cos", label: "Coș", icon: ShoppingBasket, cart: true },
  { to: "/cont", label: "Cont", icon: User },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useShop((s) => s.items.length);
  return (
    <nav className="tab-bar shrink-0 border-t border-border bg-bg">
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={
                "relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold " +
                (active ? "text-primary" : "text-muted")
              }
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {tab.label}
              {"cart" in tab && count > 0 ? (
                <span className="absolute top-1 right-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-fg tabular-nums">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
