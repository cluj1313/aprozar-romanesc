import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

const KM = [
  { id: null as number | null, label: "Oricare" },
  { id: 5, label: "5 km" },
  { id: 10, label: "10 km" },
  { id: 25, label: "25 km" },
];

export function FilterSheet({
  open,
  draftKm,
  draftCategory,
  onKm,
  onCategory,
  onApply,
  onClose,
}: {
  open: boolean;
  draftKm: number | null;
  draftCategory: string | null;
  onKm: (km: number | null) => void;
  onCategory: (id: string | null) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const { data } = useCatalog();
  const categories = data?.categories?.length ? data.categories : [...DEFAULT_CATEGORIES];
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="Închide filtrele"
        className="absolute inset-0 bg-fg/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-elevated px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-soft">
        <h2 className="font-display text-2xl font-semibold">Filtre</h2>

        <p className="mt-5 text-sm font-semibold">Distanță</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {KM.map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => onKm(k.id)}
              className={cn(
                "flex h-10 items-center rounded-full border px-4 text-sm font-semibold",
                draftKm === k.id
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-elevated",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold">Categorie</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCategory(null)}
            className={cn(
              "flex h-10 items-center rounded-full border px-4 text-sm font-semibold",
              !draftCategory
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-elevated",
            )}
          >
            Toate
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategory(c.id)}
              className={cn(
                "flex h-10 items-center rounded-full border px-4 text-sm font-semibold",
                draftCategory === c.id
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-elevated",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onApply}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-fg"
        >
          Aplică
        </button>
      </div>
    </div>
  );
}
