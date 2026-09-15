import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdBanner } from "@/components/ad-slot";
import { adminField } from "@/components/admin/pills";
import { ImageField } from "@/components/image-field";
import { Button } from "@/components/ui/button";
import { isLeadAd, LEAD_AD_SECONDS } from "@/lib/ad-live";
import { moderateAdCopy } from "@/lib/ad-moderation";
import { deleteAd, saveAd, toggleAd, updateAd } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { Ad } from "@/lib/types";
import { catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";
import { cn } from "@/lib/utils";

const SECONDS = [5, 8, 10, 12, 15, 20];

function normalizeUrl(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function HomeAds({ ads }: { ads: Ad[] }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const bottom = ads
    .filter((a) => a.position === "home_bottom")
    .slice()
    .sort((a, b) => Number(isLeadAd(b)) - Number(isLeadAd(a)));

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [seconds, setSeconds] = useState(10);
  const verdict = moderateAdCopy(title, body);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: platformQueryKey });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const put = useMutation({
    mutationFn: () =>
      saveAd({
        data: {
          producerId: null,
          productId: null,
          title: title.trim(),
          body: body.trim(),
          position: "home_bottom",
          orientation: "horizontal",
          durationHours: 8760,
          displaySeconds: seconds,
          costBani: 0,
          mode: "static",
          image,
          linkUrl: normalizeUrl(linkUrl),
          publish: true,
        },
      }),
    onSuccess: (res) => {
      if (res && "ok" in res && !res.ok) {
        setFlash(res.error);
        return;
      }
      setTitle("");
      setBody("");
      setImage("");
      setLinkUrl("");
      setSeconds(10);
      setFlash("Reclama e live jos pe Acasă");
      invalidate();
    },
  });

  const edit = useMutation({
    mutationFn: (p: Parameters<typeof updateAd>[0]["data"]) => updateAd({ data: p }),
    onSuccess: (res) => {
      if (res && "ok" in res && !res.ok) {
        setFlash(res.error);
        return;
      }
      invalidate();
    },
  });
  const tog = useMutation({
    mutationFn: (p: { id: string; active: boolean }) => toggleAd({ data: p }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAd({ data: { id } }),
    onSuccess: invalidate,
  });

  function add() {
    if (title.trim().length < 2) return;
    if (!verdict.ok) {
      setFlash(verdict.reason);
      return;
    }
    put.mutate();
  }

  return (
    <section className="rounded-2xl border border-border bg-elevated p-3">
      <h2 className="text-lg font-semibold">Jos pe Acasă</h2>
      <p className="mt-1 text-xs text-muted">
        Tu pui bannerul, secundele și linkul. Prima, la fiecare deschidere, e mereu Servicii Locale —
        {LEAD_AD_SECONDS} secunde. Apoi rulează restul, fiecare cât ai setat.
      </p>

      <p className="mt-4 text-xs font-semibold text-muted">Firmă din afară</p>
      <input
        className={`${adminField} mt-1 h-11`}
        placeholder="Numele firmei"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className={`${adminField} mt-2 h-11`}
        placeholder="Text scurt pe banner"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <input
        className={`${adminField} mt-2 h-11`}
        placeholder="Link site sau aplicație, ex. https://cluj1313.github.io/"
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        inputMode="url"
        autoCapitalize="off"
      />
      <div className="mt-2">
        <ImageField value={image} onChange={setImage} label="Banner / poză" />
      </div>
      <p className="mt-3 text-xs font-semibold text-muted">Secunde pe ecran</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {SECONDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeconds(s)}
            className={cn(
              "h-9 rounded-full px-3 text-sm font-semibold",
              seconds === s ? "bg-primary text-primary-fg" : "border border-border bg-bg",
            )}
          >
            {s} s
          </button>
        ))}
      </div>
      {verdict.ok ? null : <p className="mt-2 text-sm font-semibold text-danger">{verdict.reason}</p>}
      {title.trim().length >= 2 ? (
        <div className="mt-3 h-24 overflow-hidden rounded-xl">
          <AdBanner ad={{ title, body, image, orientation: "horizontal", linkUrl }} compact />
        </div>
      ) : null}
      <Button
        type="button"
        className="mt-3 w-full rounded-xl"
        disabled={put.isPending || title.trim().length < 2 || !verdict.ok}
        onClick={add}
      >
        Pune live jos pe Acasă
      </Button>

      <ul className="mt-4 space-y-2">
        {bottom.map((ad) => {
          const lead = isLeadAd(ad);
          return (
            <li key={ad.id} className="rounded-xl border border-border bg-bg p-2">
              <div className="h-20 overflow-hidden rounded-lg">
                <AdBanner ad={ad} compact />
              </div>
              <p className="mt-2 text-xs font-semibold text-muted">
                {lead
                  ? `Prima la pornire · ${LEAD_AD_SECONDS} s`
                  : `${ad.displaySeconds} s pe ecran`}
                {ad.linkUrl ? ` · ${ad.linkUrl.replace(/^https?:\/\//, "")}` : ""}
              </p>
              {lead ? null : (
                <div className="mt-1 flex flex-wrap gap-1">
                  {SECONDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => edit.mutate({ id: ad.id, displaySeconds: s })}
                      className={cn(
                        "h-7 rounded-full px-2 text-xs font-semibold",
                        ad.displaySeconds === s
                          ? "bg-primary text-primary-fg"
                          : "border border-border",
                      )}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-1 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-sm font-semibold text-primary"
                  onClick={() => tog.mutate({ id: ad.id, active: !ad.active })}
                >
                  {ad.active ? "Oprește" : "Pornește"}
                </button>
                {lead ? null : (
                  <button
                    type="button"
                    className="text-sm font-semibold text-danger"
                    onClick={() => del.mutate(ad.id)}
                  >
                    Șterge
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
