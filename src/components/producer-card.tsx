import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
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
        "absolute top-2 left-2 z-10 flex items-center gap-0.5 rounded-full bg-fg/75 px-2 py-0.5 text-xs font-semibold text-bg tabular-nums",
        className,
      )}
    >
      <Star className="size-3.5 fill-star text-star" />
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
        "overflow-hidden rounded-2xl border border-border bg-elevated shadow-soft",
        layout === "scroll" ? "w-[min(72vw,18rem)] shrink-0" : "w-full",
      )}
    >
      <div className="relative">
        <img
          src={producer.image}
          alt=""
          className={cn("w-full object-cover", flat ? "aspect-[4/3]" : "aspect-square")}
        />
        <RatingBadge rating={producer.rating} count={producer.ratingCount} />
        <img
          src={avatar}
          alt=""
          className="absolute bottom-2 left-2 size-12 rounded-full object-cover outline outline-2 outline-bg"
        />
      </div>
      <div className="px-3 pt-2 pb-3">
        <p className="truncate text-base font-semibold leading-snug">{producer.name}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="tabular-nums">{producer.km.toLocaleString("ro-RO")} km</span>
          <span className="truncate">· {producer.village}</span>
        </p>
      </div>
    </Link>
  );
}
