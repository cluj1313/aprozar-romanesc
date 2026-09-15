import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdBanner } from "@/components/ad-slot";
import { AdComposer } from "@/components/ad-composer";
import { AdStage } from "@/components/ad-stage";
import { AdPricesPanel } from "@/components/admin/ad-prices";
import { HomeAds } from "@/components/admin/home-ads";
import { AD_PLACEMENTS } from "@/lib/ad-pricing";
import { adListRank, adStatusOf } from "@/lib/ad-live";
import { formatLei } from "@/lib/money";
import { approveAd, deleteAd, rejectAd, toggleAd } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";

export function TabReclame({ platform }: { platform: Platform }) {
  const { data } = useCatalog();
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const producers = data?.producers ?? [];
  const products = data?.products ?? [];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: platformQueryKey });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const tog = useMutation({
    mutationFn: (p: { id: string; active: boolean }) => toggleAd({ data: p }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAd({ data: { id } }),
    onSuccess: invalidate,
  });
  const approve = useMutation({
    mutationFn: (id: string) => approveAd({ data: { id } }),
    onSuccess: (res) => {
      if (res && "ok" in res && !res.ok) {
        setFlash(res.error);
        invalidate();
        return;
      }
      if (res && "stage" in res && res.stage === "queued") {
        setFlash("Reclama e în așteptare — locul se vede în Cont");
      } else {
        setFlash("Reclama e live");
      }
      invalidate();
    },
  });
  const reject = useMutation({
    mutationFn: (id: string) => rejectAd({ data: { id } }),
    onSuccess: () => {
      setFlash("Reclama e respinsă");
      invalidate();
    },
  });

  const ads = platform.ads.slice().sort((a, b) => {
    const ra = adListRank(a);
    const rb = adListRank(b);
    if (ra !== rb) return ra - rb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const pending = ads.filter((a) => adStatusOf(a) === "review").length;
  const farmAds = ads.filter((a) => a.position !== "home_bottom");

  return (
    <div className="pb-8">
      <HomeAds ads={platform.ads} />
      <AdPricesPanel prices={platform.adPrices ?? []} />

      <h2 className="mt-8 text-lg font-semibold">Reclame de la ferme</h2>
      <AdComposer producers={producers} products={products} />

      <h2 className="mt-6 text-lg font-semibold">
        Toate reclamele{pending ? ` · ${pending} de aprobat` : ""}
      </h2>
      <p className="mt-1 text-xs text-muted">
        Textul e verificat automat (droguri, arme, fraude, conținut interzis). Tu confirmi sau
        respingi ce a trecut. Dacă sunt deja 10 live pe același loc, aprobarea o pune în așteptare.
      </p>

      <ul className="mt-3 space-y-2">
        {farmAds.map((ad) => {
          const producer = producers.find((p) => p.id === ad.producerId);
          const slot = AD_PLACEMENTS.find((p) => p.id === ad.position);
          const status = adStatusOf(ad);
          return (
            <li key={ad.id} className="space-y-2 rounded-2xl border border-border bg-elevated p-3">
              <AdBanner ad={ad} producerName={producer?.name} />
              <AdStage ad={ad} ads={platform.ads} />
              <p className="text-xs text-muted">
                {producer?.name ?? (ad.linkUrl ? "Firmă" : "Fermă")} · {slot?.label ?? ad.position}
                {ad.displaySeconds ? ` · ${ad.displaySeconds}s` : ""}
                {ad.costBani ? ` · ${formatLei(ad.costBani)}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {status === "review" || status === "queued" ? (
                  <>
                    <button
                      type="button"
                      className="text-sm font-semibold text-primary"
                      onClick={() => approve.mutate(ad.id)}
                    >
                      Aprobă
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-danger"
                      onClick={() => reject.mutate(ad.id)}
                    >
                      Respinge
                    </button>
                  </>
                ) : status === "live" ? (
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary"
                    onClick={() => tog.mutate({ id: ad.id, active: !ad.active })}
                  >
                    {ad.active ? "Oprește" : "Pornește"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-sm font-semibold text-danger"
                  onClick={() => del.mutate(ad.id)}
                >
                  Șterge
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
