import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/povesti/")({ component: StoriesPage });

function StoriesPage() {
  const { data } = useCatalog();
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <p className="pt-3 text-xs font-semibold tracking-wide text-subtle uppercase">De la tarabă</p>
        <h1 className="font-display text-2xl font-semibold">Poveștile vânzătorilor</h1>
        <ul className="mt-5 space-y-4">
          {(data?.stories ?? []).map((s) => {
            const producer = data?.producers.find((p) => p.id === s.producerId);
            return (
              <li key={s.id} className="overflow-hidden rounded-xl border border-border bg-elevated">
                <img src={producer?.image} alt="" className="aspect-[3/2] w-full object-cover" />
                <div className="p-4">
                  <p className="text-xs text-subtle">{producer?.name}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{s.title}</h2>
                  <p className="mt-1 text-sm text-muted">{s.excerpt}</p>
                  <Link
                    to="/povesti/$slug"
                    params={{ slug: s.slug }}
                    className="mt-3 inline-block text-sm font-semibold text-primary"
                  >
                    Citește povestea
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
