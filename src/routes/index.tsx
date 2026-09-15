import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { AppShell } from "@/components/app-shell";
import { HomeNotice } from "@/components/home-notice";
import { LastBuys } from "@/components/last-buys";
import { ProducerCard } from "@/components/producer-card";
import { SearchBar } from "@/components/search-bar";
import { getCatalog } from "@/lib/catalog-fns";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: () => getCatalog(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const { data } = useCatalog(initial);
  const catalog = data ?? initial;
  const session = useShop((s) => s.session);
  const km = useShop((s) => s.filters.km);
  const cards = useShop((s) => s.prefs.cards);
  const flat = cards === "flat";
  const producers = catalog.producers
    .filter((p) => p.active && !p.blocked)
    .filter((p) => km == null || p.km <= km)
    .slice()
    .sort((a, b) => a.km - b.km);
  const nearbyIds = new Set(producers.map((p) => p.id));
  const stories = catalog.stories.filter((s) => nearbyIds.has(s.producerId) || km == null);
  const addProductTo =
    session.role === "producer" ? "/admin/produse" : session.role === "admin" ? "/admin" : "/cont";

  return (
    <AppShell>
      <HomeNotice announcements={catalog.announcements} />
      <div className="mx-auto max-w-xl px-4 pb-10">
        <SearchBar />

        <section className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Ești producător?</p>
            <p className="text-xs text-muted">Vinde direct către clienți.</p>
          </div>
          <Link
            to={addProductTo}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-fg"
          >
            <Plus className="size-4" />
            Adaugă produs
          </Link>
        </section>

        <AdSlot position="home_top" className="mt-4 px-0 pb-0" />

        <section className="mt-5">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold">Producători apropiați</h2>
            <Link to="/producatori" className="text-sm font-semibold text-primary">
              Vezi toți
            </Link>
          </div>
          <div className="hide-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pe-10">
            {producers.map((p) => (
              <ProducerCard key={p.id} producer={p} layout="scroll" />
            ))}
          </div>
        </section>

        <AdSlot position="home_mid" className="mt-6 px-0 pb-0" />

        <LastBuys catalog={catalog} />

        <section className="mt-6">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold">Poveștile producătorilor locali</h2>
            <Link to="/povesti" className="text-sm font-semibold text-primary">
              Vezi toți
            </Link>
          </div>
          <div className="hide-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pe-10">
            {stories.map((s) => {
              const producer = catalog.producers.find((p) => p.id === s.producerId);
              return (
                <Link
                  key={s.id}
                  to="/povesti/$slug"
                  params={{ slug: s.slug }}
                  className={cn(
                    "shrink-0 overflow-hidden rounded-xl border border-border bg-elevated shadow-soft",
                    flat ? "w-52" : "w-44",
                  )}
                >
                  <img
                    src={producer?.image}
                    alt=""
                    className={cn("w-full object-cover", flat ? "aspect-[3/2]" : "aspect-[4/5]")}
                  />
                  <div className="px-2.5 py-2">
                    <p className="truncate text-xs text-muted">{producer?.name}</p>
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
