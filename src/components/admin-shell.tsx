import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Store } from "lucide-react";
import { AdminLogin } from "@/components/admin/login";
import { AppShell } from "@/components/app-shell";
import { LogoMark } from "@/components/logo";
import { useShop } from "@/lib/store";
import { useHasHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

const NAV: {
  to: "/admin" | "/admin/comenzi" | "/admin/produse" | "/admin/producatori";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { to: "/admin", label: "Tablou", icon: LayoutDashboard, exact: true },
  { to: "/admin/comenzi", label: "Comenzi", icon: ShoppingBag },
  { to: "/admin/produse", label: "Produse", icon: Package },
  { to: "/admin/producatori", label: "Profilul fermei", icon: Store },
];

export function AdminShell() {
  const session = useShop((s) => s.session);
  const setSession = useShop((s) => s.setSession);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hydrated = useHasHydrated();

  if (!hydrated) {
    return (
      <AppShell>
        <p className="px-4 py-10 text-center text-sm text-muted">Se încarcă contul…</p>
      </AppShell>
    );
  }

  if (session.role === "guest") {
    return (
      <AppShell>
        <AdminLogin />
      </AppShell>
    );
  }

  if (session.role === "admin") {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-primary text-primary-fg md:flex">
        <Link to="/" className="flex items-center gap-2 px-4 py-4">
          <LogoMark className="size-9" />
          <span className="font-extrabold tracking-tight uppercase">Taraba mea</span>
        </Link>
        <nav className="flex flex-1 flex-col px-2">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to || pathname === "/admin/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold",
                  active ? "bg-primary-fg text-primary" : "hover:bg-primary-fg/10",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="m-3 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold hover:bg-primary-fg/10"
          onClick={() => {
            setSession({ role: "guest" });
            void navigate({ to: "/" });
          }}
        >
          <LogOut className="size-4" />
          Ieși
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2 md:px-6">
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-md md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Meniu tarabă"
          >
            <Menu className="size-5" />
          </button>
          <p className="flex-1 font-semibold">Taraba mea</p>
          <Link to="/" className="text-sm font-semibold text-primary">
            Magazin
          </Link>
        </header>
        {open ? (
          <nav className="border-b border-border bg-elevated px-3 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex h-11 items-center text-sm font-semibold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
