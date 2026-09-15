import { ExternalLink } from "lucide-react";
import type { AppLink } from "@/lib/types";

export function OtherApps({
  apps,
  empty,
}: {
  apps: AppLink[];
  empty?: React.ReactNode;
}) {
  if (!apps.length) return empty ? <>{empty}</> : null;
  return (
    <ul className="space-y-2">
      {apps.map((a) => (
        <li key={a.id}>
          <AppCard app={a} />
        </li>
      ))}
    </ul>
  );
}

export function AppCard({ app }: { app: AppLink }) {
  const inner = (
    <>
      {app.image ? (
        <img src={app.image} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-sunken text-subtle">
          <ExternalLink className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold leading-tight">{app.title}</span>
        {app.body ? (
          <span className="mt-0.5 block text-sm font-light leading-snug text-muted">{app.body}</span>
        ) : null}
        {app.url ? (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Deschide
            <ExternalLink className="size-3" />
          </span>
        ) : null}
      </span>
    </>
  );

  if (!app.url) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-elevated p-3">{inner}</div>
    );
  }

  const external = /^https?:\/\//i.test(app.url);
  return (
    <a
      href={app.url}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-center gap-3 rounded-xl border border-border bg-elevated p-3"
    >
      {inner}
    </a>
  );
}
