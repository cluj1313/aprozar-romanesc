import { formatLei, formatQty } from "@/lib/money";
import type { Producer, SavedOrder } from "@/lib/types";

export type ProducerPacket = {
  producerId: string;
  producerName: string;
  producerPhone: string;
  text: string;
  totalBani: number;
};

type PacketItem = {
  producerId: string;
  producerName: string;
  producerPhone?: string;
  productName: string;
  qty: number;
  unit: string;
  lineBani: number;
  fulfillment: "ridicare" | "livrare";
};

export function waDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `40${digits.slice(1)}`;
  return digits;
}

export function intlPhone(phone: string) {
  const digits = waDigits(phone);
  return digits ? `+${digits}` : "";
}

export function openWhatsApp(phone: string, text: string) {
  const digits = waDigits(phone);
  const url = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function orderBody(opts: {
  customerName: string;
  customerPhone: string;
  address: string;
  slot: string;
  items: PacketItem[];
  totalBani: number;
  deliveryBani: number;
}): string {
  const groups = new Map<string, PacketItem[]>();
  for (const item of opts.items) {
    const list = groups.get(item.producerId) ?? [];
    list.push(item);
    groups.set(item.producerId, list);
  }
  const delivery = opts.items.some((i) => i.fulfillment === "livrare");
  const pickup = opts.items.some((i) => i.fulfillment === "ridicare");
  const whenParts: string[] = [];
  if (opts.slot) {
    if (delivery && pickup) whenParts.push(`Ora: ${opts.slot}`);
    else if (delivery) whenParts.push(`Livrare: ${opts.slot}`);
    else whenParts.push(`Ridicare: ${opts.slot}`);
  }
  const parts = [
    "Comandă din Aprozarul Românesc",
    "",
    `Nume: ${opts.customerName}`,
    `Telefon: ${opts.customerPhone}`,
    ...whenParts,
  ];
  if (delivery && opts.address.trim()) parts.push(`Adresă: ${opts.address.trim()}`);
  parts.push("", "Produse:");
  for (const items of groups.values()) {
    const farm = items[0]?.producerName;
    if (groups.size > 1 && farm) parts.push("", farm);
    for (const i of items) {
      parts.push(`• ${formatQty(i.qty, i.unit)} ${i.productName} — ${formatLei(i.lineBani)}`);
    }
  }
  if (opts.deliveryBani > 0) parts.push("", `Drum: ${formatLei(opts.deliveryBani)}`);
  parts.push("", `Total: ${formatLei(opts.totalBani)}`);
  return parts.join("\n");
}

export function buildProducerPackets(opts: {
  customerName: string;
  customerPhone: string;
  address: string;
  slot: string;
  items: PacketItem[];
  totalBani: number;
  deliveryBani: number;
  phones?: Record<string, string>;
}): ProducerPacket[] {
  const seen = new Map<string, PacketItem[]>();
  for (const item of opts.items) {
    const list = seen.get(item.producerId) ?? [];
    list.push(item);
    seen.set(item.producerId, list);
  }
  const packets: ProducerPacket[] = [];
  for (const [producerId, items] of seen) {
    const producerName = items[0]?.producerName ?? "Fermă";
    const producerPhone =
      items.find((i) => i.producerPhone)?.producerPhone || opts.phones?.[producerId] || "";
    const productsBani = items.reduce((s, i) => s + i.lineBani, 0);
    const wantsDelivery = items.some((i) => i.fulfillment === "livrare");
    const deliveryBani = wantsDelivery ? opts.deliveryBani : 0;
    const totalBani = productsBani + deliveryBani;
    packets.push({
      producerId,
      producerName,
      producerPhone,
      totalBani,
      text: `Bună, ${producerName}!\n\n${orderBody({
        customerName: opts.customerName,
        customerPhone: opts.customerPhone,
        address: opts.address,
        slot: opts.slot,
        items,
        totalBani,
        deliveryBani,
      })}`,
    });
  }
  return packets;
}

export function packetsFromSaved(
  order: SavedOrder,
  producers?: Producer[],
  fallback?: { name: string; phone: string },
): ProducerPacket[] {
  const phones: Record<string, string> = {};
  for (const p of producers ?? []) phones[p.id] = p.phone;
  return buildProducerPackets({
    customerName: order.customerName || fallback?.name || "",
    customerPhone: order.customerPhone || fallback?.phone || "",
    address: order.address,
    slot: order.slot || parseSlot(order.note),
    totalBani: order.totalBani,
    deliveryBani: order.deliveryBani,
    items: order.items.map((i) => ({
      producerId: i.producerId,
      producerName: i.producerName,
      producerPhone: i.producerPhone || phones[i.producerId],
      productName: i.productName,
      qty: i.qty,
      unit: i.unit,
      lineBani: i.lineBani,
      fulfillment: i.fulfillment,
    })),
    phones,
  });
}

export function parseSlot(note: string): string {
  const m = note.match(/(\d{2}:\d{2}\s*[–-]\s*\d{2}:\d{2})/);
  return m?.[1]?.replace(/-/g, "–") ?? "";
}
