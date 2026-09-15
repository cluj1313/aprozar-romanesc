import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

type Search = { q?: string; c?: string };

export const Route = createFileRoute("/produse/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  component: ProdusePage,
});

function ProdusePage() {
  const { q, c } = Route.useSearch();
  const { data } = useCatalog();
  const km = useShop((s) => s.filters.km);
  let list = (data?.products ?? []).filter((p) => {
    if (!p.visible) return false;
    const farm = data?.producers.find((x) => x.id === p.producerId);
    if (!farm?.active || farm.blocked) return false;
    if (km != null && farm.km > km) return false;
    return true;
  });
  if (c) list = list.filter((p) => p.category === c);
  if (q) {
    const n = q.toLowerCase();
    list = list.filter((p) => {
      const producer = data?.producers.find((x) => x.id === p.producerId);
      return (
        p.name.toLowerCase().includes(n) ||
        producer?.name.toLowerCase().includes(n) ||
        producer?.village.toLowerCase().includes(n)
      );
    });
  }
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <p className="pt-3 text-xs font-semibold tracking-widest text-muted">MAGAZIN</p>
        <h1 className="font-display text-2xl font-semibold text-primary">Produse</h1>
        <div className="mt-4">
          <SearchBar mode="shop" />
        </div>
        <ProductGrid className="mt-4" everyFifth>
          {list.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              producer={data?.producers.find((x) => x.id === p.producerId)}
            />
          ))}
        </ProductGrid>
        {list.length === 0 ? (
          <p className="mt-8 text-center text-muted">Nu am găsit nimic cu ce-ai căutat.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
