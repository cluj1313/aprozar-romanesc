import { AdBanner } from "@/components/ad-slot";
import { AdStage } from "@/components/ad-stage";
import { AD_PLACEMENTS } from "@/lib/ad-pricing";
import { adListRank } from "@/lib/ad-live";
import { formatLei } from "@/lib/money";
import type { Ad } from "@/lib/types";

export function MyAds({
  ads,
  allAds,
  heading = "Reclamele mele",
}: {
  ads: Ad[];
  allAds: Ad[];
  heading?: string;
}) {
  if (!ads.length) return null;
  const ordered = ads.slice().sort((a, b) => {
    const ra = adListRank(a);
    const rb = adListRank(b);
    if (ra !== rb) return ra - rb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <p className="mt-1 text-xs text-muted">
        Trei stadii: verificare automată, apoi în așteptare dacă sunt mai mult de 10 pe același loc,
        apoi live cu zilele rămase.
      </p>
      <ul className="mt-3 space-y-2">
        {ordered.map((ad) => {
          const slot = AD_PLACEMENTS.find((p) => p.id === ad.position);
          return (
            <li key={ad.id} className="space-y-2 rounded-2xl border border-border bg-elevated p-3">
              <AdBanner ad={ad} />
              <AdStage ad={ad} ads={allAds} />
              <p className="text-xs text-muted">
                {slot?.label ?? ad.position}
                {ad.costBani ? ` · ${formatLei(ad.costBani)}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
