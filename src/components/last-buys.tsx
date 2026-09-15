import { Link } from "@tanstack/react-router";
import { ShoppingBasket } from "lucide-react";
import { formatLei, formatQty } from "@/lib/money";
import { useShop } from "@/lib/store";
import type { Catalog, Product, SavedOrder, SavedOrderItem } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

type Row = {
  productId: string;
  slug: string;
  name: string;
  producerName: string;
  qty: number;
  unit: string;
  priceBani: number;
  image: string;
  step: number;
  when?: string;
};

function fromProduct(product: Product, catalog: Catalog): Row | null {
  const farm = catalog.producers.find((p) => p.id === product.producerId);
  if (!farm?.active || farm.blocked) return null;
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    producerName: farm.name,
    qty: product.step,
    unit: product.unit,
    priceBani: product.priceBani,
    image: product.image,
    step: product.step,
  };
}

function rowsFrom(catalog: Catalog, orders: SavedOrder[], favorites: string[]): Row[] {
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const id of favorites) {
    if (seen.has(id)) continue;
    const product = catalog.products.find((p) => p.id === id && p.visible);
    if (!product) continue;
    const row = fromProduct(product, catalog);
    if (!row) continue;
    seen.add(id);
    rows.push(row);
  }
  for (const order of orders) {
    for (const item of order.items) {
      if (seen.has(item.productId)) continue;
      seen.add(item.productId);
      rows.push(fromItem(item, catalog, order.createdAt));
    }
  }
  const extras = catalog.products
    .filter((p) => p.visible)
    .slice()
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder);
  for (const product of extras) {
    if (rows.length >= 3) break;
    if (seen.has(product.id)) continue;
    const row = fromProduct(product, catalog);
    if (!row) continue;
    seen.add(product.id);
    rows.push(row);
  }
  return rows.slice(0, 8);
}

function fromItem(item: SavedOrderItem, catalog: Catalog, when: string): Row {
  const product = catalog.products.find((p) => p.id === item.productId);
  return {
    productId: item.productId,
    slug: item.productSlug || product?.slug || item.productId,
    name: item.productName,
    producerName: item.producerName,
    qty: item.qty,
    unit: item.unit,
    priceBani: item.unitPriceBani || product?.priceBani || item.lineBani,
    image: item.image || product?.image || "",
    step: item.step || product?.step || 1,
    when,
  };
}

export function LastBuys({ catalog }: { catalog: Catalog }) {
  const myOrders = useShop((s) => s.myOrders);
  const favorites = useShop((s) => s.favorites);
  const add = useShop((s) => s.add);
  const rows = rowsFrom(catalog, myOrders, favorites);
  if (!rows.length) return null;

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between">
        <h2 className="text-lg font-semibold">Ultimele cumpărături</h2>
        <Link to="/favorite" className="text-sm font-semibold text-primary">
          Toate
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-elevated">
        {rows.map((row) => (
          <li key={row.productId} className="flex items-center gap-3 px-3 py-2.5">
            <Link
              to="/produse/$slug"
              params={{ slug: row.slug }}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              {row.image ? (
                <img src={row.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="size-12 shrink-0 rounded-lg bg-sunken" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.name}</p>
                <p className="truncate text-xs text-muted">
                  {row.producerName} · {formatQty(row.qty, row.unit)}
                </p>
              </div>
            </Link>
            <div className="shrink-0 text-right">
              <p className="font-price text-sm font-semibold">{formatLei(row.priceBani)}</p>
              {row.when ? <p className="text-xs text-subtle">{formatShortDate(row.when)}</p> : null}
            </div>
            <button
              type="button"
              aria-label={`Adaugă ${row.name} în coș`}
              onClick={() => add(row.productId, row.qty || row.step, row.step)}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-primary"
            >
              <ShoppingBasket className="size-5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
