import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/wa-icon";
import { intlPhone, waDigits } from "@/lib/order-message";
import type { AppLiveStats, AppProfile } from "@/lib/types";

export function AppCover({
  profile,
  stats,
}: {
  profile: AppProfile;
  stats: AppLiveStats;
}) {
  const digits = waDigits(profile.phone);
  const tel = intlPhone(profile.phone);
  const waHref = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(`Bună, ${profile.name}! Te-am găsit pe Aprozar Românesc.`)}`
    : undefined;

  return (
    <div className="relative">
      <img
        src={profile.cover || "/images/splash.png"}
        alt=""
        className="aspect-[2/1] w-full object-cover"
      />
      <div className="absolute top-2 right-3 z-10 flex gap-1.5">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="flex size-11 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
          >
            <WhatsAppIcon className="size-5" />
          </a>
        ) : null}
        {tel ? (
          <a
            href={`tel:${tel}`}
            aria-label={`Sună ${tel}`}
            className="flex size-11 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
          >
            <Phone className="size-5" />
          </a>
        ) : null}
      </div>
      <img
        src={profile.avatar || "/images/logo-badge.png"}
        alt=""
        className="absolute bottom-2 left-3 z-10 size-14 rounded-full bg-bg object-cover outline outline-2 outline-bg"
      />
      <div
        className="absolute right-2 bottom-2 z-10 space-y-0.5 rounded-md bg-fg/50 px-2 py-1 text-bg backdrop-blur-sm"
        aria-label="Statistici live"
      >
        <StatLine n={stats.uniqueVisitors} label="vizitatori unici" />
        <StatLine n={stats.producers} label="producători" />
        <StatLine n={stats.activeClients} label="clienți activi" />
      </div>
    </div>
  );
}

function StatLine({ n, label }: { n: number; label: string }) {
  return (
    <p className="flex items-baseline justify-end gap-1 leading-tight">
      <span className="font-display text-sm font-semibold tabular-nums">
        {n.toLocaleString("ro-RO")}
      </span>
      <span className="text-xs font-normal opacity-80">{label}</span>
    </p>
  );
}
