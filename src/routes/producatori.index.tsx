import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProducerCard } from "@/components/producer-card";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/producatori/")({ component: ProducersPage });

function ProducersPage() {
  const { data } = useCatalog();
  const km = useShop((s) => s.filters.km);
  const list = (data?.producers ?? [])
    .filter((p) => p.active && !p.blocked)
    .filter((p) => km == null || p.km <= km)
    .slice()
    .sort((a, b) => a.km - b.km);
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-3 font-display text-2xl font-semibold">Producători apropiați</h1>
        {km != null ? (
          <p className="mt-1 text-sm text-muted">Până la {km.toLocaleString("ro-RO")} km.</p>
        ) : null}
        <div className="tile-grid mt-4">
          {list.map((p) => (
            <ProducerCard key={p.id} producer={p} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
