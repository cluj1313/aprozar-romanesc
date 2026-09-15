import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { adsAreBlocked } from "@/lib/ad-block";
import { isAdLive, isLeadAd, LEAD_AD_SECONDS } from "@/lib/ad-live";
import { DEFAULT_AD_SECONDS } from "@/lib/ad-pricing";
import { useShop } from "@/lib/store";
import type { Ad, AdPosition } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export function AdBanner({
  ad,
  className,
  fill,
  compact,
}: {
  ad: Pick<Ad, "title" | "body" | "image" | "orientation"> & { linkUrl?: string };
  producerName?: string;
  className?: string;
  fill?: boolean;
  compact?: boolean;
}) {
  const thin = ad.orientation !== "vertical";
  const hasImg = Boolean(ad.image);
  const external = /^https?:\/\//i.test(ad.linkUrl ?? "");

  if (compact) {
    if (hasImg) {
      return (
        <div className={cn("relative h-full w-full overflow-hidden bg-primary", className)}>
          <img src={ad.image} alt="" className="absolute inset-0 size-full object-cover object-center" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          "flex h-full w-full items-center gap-2 bg-primary px-3 text-primary-fg",
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold leading-tight">{ad.title}</p>
          {ad.body ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-primary-fg/90">{ad.body}</p>
          ) : null}
        </div>
        {external ? (
          <span className="shrink-0 rounded-full bg-[#f5c518] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-[#163e18] uppercase">
            Vezi aici
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ad-frame relative overflow-hidden",
        hasImg ? "bg-primary text-primary-fg" : "bg-elevated text-fg",
        fill ? "h-full w-full" : "rounded-xl shadow-soft",
        !fill && (thin ? "aspect-[5/2]" : "aspect-[3/1]"),
        className,
      )}
    >
      {hasImg ? (
        <img src={ad.image} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-primary" />
      )}
      <div
        className={cn(
          "absolute inset-0",
          hasImg ? "bg-gradient-to-t from-fg/80 via-fg/25 to-transparent" : "bg-primary",
        )}
      />
      <div className="absolute inset-0 flex flex-col justify-end px-4 py-2.5">
        <p className="font-display text-lg font-semibold leading-tight text-primary-fg">{ad.title}</p>
        {ad.body ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-primary-fg/95">{ad.body}</p>
        ) : null}
        {external ? (
          <p className="mt-1 text-[11px] font-semibold tracking-wide text-primary-fg uppercase">Deschide →</p>
        ) : null}
      </div>
    </div>
  );
}

function matches(ad: Ad, position: AdPosition) {
  if (ad.position === position) return true;
  if (position === "home_bottom" && ad.position === "cart_below") return true;
  return false;
}

function adHref(
  ad: Ad,
  catalog: { producers: { id: string }[]; products: { id: string; slug: string }[] } | undefined,
) {
  const url = ad.linkUrl?.trim() ?? "";
  if (/^https?:\/\//i.test(url)) return { external: url as string };
  const product = catalog?.products.find((p) => p.id === ad.productId);
  const producer = catalog?.producers.find((p) => p.id === ad.producerId);
  if (product) return { to: "/produse/$slug" as const, params: { slug: product.slug } };
  if (producer) return { to: "/producatori/$id" as const, params: { id: producer.id } };
  return { to: "/produse" as const };
}

const SLIDE_MS = 500;

export function AdSlot({ position, className }: { position: AdPosition; className?: string }) {
  const blocked = useShop((s) => adsAreBlocked(s.adsBlockedUntil));
  const { data } = useCatalog();
  const ads = useMemo(
    () =>
      (data?.ads ?? [])
        .filter((a) => matches(a, position) && isAdLive(a))
        .slice()
        .sort((a, b) => {
          const lead = Number(isLeadAd(b)) - Number(isLeadAd(a));
          if (lead !== 0) return lead;
          const ae = /^https?:\/\//i.test(a.linkUrl ?? "") ? 0 : 1;
          const be = /^https?:\/\//i.test(b.linkUrl ?? "") ? 0 : 1;
          return ae - be;
        }),
    [data?.ads, position],
  );
  const [i, setI] = useState(0);
  const [snap, setSnap] = useState(false);
  const ids = ads.map((a) => a.id).join(",");
  const loop = ads.length > 1;
  const slides = loop ? [...ads, ads[0]] : ads;
  const vertical = ads[0]?.orientation === "vertical";
  const current = i < ads.length ? ads[i] : ads[0];
  const seconds = current
    ? isLeadAd(current)
      ? LEAD_AD_SECONDS
      : current.displaySeconds || DEFAULT_AD_SECONDS
    : DEFAULT_AD_SECONDS;
  const compact = position === "home_bottom" || position === "checkout_more";

  useEffect(() => {
    setI(0);
    setSnap(false);
  }, [ids]);

  useEffect(() => {
    if (!loop) return;
    if (i === ads.length) return;
    const hold = window.setTimeout(() => setI((n) => n + 1), seconds * 1000);
    return () => window.clearTimeout(hold);
  }, [loop, i, seconds, ids, ads.length]);

  useEffect(() => {
    if (!loop || i !== ads.length) return;
    const t = window.setTimeout(() => {
      setSnap(true);
      setI(0);
    }, SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [i, ads.length, loop]);

  useEffect(() => {
    if (!snap) return;
    let id2 = 0;
    const id1 = window.requestAnimationFrame(() => {
      id2 = window.requestAnimationFrame(() => setSnap(false));
    });
    return () => {
      window.cancelAnimationFrame(id1);
      window.cancelAnimationFrame(id2);
    };
  }, [snap]);

  if (blocked || !ads.length) return null;

  return (
    <div className={cn("px-4 pb-2", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-primary text-primary-fg shadow-soft",
          compact ? "h-[4.5rem] rounded-lg" : vertical ? "aspect-[3/1]" : "aspect-[5/2]",
        )}
      >
        {slides.map((slide, n) => {
          const href = adHref(slide, data);
          const offset = n - i;
          const cls = cn(
            "absolute inset-0 block",
            offset === 0 ? "z-[1]" : "pointer-events-none",
            !snap && "ad-slide",
          );
          const style = {
            transform: compact || !vertical
              ? `translate3d(${offset * 100}%, 0, 0)`
              : `translate3d(0, ${offset * 100}%, 0)`,
          };
          const inner = <AdBanner ad={slide} fill compact={compact} />;
          if ("external" in href) {
            return (
              <a
                key={`${slide.id}-${n}`}
                href={href.external}
                target="_blank"
                rel="noreferrer"
                className={cls}
                style={style}
                tabIndex={offset === 0 ? 0 : -1}
                aria-hidden={offset !== 0}
              >
                {inner}
              </a>
            );
          }
          return (
            <Link
              key={`${slide.id}-${n}`}
              to={href.to}
              params={"params" in href ? href.params : undefined}
              className={cls}
              style={style}
              tabIndex={offset === 0 ? 0 : -1}
              aria-hidden={offset !== 0}
            >
              {inner}
            </Link>
          );
        })}
        {loop ? (
          <div className="pointer-events-none absolute end-2 top-2 z-10 flex gap-1" aria-hidden>
            {ads.map((item, n) => (
              <span
                key={item.id}
                className={cn(
                  "size-1.5 rounded-full",
                  n === i % ads.length ? "bg-primary-fg" : "bg-primary-fg/40",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function liveAds(ads: Ad[] | undefined, position: AdPosition) {
  return (ads ?? []).filter((a) => matches(a, position) && isAdLive(a));
}
