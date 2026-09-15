import { formatLei, formatQty, lineTotalBani, unitPriceBani } from "@/lib/money";
import type { Product } from "@/lib/types";

export function PriceLive({ product, qty }: { product: Product; qty: number }) {
  const unit = unitPriceBani({
    qty,
    priceBani: product.priceBani,
    bulkQty: product.bulkQty,
    bulkPriceBani: product.bulkPriceBani,
  });
  const line = lineTotalBani({
    qty,
    priceBani: product.priceBani,
    bulkQty: product.bulkQty,
    bulkPriceBani: product.bulkPriceBani,
  });
  const bulkOn = unit !== product.priceBani;
  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-3">
      <p className="text-xs font-semibold tracking-wide text-subtle uppercase">
        Cât plătești
      </p>
      <p className="mt-1 text-sm text-muted">
        <span className="tabular-nums">{formatQty(qty, product.unit)}</span>
        {" × "}
        <span className="tabular-nums">{formatLei(unit)}</span>
      </p>
      <p className="font-price mt-0.5 text-2xl font-semibold text-primary">
        {formatLei(line)}
      </p>
      {bulkOn && product.bulkQty && product.bulkPriceBani ? (
        <p className="mt-1 text-xs text-accent">
          Preț la cantitate de la {formatQty(product.bulkQty, product.unit)}
        </p>
      ) : product.bulkQty && product.bulkPriceBani ? (
        <p className="mt-1 text-xs text-muted">
          De la {formatQty(product.bulkQty, product.unit)}: {formatLei(product.bulkPriceBani)} /{" "}
          {product.unit}
        </p>
      ) : null}
    </div>
  );
}
