import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { QtyStepper } from "@/components/qty-stepper";
import { formatLei } from "@/lib/money";
import { useShop } from "@/lib/store";
import type { Producer, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CartLine({
  product,
  producer,
  qty,
  lineBani,
}: {
  product: Product;
  producer?: Producer;
  qty: number;
  lineBani: number;
}) {
  const setQty = useShop((s) => s.setQty);
  const favorites = useShop((s) => s.favorites);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const loved = favorites.includes(product.id);

  return (
    <li className="flex items-start gap-3 border-b border-border py-4 last:border-0">
      <Link
        to="/produse/$slug"
        params={{ slug: product.slug }}
        className="shrink-0"
      >
        <img
          src={product.image}
          alt=""
          className="size-16 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-black/10"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to="/produse/$slug"
          params={{ slug: product.slug }}
          className="block font-semibold leading-snug"
        >
          {product.name}
        </Link>
        {producer ? <p className="mt-0.5 text-sm text-muted">{producer.name}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="font-price text-lg font-semibold text-primary">{formatLei(lineBani)}</p>
        <div className="flex items-center gap-1">
          <QtyStepper
            compact
            allowZero
            qty={qty}
            step={product.step}
            unit={product.unit}
            onChange={(q) => setQty(product.id, q, product.step)}
          />
          <button
            type="button"
            aria-label={loved ? "Scoate de la favorite" : "Pune la favorite"}
            onClick={() => toggleFavorite(product.id)}
            className="flex size-11 items-center justify-center text-primary"
          >
            <Heart className={cn("size-5", loved && "fill-primary")} />
          </button>
        </div>
      </div>
    </li>
  );
}
