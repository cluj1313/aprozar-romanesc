import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, Star } from "lucide-react";
import { useShop } from "@/lib/store";
import type { Producer } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RatingBadge({
  rating,
  count,
  className,
}: {
  rating: number;
  count: number;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "absolute top-1 left-1 z-10 flex items-center gap-0.5 rounded-full bg-fg/75 px-1.5 py-px text-[10px] font-semibold text-bg tabular-nums",
        className,
      )}
    >
      <Star className="size-2.5 fill-star text-star" />
      {rating.toLocaleString("ro-RO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      <span className="font-medium opacity-80">({count})</span>
    </p>
  );
}

export function ProducerCard({
  producer,
  layout = "tile",
}: {
  producer: Producer;
  layout?: "tile" | "scroll";
}) {
  const cards = useShop((s) => s.prefs.cards);
  const flat = cards === "flat";
  const avatar = producer.avatar || producer.image;
  return (
    <Link
      to="/producatori/$id"
      params={{ id: producer.id }}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-elevated shadow-soft",
        layout === "scroll" ? "w-36 shrink-0" : "w-full",
      )}
    >
      <div className="relative">
        <img
          src={producer.image}
          alt=""
          className={cn("w-full object-cover", flat ? "aspect-[4/3]" : "aspect-[4/3]")}
        />
        <RatingBadge rating={producer.rating} count={producer.ratingCount} />
        <img
          src={avatar}
          alt=""
          className="absolute bottom-1 left-1 size-7 rounded-full object-cover outline outline-2 outline-bg"
        />
      </div>
      <div className="px-1.5 pt-1 pb-1.5">
        <p className="truncate text-xs font-semibold leading-snug">{producer.name}</p>
        <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted">
          <MapPin className="size-2.5 shrink-0 text-primary" />
          <span className="tabular-nums">{producer.km.toLocaleString("ro-RO")} km</span>
          <span className="truncate">· {producer.village}</span>
        </p>
      </div>
    </Link>
  );
}

export function MoreProducersCard() {
  return (
    <Link
      to="/producatori"
      className="flex flex-col overflow-hidden rounded-xl border border-dashed border-primary/40 bg-elevated shadow-soft"
    >
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-primary/8">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-fg">
          <ChevronRight className="size-5" />
        </span>
      </div>
      <div className="px-1.5 pt-1 pb-1.5">
        <p className="text-xs font-semibold leading-snug text-primary">Vezi mai mulți</p>
        <p className="mt-0.5 text-[10px] text-muted">producători</p>
      </div>
    </Link>
  );
}

