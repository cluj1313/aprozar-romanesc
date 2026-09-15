import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PriceLive } from "@/components/price-live";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { QtyStepper } from "@/components/qty-stepper";
import { Button } from "@/components/ui/button";
import { cartTotals, groupCart } from "@/lib/cart-math";
import { formatLei, lineTotalBani } from "@/lib/money";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produse/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useCatalog();
  const product = data?.products.find((p) => p.slug === slug);
  const producer = data?.producers.find((p) => p.id === product?.producerId);
  const add = useShop((s) => s.add);
  const items = useShop((s) => s.items);
  const favorites = useShop((s) => s.favorites);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const [qty, setQty] = useState(product?.step ?? 1);

  useEffect(() => {
    if (product) setQty(product.step);
    // only reset when switching product
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10 text-muted">Se încarcă…</div>
      </AppShell>
    );
  }
  if (!product || !producer) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10">Produsul nu mai e pe tarabă.</div>
      </AppShell>
    );
  }

  const line = lineTotalBani({
    qty,
    priceBani: product.priceBani,
    bulkQty: product.bulkQty,
    bulkPriceBani: product.bulkPriceBani,
  });
  const loved = favorites.includes(product.id);
  const related = data.products
    .filter(
      (p) =>
        p.visible &&
        p.id !== product.id &&
        (p.producerId === product.producerId || p.category === product.category),
    )
    .slice(0, 4);
  const inCart = cartTotals(groupCart(items, data.products, data.producers)).productsBani;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pb-10">
        <div className="relative">
          <img src={product.image} alt={product.name} className="aspect-[3/2] w-full object-cover" />
          <button
            type="button"
            aria-label="Favorite"
            onClick={() => toggleFavorite(product.id)}
            className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
          >
            <Heart className={cn("size-5", loved && "fill-primary")} />
          </button>
        </div>
        <div className="px-4 pt-4">
          <p className="text-xs text-subtle">
            <Link to="/produse" className="hover:text-primary">
              Produse
            </Link>
            {" / "}
            {product.name}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{product.name}</h1>
          <Link
            to="/producatori/$id"
            params={{ id: producer.id }}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            <MapPin className="size-3.5" />
            {producer.name} · {producer.village}, {producer.county}
          </Link>
          <p className="mt-3 text-muted">{product.blurb}</p>
          <p className="mt-3 text-lg">
            <span className="font-price text-lg font-semibold text-fg">{formatLei(product.priceBani)}</span>
            <span className="text-subtle"> / {product.unit}</span>
          </p>
          {product.bulkQty && product.bulkPriceBani ? (
            <p className="mt-1 text-sm text-accent">
              Lădiță de la {product.bulkQty} {product.unit}: {formatLei(product.bulkPriceBani)} / {product.unit}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between">
            <QtyStepper
              qty={qty}
              step={product.step}
              unit={product.unit}
              onChange={(n) => setQty(n <= 0 ? product.step : n)}
            />
            <p className="text-xs text-subtle">
              pas {product.step} {product.unit}
            </p>
          </div>

          <div className="mt-4">
            <PriceLive product={product} qty={qty} />
          </div>

          <Button className="mt-4 w-full" size="lg" onClick={() => add(product.id, qty, product.step)}>
            Adaugă în coș · {formatLei(line)}
          </Button>

          {items.length > 0 ? (
            <p className="mt-3 text-center text-sm text-muted">
              În coș acum:{" "}
              <span className="font-price font-semibold text-primary">{formatLei(inCart)}</span>
              {items.some((i) => i.productId === product.id) ? null : (
                <span> — plus {formatLei(line)} dacă pui și asta</span>
              )}
            </p>
          ) : null}

          <section className="mt-10">
            <h2 className="text-lg font-semibold">De la același loc</h2>
            <ProductGrid className="mt-3">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  producer={data.producers.find((x) => x.id === p.producerId)}
                />
              ))}
            </ProductGrid>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
