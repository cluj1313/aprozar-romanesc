import { farmLabel, orderStatusOf } from "@/lib/order-status";
import { formatLei } from "@/lib/money";
import type { OrderStatus, SavedOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

function readyLabel(order: SavedOrder) {
  const pickup = order.items.every((i) => i.fulfillment !== "livrare");
  return pickup ? "Gata de ridicare" : "Gata de livrare";
}

function pillIndex(status: OrderStatus) {
  if (status === "gata") return 2;
  if (status === "confirmata" || status === "pregatita") return 1;
  if (status === "anulata") return -1;
  return 0;
}

export function OrderTrack({ order }: { order: SavedOrder }) {
  const status = orderStatusOf(order);
  const pills = ["Așteaptă confirmarea", "Pregătită", readyLabel(order)];
  const active = pillIndex(status);

  return (
    <section className="rounded-2xl border border-border bg-elevated px-3 py-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-sm font-semibold">{farmLabel(order)}</p>
        <p className="shrink-0 font-price font-semibold text-primary">{formatLei(order.totalBani)}</p>
      </div>
      {status === "anulata" ? (
        <p className="mt-2 rounded-full bg-warn/15 px-3 py-1.5 text-center text-xs font-semibold text-warn">
          Comandă anulată
        </p>
      ) : (
        <div className="mt-2 flex gap-1">
          {pills.map((label, i) => {
            const on = i === active;
            const done = i < active;
            return (
              <span
                key={label}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center rounded-full px-1.5 py-1.5 text-center text-[10px] leading-tight font-semibold",
                  on && "bg-primary text-primary-fg",
                  done && "bg-primary/15 text-primary",
                  !on && !done && "bg-sunken text-muted",
                )}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function WaitingOrders({
  orders,
  heading,
}: {
  orders: SavedOrder[];
  heading?: string;
}) {
  if (!orders.length) return null;
  return (
    <section className="mt-5">
      {heading ? <h2 className="mb-2 text-lg font-semibold">{heading}</h2> : null}
      <div className="space-y-2">
        {orders.map((order) => (
          <OrderTrack key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}

