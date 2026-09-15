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
        "absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 rounded-full bg-fg/75 px-1.5 py-0.5 text-xs font-semibold text-bg tabular-nums",
        className,
      )}
    >
      <Star className="size-3 fill-star text-star" />
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
        layout === "scroll" ? (flat ? "w-44 shrink-0" : "w-36 shrink-0") : "w-full",
      )}
    >
      <div className="relative">
        <img
          src={producer.image}
          alt=""
          className={cn("w-full object-cover", flat ? "aspect-[3/2]" : "aspect-[4/5]")}
        />
        <RatingBadge rating={producer.rating} count={producer.ratingCount} />
        <img
          src={avatar}
          alt=""
          className="absolute bottom-1.5 left-1.5 size-10 rounded-full object-cover outline outline-2 outline-bg"
        />
      </div>
      <div className="px-2 pt-1.5 pb-2">
        <p className="truncate text-sm font-semibold">{producer.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="size-3 text-primary" />
          <span className="tabular-nums">{producer.km.toLocaleString("ro-RO")} km</span>
          <span className="truncate">· {producer.village}</span>
        </p>
      </div>
    </Link>
  );
}
