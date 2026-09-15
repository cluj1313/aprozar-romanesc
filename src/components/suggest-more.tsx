import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { useCatalog } from "@/lib/use-catalog";
import { formatLei } from "@/lib/money";
import type { AdPosition } from "@/lib/types";

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
  const skip = new Set(excludeIds ?? []);
  const list = (data?.products ?? [])
    .filter((p) => p.visible && !skip.has(p.id))
    .slice()
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder)
    .slice(0, 6);

  return (
    <section className="mt-5">
      <h2 className="text-base font-semibold">Poate te-ar mai interesa și…</h2>
      {hideAd ? null : <AdSlot position={position} className="mt-2 px-0 pb-0" />}
      {list.length ? (
        <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pe-4">
          {list.map((p) => {
            const farm = data?.producers.find((x) => x.id === p.producerId);
            return (
              <Link
                key={p.id}
                to="/produse/$slug"
                params={{ slug: p.slug }}
                className="w-32 shrink-0"
              >
                <img src={p.image} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug">{p.name}</p>
                <p className="mt-0.5 truncate text-xs font-medium">{farm?.name}</p>
                {farm ? (
                  <p className="flex items-center gap-0.5 text-xs text-muted">
                    <MapPin className="size-3 shrink-0 text-primary" />
                    <span className="truncate tabular-nums">
                      {farm.km.toLocaleString("ro-RO")} km · {farm.village}
                    </span>
                  </p>
                ) : null}
                <p className="font-price mt-0.5 text-sm font-semibold">{formatLei(p.priceBani)}</p>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
