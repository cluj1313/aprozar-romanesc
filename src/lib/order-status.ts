import type { OrderStatus, Producer, Product, SavedOrder, ShopOrder } from "./types";
import { parseSlot } from "@/lib/order-message";

export const ORDER_STAGE: Record<
  OrderStatus,
  { title: string; hint: string }
> = {
  noua: { title: "Comandă plasată", hint: "Așteaptă confirmarea fermei" },
  confirmata: { title: "Confirmată", hint: "Ferma pregătește comanda" },
  pregatita: { title: "Pregătită", hint: "Marfa e ambalată" },
  gata: { title: "Gata", hint: "Poți trece după ea sau te așteaptă livrarea" },
  anulata: { title: "Anulată", hint: "Ferma a anulat comanda" },
};

export function orderStatusOf(order: { status?: OrderStatus } | null | undefined): OrderStatus {
  return order?.status ?? "noua";
}

export function stageOf(order: { status?: OrderStatus; items?: { fulfillment?: string }[] }) {
  const status = orderStatusOf(order);
  if (status === "gata") {
    const pickup = (order.items ?? []).every((i) => i.fulfillment !== "livrare");
    return pickup
      ? { title: "Gata de ridicare", hint: "Poți trece după ea" }
      : { title: "Gata de livrare", hint: "E pe drum spre tine" };
  }
  return ORDER_STAGE[status];
}

export function isLiveOrder(order: SavedOrder) {
  const status = orderStatusOf(order);
  if (status === "noua" || status === "confirmata" || status === "pregatita") return true;
  const age = Date.now() - new Date(order.createdAt).getTime();
  if (!Number.isFinite(age)) return status === "gata";
  return age < 36 * 60 * 60 * 1000;
}

export function isWaitingOrder(order: SavedOrder) {
  const status = orderStatusOf(order);
  if (status === "anulata") return false;
  return isLiveOrder(order);
}

export function splitMyOrders(orders: SavedOrder[]) {
  const waiting: SavedOrder[] = [];
  const past: SavedOrder[] = [];
  for (const o of orders) {
    if (isWaitingOrder(o)) waiting.push(o);
    else past.push(o);
  }
  const byNewest = (a: SavedOrder, b: SavedOrder) => {
    const tb = new Date(b.createdAt).getTime();
    const ta = new Date(a.createdAt).getTime();
    if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
    return 0;
  };
  waiting.sort(byNewest);
  past.sort(byNewest);
  return { waiting, past };
}

export function farmLabel(order: { items: { producerName: string }[] }) {
  const names = [...new Set(order.items.map((i) => i.producerName).filter(Boolean))];
  if (!names.length) return "fermă";
  if (names.length === 1) return names[0];
  return `${names[0]} · +${names.length - 1}`;
}

export function savedFromShop(
  order: ShopOrder,
  products: Product[],
  producers: Pick<Producer, "id" | "phone">[],
): SavedOrder {
  const parsed = new Date(order.createdAt);
  return {
    id: order.id,
    createdAt: Number.isNaN(parsed.getTime()) ? order.createdAt : parsed.toISOString(),
    totalBani: order.totalBani,
    productsBani: order.productsBani,
    deliveryBani: order.deliveryBani,
    address: order.address,
    note: order.customerNote,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    slot: parseSlot(order.customerNote),
    status: order.status ?? "noua",
    items: order.items.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      const farm = producers.find((x) => x.id === i.producerId);
      return {
        productId: i.productId,
        productSlug: p?.slug ?? "",
        productName: i.productName,
        producerId: i.producerId,
        producerName: i.producerName,
        producerPhone: farm?.phone ?? "",
        qty: i.qty,
        unit: i.unit,
        unitPriceBani: i.unitPriceBani,
        lineBani: i.lineBani,
        fulfillment: i.fulfillment,
        image: p?.image ?? "",
        step: p?.step ?? 1,
      };
    }),
  };
}
