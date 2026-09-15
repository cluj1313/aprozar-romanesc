import { Heart, MapPin, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AdSlot } from "@/components/ad-slot";
import { useCatalog } from "@/lib/use-catalog";
import { formatLei } from "@/lib/money";
import { useShop } from "@/lib/store";
import type { AdPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SuggestMore({
  excludeIds,
  position,
  hideAd,
}: {
  excludeIds?: string[];
  position: AdPosition;
  hideAd?: boolean;
}) {
  const { data } = useCatalog();
  const add = useShop((s) => s.add);
  const setMany = useShop((s) => s.setMany);
  const setFlash = useShop((s) => s.setFlash);
  const favorites = useShop((s) => s.favorites);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const skip = new Set(excludeIds ?? []);
  const list = (data?.products ?? [])
    .filter((p) => p.visible && !skip.has(p.id))
    .slice()
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder)
    .slice(0, 6);

  const addFarm = (producerId: string, name: string) => {
    const goods = (data?.products ?? []).filter(
      (p) => p.visible && p.producerId === producerId && !skip.has(p.id),
    );
    if (!goods.length) return;
    setMany(goods.map((p) => ({ productId: p.id, qty: p.step, step: p.step })));
    setFlash(`Am pus marfa de la ${name} în coș`);
  };

  return (
    <section className="mt-5">
      <h2 className="text-base font-semibold">Poate te-ar mai interesa și…</h2>
      {hideAd ? null : <AdSlot position={position} className="mt-2 px-0 pb-0" />}
      {list.length ? (
        <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pe-4">
          {list.map((p) => {
            const farm = data?.producers.find((x) => x.id === p.producerId);
            const loved = favorites.includes(p.id);
            return (
              <article key={p.id} className="w-36 shrink-0">
                <div className="relative">
                  <Link to="/produse/$slug" params={{ slug: p.slug }} className="block">
                    <img src={p.image} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  </Link>
                  <button
                    type="button"
                    aria-label={loved ? "Scoate de la favorite" : "Pune la favorite"}
                    onClick={() => toggleFavorite(p.id)}
                    className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
                  >
                    <Heart className={cn("size-4", loved && "fill-primary")} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Adaugă ${p.name} în coș`}
                    onClick={() => add(p.id, p.step, p.step)}
                    className="absolute right-1.5 bottom-1.5 flex size-9 items-center justify-center rounded-md bg-primary text-primary-fg shadow-soft"
                  >
                    <Plus className="size-5" strokeWidth={1.75} />
                  </button>
                </div>
                <Link to="/produse/$slug" params={{ slug: p.slug }}>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug">{p.name}</p>
                </Link>
                {farm ? (
                  <p className="mt-0.5 truncate text-xs font-medium">{farm.name}</p>
                ) : null}
                {farm ? (
                  <p className="flex items-center gap-0.5 text-xs text-muted">
                    <MapPin className="size-3 shrink-0 text-primary" />
                    <span className="truncate tabular-nums">
                      {farm.km.toLocaleString("ro-RO")} km · {farm.village}
                    </span>
                  </p>
                ) : null}
                <p className="font-price mt-0.5 text-sm font-semibold">{formatLei(p.priceBani)}</p>
                {farm ? (
                  <label className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-muted">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-3.5 shrink-0 accent-primary"
                      onChange={(e) => {
                        if (e.target.checked) addFarm(farm.id, farm.name);
                      }}
                    />
                    <span>Toate produsele de la acest producător</span>
                  </label>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
