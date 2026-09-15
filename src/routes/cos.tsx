import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CartLine } from "@/components/cart-line";
import { WaitingOrders } from "@/components/order-track";
import { PastOrders } from "@/components/past-orders";
import { SuggestMore } from "@/components/suggest-more";
import { Button } from "@/components/ui/button";
import { cartTotals, groupCart } from "@/lib/cart-math";
import { formatLei } from "@/lib/money";
import { splitMyOrders } from "@/lib/order-status";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/cos")({ component: CosPage });

function CosPage() {
  const { data } = useCatalog();
  const items = useShop((s) => s.items);
  const myOrders = useShop((s) => s.myOrders);
  const myOrderIds = useShop((s) => s.myOrderIds);
  const { waiting, past } = splitMyOrders(myOrders);
  const hasHistory = past.length > 0 || waiting.length > 0 || myOrderIds.length > 0;

  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10 text-muted">Se încarcă…</div>
      </AppShell>
    );
  }

  const groups = groupCart(items, data.products, data.producers);
  const totals = cartTotals(groups);
  const lines = groups.flatMap((g) => g.items.map((i) => ({ ...i, producer: g.producer })));
  const shopping = lines.length > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-12">
        <h1 className="pt-3 font-display text-2xl font-semibold">Coșul tău</h1>

        {shopping ? (
          <>
            <ul className="mt-2">
              {lines.map((i) => (
                <CartLine
                  key={i.product.id}
                  product={i.product}
                  producer={i.producer}
                  qty={i.qty}
                  lineBani={i.lineBani}
                />
              ))}
            </ul>
            <Button asChild className="mt-4 w-full rounded-full" size="lg">
              <Link to="/comanda">Comandă acum · {formatLei(totals.totalBani)}</Link>
            </Button>
            {!totals.allMinOk ? (
              <p className="mt-2 text-sm text-danger">
                Unele ferme au minim de comandă. Mai pui ceva sau scoți ferma din coș.
              </p>
            ) : null}
          </>
        ) : null}

        {shopping ? (
          <WaitingOrders orders={waiting} heading="Comandă în așteptare" />
        ) : waiting.length > 1 ? (
          <>
            <WaitingOrders orders={waiting.slice(0, 1)} />
            <WaitingOrders orders={waiting.slice(1)} heading="Comandă în așteptare" />
          </>
        ) : (
          <WaitingOrders orders={waiting} />
        )}

        {!shopping && !hasHistory ? (
          <>
            <p className="mt-3 text-sm text-muted">
              Coșul e gol. Alege de la tarabă — roșii, telemea, un borcan de miere.
            </p>
            <Button asChild className="mt-4 w-full rounded-full" variant="secondary">
              <Link to="/produse">Intră în magazin</Link>
            </Button>
          </>
        ) : null}

        <PastOrders orders={past} />
        <SuggestMore
          excludeIds={items.map((i) => i.productId)}
          position="checkout_more"
          hideAd
        />
      </div>
    </AppShell>
  );
}
