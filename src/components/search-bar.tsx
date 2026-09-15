import { Search, SlidersHorizontal } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { CategoryStrip } from "@/components/category-strip";
import { FilterSheet } from "@/components/filter-sheet";
import { useShop } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SearchBar({ mode = "home" }: { mode?: "home" | "shop" }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { q?: string; c?: string };
  const [q, setQ] = useState(search.q ?? "");
  const [sheet, setSheet] = useState(false);
  const filters = useShop((s) => s.filters);
  const setFilters = useShop((s) => s.setFilters);
  const [draftKm, setDraftKm] = useState<number | null>(filters.km);
  const [draftCategory, setDraftCategory] = useState<string | null>(filters.category);
  const shop = mode === "shop";

  function openSheet() {
    setDraftKm(filters.km);
    setDraftCategory(filters.category ?? search.c ?? null);
    setSheet(true);
  }

  function apply() {
    setFilters({ km: draftKm, category: draftCategory });
    setSheet(false);
    if (draftCategory) {
      void navigate({
        to: "/produse",
        search: { q: q || undefined, c: draftCategory },
      });
    }
  }

  function submit() {
    void navigate({
      to: "/produse",
      search: { q: q || undefined, c: filters.category || search.c },
    });
  }

  return (
    <div>
      <form
        className="relative pt-0.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {shop ? (
          <input
            className="h-11 w-full rounded-2xl border border-border bg-elevated px-4 text-sm text-fg placeholder:text-muted focus-visible:outline-none"
            placeholder="Caută roșii, Nelu, Bihor…"
            aria-label="Caută"
            value={q}
            suppressHydrationWarning
            onChange={(e) => setQ(e.target.value)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-border bg-elevated pr-1 pl-3.5">
              <input
                className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm text-fg placeholder:text-muted focus-visible:outline-none"
                placeholder="Produse, producători sau ferme…"
                aria-label="Caută"
                value={q}
                suppressHydrationWarning
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                type="button"
                aria-label="Filtre"
                aria-expanded={sheet}
                onClick={openSheet}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-fg",
                  sheet || filters.km != null || filters.category
                    ? "bg-primary text-primary-fg"
                    : "text-fg",
                )}
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </div>
            <button
              type="submit"
              aria-label="Caută"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-fg"
            >
              <Search className="size-5" />
            </button>
          </div>
        )}
      </form>
      <CategoryStrip q={q} mode={mode} />
      {shop ? null : (
        <FilterSheet
          open={sheet}
          draftKm={draftKm}
          draftCategory={draftCategory}
          onKm={setDraftKm}
          onCategory={setDraftCategory}
          onApply={apply}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
}
