import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { QtyStepper } from "@/components/qty-stepper";
import { formatLei, formatQty } from "@/lib/money";
import { farmLabel, stageOf } from "@/lib/order-status";
import { useShop } from "@/lib/store";
import type { Product, SavedOrder, SavedOrderItem } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { cn, formatWhen } from "@/lib/utils";

export function PastOrders({ orders }: { orders: SavedOrder[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    return [...orders].sort((a, b) => {
      const tb = new Date(b.createdAt).getTime();
      const ta = new Date(a.createdAt).getTime();
      if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
      return 0;
    });
  }, [orders]);

  if (!list.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Comenzi efectuate</h2>
      <p className="mt-1 text-sm text-muted">Deschide, pune în coș, apoi comandă din nou.</p>
      <ul className="mt-3 space-y-2">
        {list.map((o) => {
          const open = openId === o.id;
          const stage = stageOf(o);
          return (
            <li key={o.id} className="overflow-hidden rounded-2xl border border-border bg-elevated">
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left"
                onClick={() => setOpenId(open ? null : o.id)}
                aria-expanded={open}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <OrderThumbs items={o.items} />
                    <span className="min-w-0">
                      <span className="block font-medium tabular-nums">{formatWhen(o.createdAt)}</span>
                      <span className="block truncate text-xs text-muted">
                        {farmLabel(o)} · {stage.title}
                      </span>
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2 font-semibold text-primary">
                  <span className="tabular-nums">{formatLei(o.totalBani)}</span>
                  <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
                </span>
              </button>
              {open ? <OrderReceipt order={o} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function OrderReceipt({ order }: { order: SavedOrder }) {
  const { data: catalog } = useCatalog();
  const cartItems = useShop((s) => s.items);
  const setMany = useShop((s) => s.setMany);
  const setFlash = useShop((s) => s.setFlash);
  const products = catalog?.products ?? [];
  const liveById = new Map(products.map((p) => [p.id, p]));
  const canReorder = order.items.some((i) => liveById.has(i.productId));

  const putAll = () => {
    setMany(
      order.items
        .filter((i) => liveById.has(i.productId))
        .map((i) => {
          const live = liveById.get(i.productId);
          return {
            productId: i.productId,
            qty: i.qty,
            step: live?.step || i.step || 1,
            fulfillment: i.fulfillment,
          };
        }),
    );
    setFlash("Am pus tot în coș");
  };

  const stage = stageOf(order);

  return (
    <div className="border-t border-border">
      <p className="px-4 pt-3 text-sm font-semibold text-primary">{stage.title}</p>
      <p className="px-4 text-xs text-muted">{stage.hint}</p>
      {groupReceipt(order.items).map((farm) => (
        <div key={farm.id}>
          <div className="flex items-baseline justify-between gap-3 px-4 pt-3">
            <p className="min-w-0 truncate text-sm font-semibold">{farm.name}</p>
            <p className="shrink-0 text-xs tabular-nums text-muted">{formatLei(farm.total)}</p>
          </div>
          <ul>
            {farm.items.map((item) => {
              const live = liveById.get(item.productId);
              const cartQty = cartItems.find((x) => x.productId === item.productId)?.qty ?? 0;
              const step = live?.step || item.step || 1;
              const onTaraba = Boolean(live);
              return (
                <li
                  key={item.productId}
                  className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <ReceiptPhoto item={item} live={live} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{item.productName}</p>
                    <p className="mt-0.5 text-xs text-subtle">
                      {formatQty(item.qty, item.unit)}
                      {item.fulfillment === "livrare" ? " · livrare" : " · ridicare"}
                    </p>
                    {!onTaraba ? (
                      <p className="mt-1 text-xs text-warn">Nu mai e pe tarabă</p>
                    ) : null}
                  </div>
                  <div
                    className="flex shrink-0 flex-col items-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <p className="font-price font-semibold text-primary">{formatLei(item.lineBani)}</p>
                    {onTaraba ? (
                      <QtyStepper
                        allowZero
                        qty={cartQty}
                        step={step}
                        unit={item.unit}
                        onChange={(q) => {
                          const next = cartQty <= 0 && q > 0 ? item.qty : q;
                          setMany([
                            {
                              productId: item.productId,
                              qty: next,
                              step,
                              fulfillment: item.fulfillment,
                            },
                          ]);
                        }}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {order.deliveryBani > 0 ? (
        <p className="px-4 pt-2 text-sm text-muted">Drum {formatLei(order.deliveryBani)}</p>
      ) : null}
      {order.address ? <p className="px-4 pt-1 text-sm text-muted">Adresă: {order.address}</p> : null}
      {order.note ? <p className="px-4 pt-1 text-sm text-muted">{order.note}</p> : null}
      {canReorder ? (
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={putAll}
            className="h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-fg"
          >
            Pune tot în coș
          </button>
        </div>
      ) : (
        <div className="h-3" />
      )}
    </div>
  );
}

function groupReceipt(items: SavedOrderItem[]) {
  const map = new Map<string, SavedOrderItem[]>();
  for (const item of items) {
    const list = map.get(item.producerId) ?? [];
    list.push(item);
    map.set(item.producerId, list);
  }
  return [...map.entries()].map(([id, list]) => ({
    id,
    name: list[0]?.producerName ?? "Fermă",
    items: list,
    total: list.reduce((s, i) => s + i.lineBani, 0),
  }));
}

function OrderThumbs({ items }: { items: SavedOrderItem[] }) {
  const photos = items.map((i) => i.image).filter(Boolean).slice(0, 3);
  if (!photos.length) return null;
  return (
    <span className="flex shrink-0 -space-x-1.5">
      {photos.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className="size-8 rounded-md object-cover outline outline-1 outline-bg"
        />
      ))}
    </span>
  );
}

function ReceiptPhoto({ item, live }: { item: SavedOrderItem; live?: Product }) {
  const src = item.image || live?.image || "";
  const slug = item.productSlug || live?.slug;
  const img = (
    <img
      src={src}
      alt=""
      className="size-16 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-black/10"
    />
  );
  if (!src) {
    return <div className="size-16 shrink-0 rounded-lg bg-sunken" />;
  }
  if (slug) {
    return (
      <Link to="/produse/$slug" params={{ slug }} className="shrink-0">
        {img}
      </Link>
    );
  }
  return <div className="shrink-0">{img}</div>;
}
