import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SuggestMore } from "@/components/suggest-more";
import { Button } from "@/components/ui/button";
import { createMessage, createOrder } from "@/lib/catalog-fns";
import { cartTotals, groupCart } from "@/lib/cart-math";
import { buildProducerPackets, openWhatsApp } from "@/lib/order-message";
import { catalogQueryKey } from "@/lib/use-catalog";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/comanda")({ component: ComandaPage });

const SLOTS = ["08:00 – 10:00", "10:00 – 12:00", "16:00 – 18:00", "18:00 – 20:00"] as const;

const field =
  "h-12 w-full rounded-2xl border border-border bg-elevated px-4 text-base text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ComandaPage() {
  const { data } = useCatalog();
  const items = useShop((s) => s.items);
  const clear = useShop((s) => s.clear);
  const rememberOrder = useShop((s) => s.rememberOrder);
  const contact = useShop((s) => s.contact);
  const rememberContact = useShop((s) => s.rememberContact);
  const setProducerFulfillment = useShop((s) => s.setProducerFulfillment);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [address, setAddress] = useState(contact?.address ?? "");
  const [slot, setSlot] = useState<string>(SLOTS[0]);
  const [wantDelivery, setWantDelivery] = useState(false);
  const [error, setError] = useState("");

  const groups = data ? groupCart(items, data.products, data.producers) : [];
  const canDeliver = groups.some((g) => g.producer.delivery);
  const deliveryOn = wantDelivery && canDeliver;
  const totals = cartTotals(groups);
  const firstPhone = groups.find((g) => g.producer.phone)?.producer.phone ?? "";
  const zone = deliveryZone(groups);
  const deliverIds = groups
    .filter((g) => g.producer.delivery)
    .flatMap((g) => g.items.map((i) => i.product.id));
  const allIds = groups.flatMap((g) => g.items.map((i) => i.product.id));
  const note = `${deliveryOn ? "Livrare" : "Ridicare"}: ${slot}`;

  const orderItems = () =>
    groups.flatMap((g) => {
      const fulfillment =
        deliveryOn && g.producer.delivery ? ("livrare" as const) : ("ridicare" as const);
      return g.items.map((i) => ({
        productId: i.product.id,
        productSlug: i.product.slug,
        productName: i.product.name,
        producerId: g.producer.id,
        producerName: g.producer.name,
        producerPhone: g.producer.phone,
        qty: i.qty,
        unit: i.product.unit,
        unitPriceBani: i.unitBani,
        lineBani: i.lineBani,
        fulfillment,
        image: i.product.image,
        step: i.product.step,
      }));
    });

  const packetsFor = (list: ReturnType<typeof orderItems>) =>
    buildProducerPackets({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      address: deliveryOn ? address.trim() : "",
      slot,
      items: list,
      totalBani: deliveryOn ? totals.totalBani : totals.productsBani,
      deliveryBani: deliveryOn ? totals.deliveryBani : 0,
    });

  const mutation = useMutation({
    mutationFn: () => {
      const list = orderItems();
      return createOrder({
        data: {
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerNote: note,
          address: deliveryOn ? address.trim() : "",
          items: list,
          productsBani: totals.productsBani,
          deliveryBani: deliveryOn ? totals.deliveryBani : 0,
          totalBani: deliveryOn ? totals.totalBani : totals.productsBani,
        },
      });
    },
    onSuccess: async (res) => {
      const list = orderItems();
      const packets = packetsFor(list);
      rememberOrder({
        id: res.id,
        createdAt: new Date().toISOString(),
        totalBani: deliveryOn ? totals.totalBani : totals.productsBani,
        productsBani: totals.productsBani,
        deliveryBani: deliveryOn ? totals.deliveryBani : 0,
        address: deliveryOn ? address.trim() : "",
        note,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        slot,
        status: "noua",
        items: list,
      });
      rememberContact({ name: name.trim(), phone: phone.trim(), address: address.trim() });
      for (const p of packets) {
        void createMessage({
          data: {
            producerId: p.producerId,
            customerName: name.trim(),
            customerPhone: phone.trim(),
            body: p.text,
          },
        });
      }
      clear();
      await qc.invalidateQueries({ queryKey: catalogQueryKey });
      await qc.invalidateQueries({ queryKey: ["orders"] });
      await qc.invalidateQueries({ queryKey: ["messages"] });
      void navigate({ to: "/cos" });
    },
    onError: () => setError("Nu am putut trimite comanda. Încearcă din nou."),
  });

  if (!items.length) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-12 text-center">
          <p className="text-muted">Coșul e gol.</p>
          <Button asChild className="mt-4">
            <Link to="/produse">Alege de pe tarabă</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-3 font-display text-2xl font-semibold">
          {deliveryOn ? "Livrare" : "Ridicare"}
        </h1>
        <p className="mt-1 text-sm text-muted">{deliveryOn ? zone : "De la poarta fermei, la ora aleasă."}</p>

        {canDeliver ? (
          <div className="mt-4 flex rounded-full bg-sunken p-1 text-sm font-semibold">
            <button
              type="button"
              className={cn(
                "h-10 flex-1 rounded-full",
                !deliveryOn ? "bg-primary text-primary-fg" : "text-muted",
              )}
              onClick={() => {
                setWantDelivery(false);
                if (allIds.length) setProducerFulfillment(allIds, "ridicare");
              }}
            >
              Ridicare
            </button>
            <button
              type="button"
              className={cn(
                "h-10 flex-1 rounded-full",
                deliveryOn ? "bg-primary text-primary-fg" : "text-muted",
              )}
              onClick={() => {
                setWantDelivery(true);
                if (deliverIds.length) setProducerFulfillment(deliverIds, "livrare");
              }}
            >
              Livrare
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Fermele din coș aduc marfa la ridicare.</p>
        )}

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (name.trim().length < 2 || phone.trim().length < 8) {
              setError("Scrie numele și un telefon la care poți fi sunat.");
              return;
            }
            if (deliveryOn && address.trim().length < 4) {
              setError("Pentru livrare trebuie o adresă.");
              return;
            }
            const packets = packetsFor(orderItems());
            if (packets[0]) openWhatsApp(packets[0].producerPhone, packets[0].text);
            mutation.mutate();
          }}
        >
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nume"
            autoComplete="name"
            required
          />
          <input
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
          />
          {deliveryOn ? (
            <textarea
              className={`${field} min-h-24 py-3`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresă"
              autoComplete="street-address"
            />
          ) : null}

          <p className="pt-1 text-sm font-semibold">
            Ora {deliveryOn ? "livrării" : "ridicării"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                className={cn(
                  "h-12 rounded-2xl border text-sm font-semibold",
                  slot === s
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-elevated text-fg",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <SuggestMore
            excludeIds={items.map((i) => i.productId)}
            position="checkout_more"
            hideAd
          />

          <div className="flex gap-2 pt-2">
            {firstPhone ? (
              <Button asChild variant="secondary" className="h-12 flex-1 rounded-full">
                <a href={`tel:${firstPhone.replace(/\s/g, "")}`}>
                  <Phone className="size-4" />
                  Sună acum!
                </a>
              </Button>
            ) : null}
            <Button
              type="submit"
              className="h-12 flex-1 rounded-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Se trimite…" : "Comandă acum!"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function deliveryZone(groups: ReturnType<typeof groupCart>) {
  const places = [...new Set(groups.map((g) => g.producer.village).filter(Boolean))];
  const counties = [...new Set(groups.map((g) => g.producer.county).filter(Boolean))];
  const where = [...places, ...counties.filter((c) => !places.includes(c))].slice(0, 4);
  if (!where.length) return "Livrare mâine, în satele din jur.";
  return `${where.join(", ")} și satele din jur · mâine`;
}
