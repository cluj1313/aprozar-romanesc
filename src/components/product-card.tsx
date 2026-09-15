import { Heart, Plus } from "lucide-react";
import { Children, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AdSlot } from "@/components/ad-slot";
import { formatLei } from "@/lib/money";
import { useShop } from "@/lib/store";
import type { Producer, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGrid({
  children,
  className,
  everyFifth,
}: {
  children: ReactNode;
  className?: string;
  everyFifth?: boolean;
}) {
  const items = Children.toArray(children);
  const nodes: ReactNode[] = [];
  items.forEach((child, i) => {
    nodes.push(child);
    if (everyFifth && (i + 1) % 5 === 0) {
      nodes.push(
        <div key={`ad-${i}`} className="col-span-2 min-w-0">
          <AdSlot position="every_fifth" className="px-0 pb-0" />
        </div>,
      );
    }
  });
  return <div className={cn("product-grid", className)}>{nodes}</div>;
}

export function ProductCard({
  product,
  producer,
}: {
  product: Product;
  producer?: Producer;
}) {
  const add = useShop((s) => s.add);
  const favorites = useShop((s) => s.favorites);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const loved = favorites.includes(product.id);
  return (
    <article className="group flex flex-col">
      <div className="relative">
        <Link
          to="/produse/$slug"
          params={{ slug: product.slug }}
          className="relative block overflow-hidden rounded-lg bg-sunken"
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 36rem) 50vw, 18rem"
            className="aspect-square w-full object-cover outline outline-1 -outline-offset-1 outline-fg/10 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </Link>
        <button
          type="button"
          aria-label={loved ? "Scoate de la favorite" : "Pune la favorite"}
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-1.5 right-1.5 flex size-9 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
        >
          <Heart className={cn("size-4", loved && "fill-primary")} />
        </button>
        <button
          type="button"
          aria-label={`Adaugă ${product.name} în coș`}
          onClick={() => add(product.id, product.step, product.step)}
          className="absolute right-1.5 bottom-1.5 flex size-10 items-center justify-center rounded-md bg-primary text-primary-fg shadow-soft transition-[background-color,transform] duration-150 ease-out hover:bg-primary/90 active:scale-[0.96]"
        >
          <Plus className="size-5" strokeWidth={1.75} />
        </button>
      </div>
      <div className="min-w-0 pt-2">
        {producer ? (
          <p className="truncate text-xs font-medium text-subtle">{producer.name}</p>
        ) : null}
        <Link
          to="/produse/$slug"
          params={{ slug: product.slug }}
          className="mt-0.5 block text-sm leading-snug font-semibold text-fg"
        >
          <span className="line-clamp-2">{product.name}</span>
        </Link>
        <p className="mt-1 text-sm">
          <span className="font-price text-base font-semibold text-fg">{formatLei(product.priceBani)}</span>
          <span className="text-subtle"> / {product.unit}</span>
        </p>
      </div>
    </article>
  );
}
