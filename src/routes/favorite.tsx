import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { SuggestMore } from "@/components/suggest-more";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/favorite")({ component: FavoritePage });

function FavoritePage() {
  const { data } = useCatalog();
  const favorites = useShop((s) => s.favorites);
  const list = (data?.products ?? []).filter((p) => favorites.includes(p.id));
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-2 font-display text-2xl font-semibold">Favorite</h1>
        {list.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="text-muted">Nimic pus la inimă încă. Atinge inima de pe o poză.</p>
            <Button asChild className="mt-4">
              <Link to="/produse">Intră în magazin</Link>
            </Button>
          </div>
        ) : (
          <ProductGrid className="mt-3" everyFifth>
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                producer={data?.producers.find((x) => x.id === p.producerId)}
              />
            ))}
          </ProductGrid>
        )}
        <SuggestMore excludeIds={favorites} position="favorites_more" />
      </div>
    </AppShell>
  );
}
