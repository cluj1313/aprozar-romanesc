import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdBanner } from "@/components/ad-slot";
import { adminField } from "@/components/admin/pills";
import { SharePay } from "@/components/share-pay";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_AD_SECONDS,
  SHARE_MAX,
  SHARE_MIN,
  adTotal,
  daysOf,
  daysPrice,
  placementPrice,
  placementsOf,
  secondsOf,
  secondsPrice,
} from "@/lib/ad-pricing";
import { moderateAdCopy } from "@/lib/ad-moderation";
import { formatLei } from "@/lib/money";
import { saveAd } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { AdMode, AdOrientation, AdPosition, Producer, Product } from "@/lib/types";
import { catalogQueryKey, useCatalog } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";
import { cn } from "@/lib/utils";

function PriceRow({
  selected,
  title,
  hint,
  price,
  onClick,
  box,
}: {
  selected: boolean;
  title: string;
  hint?: string;
  price: number;
  onClick: () => void;
  box?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 px-3 py-2 text-left">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border",
          box ? "rounded-md" : "rounded-full",
          selected ? "border-primary bg-primary text-primary-fg" : "border-border",
        )}
        aria-hidden
      >
        {selected ? (box ? "✓" : <span className="size-2 rounded-full bg-primary-fg" />) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight">{title}</span>
        {hint ? <span className="block text-xs leading-tight text-muted">{hint}</span> : null}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{formatLei(price)}</span>
    </button>
  );
}

export function AdComposer({
  lockProducerId,
  producers,
  products,
}: {
  lockProducerId?: string;
  producers: Producer[];
  products: Product[];
}) {
  const { data: catalog } = useCatalog();
  const prices = catalog?.adPrices;
  const places = placementsOf(prices);
  const dayRows = daysOf(prices);
  const secRows = secondsOf(prices);
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const credits = useShop((s) => s.adShareCredits);
  const spendAdShares = useShop((s) => s.spendAdShares);
  const promoStartedAt = useShop((s) => s.promoStartedAt);
  const [producerId, setProducerId] = useState(lockProducerId ?? producers[0]?.id ?? "");
  const farmId = lockProducerId ?? producerId;
  const farmProducts = products.filter((p) => p.producerId === farmId);
  const [productId, setProductId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [picked, setPicked] = useState<AdPosition[]>(["home_bottom"]);
  const [orientation, setOrientation] = useState<AdOrientation>("horizontal");
  const [mode, setMode] = useState<AdMode>("carousel");
  const [days, setDays] = useState(7);
  const [seconds, setSeconds] = useState(DEFAULT_AD_SECONDS);
  const [payOpen, setPayOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const isAdmin = useShop((s) => s.session.role === "admin");

  const image =
    products.find((p) => p.id === productId)?.image ??
    producers.find((p) => p.id === farmId)?.image ??
    "";
  const producerName = producers.find((p) => p.id === farmId)?.name;
  const placeCost = placementPrice(picked, prices);
  const dayCost = daysPrice(days, prices);
  const secCost = secondsPrice(seconds, prices);
  const total = adTotal(picked, days, seconds, prices);
  const yearLine = promoStartedAt
    ? `Campania gratuită a pornit pe ${new Date(promoStartedAt).toLocaleDateString("ro-RO")}. Ține un an. Dacă tot aduci oameni, rămâne gratuită.`
    : "Campania de promovare e gratuită un an de la activarea contului. După un an, dacă nu mai aduci useri noi, trece la reclamă cu plată. Cât timp aduci useri, rămâne gratuită.";

  const put = useMutation({
    mutationFn: async () => {
      const hours = days * 24;
      for (const position of picked) {
        const slot = places.find((p) => p.id === position);
        const res = await saveAd({
          data: {
            producerId: farmId || null,
            productId: productId || null,
            title,
            body,
            position,
            orientation,
            durationHours: hours,
            displaySeconds: seconds,
            costBani: (slot?.priceBani ?? 0) + dayCost + secCost,
            mode,
            image,
            linkUrl,
            publish: isAdmin,
          },
        });
        if (res && "ok" in res && !res.ok) return res;
      }
      return { ok: true as const };
    },
    onSuccess: (res) => {
      if (res && "ok" in res && !res.ok) {
        setFlash(res.error);
        return;
      }
      setTitle("");
      setBody("");
      setLinkUrl("");
      setFlash(isAdmin ? "Reclama e live" : "Reclama e trimisă către aprobare");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  const verdict = moderateAdCopy(title, body);

  function place() {
    if (picked.length === 0 || title.trim().length < 2) return;
    if (!verdict.ok) {
      setFlash(verdict.reason);
      return;
    }
    if (credits >= SHARE_MIN && spendAdShares(SHARE_MIN)) {
      put.mutate();
      return;
    }
    setPayOpen(true);
  }

  return (
    <div>
      <p className="text-sm text-muted">{yearLine}</p>
      <p className="mt-1 text-xs text-muted">
        Textul e verificat automat — droguri, arme, fraude, conținut interzis. Ce trece, Gabriel mai
        confirmă. Dacă sunt deja 10 reclame live pe același loc, așteaptă la rând. Achitare: Share
        către {SHARE_MIN}–{SHARE_MAX} oameni.
      </p>

      {lockProducerId ? null : (
        <>
          <p className="mt-3 text-xs font-semibold text-muted">Reclamă la fermă</p>
          <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-elevated">
            {producers.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setProducerId(p.id);
                    setProductId("");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
                >
                  <img src={p.avatar || p.image} alt="" className="size-8 rounded-full object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      producerId === p.id ? "border-primary bg-primary" : "border-border",
                    )}
                  >
                    {producerId === p.id ? <span className="size-2 rounded-full bg-primary-fg" /> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 text-xs font-semibold text-muted">Reclamă la produs</p>
      <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-elevated">
        <li>
          <button
            type="button"
            onClick={() => setProductId("")}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm"
          >
            <span className="min-w-0 flex-1 font-semibold">Fără produs anume — doar ferma</span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                !productId ? "border-primary bg-primary" : "border-border",
              )}
            >
              {!productId ? <span className="size-2 rounded-full bg-primary-fg" /> : null}
            </span>
          </button>
        </li>
        {farmProducts.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setProductId(p.id)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
            >
              <img src={p.image} alt="" className="size-8 rounded-md object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  productId === p.id ? "border-primary bg-primary" : "border-border",
                )}
              >
                {productId === p.id ? <span className="size-2 rounded-full bg-primary-fg" /> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <input
        className={`${adminField} mt-2 h-11`}
        placeholder="Ofertă, ex. −30% la roșii"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className={`${adminField} mt-2 h-11`}
        placeholder="Text scurt"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <input
        className={`${adminField} mt-2 h-11`}
        placeholder="Link, ex. https://cluj1313.github.io/"
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
      />
      {verdict.ok ? null : <p className="mt-2 text-sm font-semibold text-danger">{verdict.reason}</p>}

      <p className="mt-3 text-xs font-semibold text-muted">Locații — costul e în dreapta</p>
      <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-elevated">
        {places.map((p) => {
          const on = picked.includes(p.id);
          return (
            <li key={p.id}>
              <PriceRow
                box
                selected={on}
                title={p.label}
                hint={p.hint}
                price={p.priceBani}
                onClick={() =>
                  setPicked((cur) => (on ? cur.filter((id) => id !== p.id) : [...cur, p.id]))
                }
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-right text-xs font-semibold tabular-nums text-muted">
        Locații: {formatLei(placeCost)}
      </p>

      <p className="mt-3 text-xs font-semibold text-muted">Zile de rulare</p>
      <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-elevated">
        {dayRows.map((d) => (
          <li key={d.days}>
            <PriceRow
              selected={days === d.days}
              title={`${d.days} ${d.days === 1 ? "zi" : "zile"}`}
              price={d.priceBani}
              onClick={() => setDays(d.days)}
            />
          </li>
        ))}
      </ul>
      <p className="mt-1 text-right text-xs font-semibold tabular-nums text-muted">
        Zile: {formatLei(dayCost)}
      </p>

      <p className="mt-3 text-xs font-semibold text-muted">Secunde pe ecran</p>
      <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-elevated">
        {secRows.map((s) => (
          <li key={s.seconds}>
            <PriceRow
              selected={seconds === s.seconds}
              title={`${s.seconds} secunde${s.seconds === DEFAULT_AD_SECONDS ? " · implicit" : ""}`}
              price={s.priceBani}
              onClick={() => setSeconds(s.seconds)}
            />
          </li>
        ))}
      </ul>
      <p className="mt-1 text-right text-xs font-semibold tabular-nums text-muted">
        Secunde: {formatLei(secCost)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOrientation(orientation === "horizontal" ? "vertical" : "horizontal")}
          className="h-10 rounded-xl border border-border bg-elevated text-xs font-semibold"
        >
          {orientation === "horizontal" ? "Formă lată · orizontal" : "Formă 3:1 · vertical"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "carousel" ? "static" : "carousel")}
          className="h-10 rounded-xl border border-border bg-elevated text-xs font-semibold"
        >
          {mode === "carousel" ? "Rulează" : "Fixă"}
        </button>
      </div>

      {title.trim().length >= 2 ? (
        <div className="mt-3">
          <AdBanner ad={{ title, body, image, orientation, linkUrl }} producerName={producerName} />
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-primary bg-elevated px-3 py-2">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Total campanie</p>
            <p className="text-xs text-muted">
              {formatLei(placeCost)} locuri · {formatLei(dayCost)} zile · {formatLei(secCost)} s · Share{" "}
              {credits}/{SHARE_MIN}
            </p>
          </div>
          <p className="font-price text-2xl leading-none font-semibold text-primary">
            {formatLei(total)}
          </p>
        </div>
      </div>

      <Button
        type="button"
        className="mt-3 w-full rounded-xl"
        disabled={put.isPending || title.trim().length < 2 || picked.length === 0 || !verdict.ok}
        onClick={place}
      >
        Trimite către aprobare
      </Button>

      {payOpen ? (
        <SharePay
          needed={SHARE_MIN}
          onDone={() => {
            const check = moderateAdCopy(title, body);
            if (!check.ok) {
              setPayOpen(false);
              setFlash(check.reason);
              return;
            }
            setPayOpen(false);
            spendAdShares(SHARE_MIN);
            put.mutate();
          }}
          onClose={() => setPayOpen(false)}
        />
      ) : null}
    </div>
  );
}
