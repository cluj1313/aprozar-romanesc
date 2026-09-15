import { Link, useRouterState } from "@tanstack/react-router";
import { cartTotals, groupCart } from "@/lib/cart-math";
import { formatLei } from "@/lib/money";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export function CartBar() {
  const items = useShop((s) => s.items);
  const { data } = useCatalog();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onCheckout = pathname.startsWith("/comanda");

  if (!items.length || !data) return null;
  const groups = groupCart(items, data.products, data.producers);
  const totals = cartTotals(groups);
  if (totals.count === 0) return null;

  const body = (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold leading-none">Total</p>
          {onCheckout ? null : (
            <span className="mt-1.5 inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-fg">
              Mergi la comandă
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="font-price text-3xl leading-none font-semibold text-primary">
            {formatLei(totals.totalBani)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {totals.deliveryBani === 0 ? "livrare gratuită" : `drum ${formatLei(totals.deliveryBani)}`}
          </p>
        </div>
      </div>
    </div>
  );

  if (onCheckout) {
    return <div className="border-t border-border bg-bg">{body}</div>;
  }

  return (
    <div className="border-t border-border bg-bg">
      <Link to="/comanda" className="block">
        {body}
      </Link>
    </div>
  );
}
