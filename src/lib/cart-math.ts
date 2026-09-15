import { lineTotalBani, unitPriceBani } from "@/lib/money";
import type { CartItem, Producer, Product } from "@/lib/types";

export type GroupedCart = {
  producer: Producer;
  items: {
    product: Product;
    qty: number;
    fulfillment: "ridicare" | "livrare";
    unitBani: number;
    lineBani: number;
  }[];
  subtotalBani: number;
  deliveryBani: number;
  minOk: boolean;
  minMissingBani: number;
  freeDeliveryMissingBani: number;
};

export function groupCart(
  items: CartItem[],
  products: Product[],
  producers: Producer[],
): GroupedCart[] {
  const byProducer = new Map<string, CartItem[]>();
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    const list = byProducer.get(product.producerId) ?? [];
    list.push(item);
    byProducer.set(product.producerId, list);
  }
  const groups: GroupedCart[] = [];
  for (const [producerId, list] of byProducer) {
    const producer = producers.find((p) => p.id === producerId);
    if (!producer) continue;
    const mapped = list
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const unitBani = unitPriceBani({
          qty: item.qty,
          priceBani: product.priceBani,
          bulkQty: product.bulkQty,
          bulkPriceBani: product.bulkPriceBani,
        });
        const lineBani = lineTotalBani({
          qty: item.qty,
          priceBani: product.priceBani,
          bulkQty: product.bulkQty,
          bulkPriceBani: product.bulkPriceBani,
        });
        return { product, qty: item.qty, fulfillment: item.fulfillment, unitBani, lineBani };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
    const subtotalBani = mapped.reduce((s, i) => s + i.lineBani, 0);
    const wantsDelivery = mapped.some((i) => i.fulfillment === "livrare");
    let deliveryBani = 0;
    if (wantsDelivery && producer.delivery) {
      if (producer.freeOverBani > 0 && subtotalBani >= producer.freeOverBani) {
        deliveryBani = 0;
      } else {
        deliveryBani = producer.deliveryFeeBani;
      }
    }
    const minOk = producer.minOrderBani <= 0 || subtotalBani >= producer.minOrderBani;
    groups.push({
      producer,
      items: mapped,
      subtotalBani,
      deliveryBani,
      minOk,
      minMissingBani: minOk ? 0 : producer.minOrderBani - subtotalBani,
      freeDeliveryMissingBani:
        wantsDelivery && producer.freeOverBani > 0 && subtotalBani < producer.freeOverBani
          ? producer.freeOverBani - subtotalBani
          : 0,
    });
  }
  return groups;
}

export function cartTotals(groups: GroupedCart[]) {
  const productsBani = groups.reduce((s, g) => s + g.subtotalBani, 0);
  const deliveryBani = groups.reduce((s, g) => s + g.deliveryBani, 0);
  const count = groups.reduce((s, g) => s + g.items.length, 0);
  const qtyCount = groups.reduce(
    (s, g) => s + g.items.reduce((n, i) => n + (i.product.unit === "kg" ? 1 : i.qty), 0),
    0,
  );
  return {
    productsBani,
    deliveryBani,
    totalBani: productsBani + deliveryBani,
    count,
    qtyCount,
    allMinOk: groups.every((g) => g.minOk),
  };
}
