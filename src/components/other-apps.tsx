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
    <ul className="space-y-4">
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
        <img
          src={app.image}
          alt=""
          className="w-full bg-white object-contain object-center"
        />
      ) : (
        <span className="flex aspect-[5/2] w-full items-center justify-center bg-sunken text-subtle">
          <ExternalLink className="size-8" />
        </span>
      )}
      <span className="block px-3 py-2.5">
        <span className="block font-display text-lg font-bold leading-tight">{app.title}</span>
        {app.body ? (
          <span className="mt-0.5 block text-sm font-light leading-snug text-muted">{app.body}</span>
        ) : null}
        {app.url ? (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Deschide
            <ExternalLink className="size-3" />
          </span>
        ) : null}
      </span>
    </>
  );

  const cls = "block overflow-hidden rounded-xl border border-border bg-elevated shadow-soft";

  if (!app.url) {
    return <div className={cls}>{inner}</div>;
  }

  const external = /^https?:\/\//i.test(app.url);
  return (
    <a
      href={app.url}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cls}
    >
      {inner}
    </a>
  );
}
