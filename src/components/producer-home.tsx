import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Megaphone, Plus, Sprout, Star, Warehouse } from "lucide-react";
import { AdComposer } from "@/components/ad-composer";
import { MyAds } from "@/components/my-ads";
import { MyNotices } from "@/components/my-notices";
import { listOrders } from "@/lib/catalog-fns";
import { formatLei } from "@/lib/money";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export function ProducerHome() {
  const session = useShop((s) => s.session);
  const { data } = useCatalog();
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: () => listOrders() });
  const producerId = session.role === "producer" ? session.producerId : null;
  const products = (data?.products ?? []).filter((p) => !producerId || p.producerId === producerId);
  const producer = data?.producers.find((p) => p.id === producerId);
  const orders = (ordersQ.data ?? []).filter(
    (o) => !producerId || o.items.some((i) => i.producerId === producerId),
  );
  const pending = orders.filter((o) => o.status === "noua");
  const ads = data?.ads ?? [];
  const mine = ads.filter((a) => producerId && a.producerId === producerId);
  const [compose, setCompose] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <h1 className="font-display text-2xl font-semibold">Taraba mea</h1>
      <p className="mt-1 text-sm text-muted">
        {producer?.name ?? "Ferma ta"}. Contul ăsta e al tău — administratorul aplicației nu umblă aici.
      </p>

      <div className="mt-4">
        <MyNotices />
      </div>

      <MyAds ads={mine} allAds={ads} />

      {producerId ? (
        <div className="mt-4">
          <button
            type="button"
            className="h-11 w-full rounded-xl border border-border bg-elevated text-sm font-semibold"
            onClick={() => setCompose((v) => !v)}
          >
            {compose ? "Închide calculatorul de reclamă" : "Pune o reclamă"}
          </button>
          {compose ? (
            <div className="mt-3">
              <AdComposer
                lockProducerId={producerId}
                producers={data?.producers ?? []}
                products={data?.products ?? []}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-panel px-2 py-4 text-center text-panel-fg">
          <Warehouse className="mx-auto size-5 text-primary" />
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{products.length}</p>
          <p className="text-[11px] text-muted">Total produse</p>
        </div>
        <div className="rounded-2xl bg-panel px-2 py-4 text-center text-panel-fg">
          <Sprout className="mx-auto size-5 text-primary" />
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {products.filter((p) => p.visible && p.stock > 0).length}
          </p>
          <p className="text-[11px] text-muted">Disponibile</p>
        </div>
        <div className="rounded-2xl bg-panel px-2 py-4 text-center text-panel-fg">
          <Star className="mx-auto size-5 fill-star text-star" />
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{producer?.ratingCount ?? 0}</p>
          <p className="text-[11px] text-muted">{producer?.ratingCount ?? 0} recenzii</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          to="/admin/produs/$id"
          params={{ id: "nou" }}
          className="rounded-2xl bg-panel px-4 py-4 text-panel-fg"
        >
          <Plus className="size-5 text-primary" />
          <p className="mt-3 font-semibold">Adaugă produs</p>
          <p className="mt-0.5 text-xs text-muted">Produs nou cu poză și preț</p>
        </Link>
        <Link to="/admin/comenzi" className="rounded-2xl bg-panel px-4 py-4 text-panel-fg">
          <Sprout className="size-5 text-primary" />
          <p className="mt-3 font-semibold">Comenzi</p>
          <p className="mt-0.5 text-xs text-muted">
            {pending.length ? `${pending.length} noi` : "Anunță clienții"}
          </p>
        </Link>
        <Link to="/admin/comenzi" className="rounded-2xl bg-panel px-4 py-4 text-panel-fg">
          <Megaphone className="size-5 text-primary" />
          <p className="mt-3 font-semibold">Mesaje</p>
          <p className="mt-0.5 text-xs text-muted">Reduceri, oferte, concediu</p>
        </Link>
        {producerId ? (
          <Link
            to="/producatori/$id"
            params={{ id: producerId }}
            className="rounded-2xl bg-panel px-4 py-4 text-panel-fg"
          >
            <Warehouse className="size-5 text-primary" />
            <p className="mt-3 font-semibold">Pagina fermei</p>
            <p className="mt-0.5 text-xs text-muted">Copertă, avatar, marfa de azi</p>
          </Link>
        ) : (
          <Link to="/admin/producatori" className="rounded-2xl bg-panel px-4 py-4 text-panel-fg">
            <Warehouse className="size-5 text-primary" />
            <p className="mt-3 font-semibold">Profilul fermei</p>
            <p className="mt-0.5 text-xs text-muted">Poze, locație, contact</p>
          </Link>
        )}
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Produsele mele</h2>
          <Link
            to="/admin/produs/$id"
            params={{ id: "nou" }}
            className="inline-flex h-10 items-center rounded-full bg-primary px-3 text-sm font-semibold text-primary-fg"
          >
            + Adaugă produs
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-elevated">
          {products.slice(0, 8).map((p) => (
            <li key={p.id}>
              <Link
                to="/admin/produs/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 px-3 py-3"
              >
                <img src={p.image} alt="" className="size-12 rounded-lg object-cover" />
                <p className="min-w-0 flex-1 font-semibold">{p.name}</p>
                <p className="font-price text-sm font-semibold">{formatLei(p.priceBani)}</p>
              </Link>
            </li>
          ))}
          {products.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">Niciun produs. Pune primul pe tarabă.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
