import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProducerCard } from "@/components/producer-card";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { SuggestMore } from "@/components/suggest-more";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/favorite")({ component: FavoritePage });

function FavoritePage() {
  const { data } = useCatalog();
  const favorites = useShop((s) => s.favorites);
  const favoriteProducers = useShop((s) => s.favoriteProducers);
  const producers = (data?.producers ?? []).filter((p) => favoriteProducers.includes(p.id));
  const products = (data?.products ?? []).filter((p) => favorites.includes(p.id));
  const empty = producers.length === 0 && products.length === 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-2 font-display text-2xl font-semibold">Favorite</h1>
        {empty ? (
          <div className="mt-6 text-center">
            <p className="text-muted">Nimic pus la inimă încă. Atinge inima de pe o fermă sau o poză.</p>
            <Button asChild className="mt-4">
              <Link to="/produse">Intră în magazin</Link>
            </Button>
          </div>
        ) : (
          <>
            {producers.length > 0 ? (
              <section className="mt-4">
                <h2 className="text-base font-semibold">Producători favoriți</h2>
                <div className="tile-grid mt-2">
                  {producers.map((p) => (
                    <ProducerCard key={p.id} producer={p} />
                  ))}
                </div>
              </section>
            ) : null}
            {products.length > 0 ? (
              <section className="mt-6">
                <h2 className="text-base font-semibold">Produse favorite</h2>
                <ProductGrid className="mt-2" everyFifth>
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      producer={data?.producers.find((x) => x.id === p.producerId)}
                    />
                  ))}
                </ProductGrid>
              </section>
            ) : null}
          </>
        )}
        <SuggestMore excludeIds={favorites} position="favorites_more" />
      </div>
    </AppShell>
  );
}
