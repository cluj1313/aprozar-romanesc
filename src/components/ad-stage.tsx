import { AD_PLACEMENTS } from "@/lib/ad-pricing";
import {
  AD_STAGE_PILLS,
  adStage,
  daysLeft,
  isAdLive,
  queuePosition,
  remainingMs,
} from "@/lib/ad-live";
import type { Ad } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdStagePills({ ad }: { ad: Ad }) {
  const stage = adStage(ad);
  if (stage < 0) {
    return (
      <p className="rounded-full bg-danger/15 px-3 py-1.5 text-center text-xs font-semibold text-danger">
        Respinsă{ad.rejectReason ? ` — ${ad.rejectReason}` : ""}
      </p>
    );
  }
  return (
    <div className="flex gap-1">
      {AD_STAGE_PILLS.map((label, i) => {
        const on = i === stage;
        const done = i < stage;
        return (
          <span
            key={label}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center rounded-full px-1.5 py-1.5 text-center text-[10px] leading-tight font-semibold",
              on && "bg-primary text-primary-fg",
              done && "bg-primary/15 text-primary",
              !on && !done && "bg-sunken text-muted",
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

export function AdStageDetail({ ad, ads }: { ad: Ad; ads: Ad[] }) {
  const slot = AD_PLACEMENTS.find((p) => p.id === ad.position);
  const pos = queuePosition(ad, ads);
  const live = isAdLive(ad);

  if (ad.status === "review") {
    return (
      <p className="mt-2 text-xs leading-snug text-muted">
        Verificare automată trecută. Gabriel mai confirmă că e potrivită pe tarabă.
      </p>
    );
  }
  if (ad.status === "queued") {
    return (
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tabular-nums leading-none text-primary">
          {pos || "—"}
        </span>
        <span className="min-w-0 text-sm leading-snug text-muted">
          locul tău în coadă pe {slot?.label ?? ad.position}. Maxim 10 reclame live pe același loc.
        </span>
      </p>
    );
  }
  if (ad.status === "live") {
    if (!live) {
      return <p className="mt-2 text-sm font-semibold text-muted">Campania s-a încheiat</p>;
    }
    const ms = remainingMs(ad);
    if (ms < 24 * 3600 * 1000) {
      const hours = Math.max(1, Math.ceil(ms / (3600 * 1000)));
      return (
        <p className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tabular-nums leading-none text-primary">
            {hours}
          </span>
          <span className="text-sm text-muted">{hours === 1 ? "oră rămasă" : "ore rămase"}</span>
        </p>
      );
    }
    const days = daysLeft(ad);
    return (
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tabular-nums leading-none text-primary">
          {days}
        </span>
        <span className="text-sm text-muted">{days === 1 ? "zi rămasă" : "zile rămase"}</span>
      </p>
    );
  }
  return null;
}

export function AdStage({ ad, ads }: { ad: Ad; ads: Ad[] }) {
  return (
    <div>
      <AdStagePills ad={ad} />
      <AdStageDetail ad={ad} ads={ads} />
    </div>
  );
}
