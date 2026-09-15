import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Inbox, INBOX_KINDS, type InboxKind } from "@/components/inbox";
import { MyNotices } from "@/components/my-notices";

function parseKind(v: unknown): InboxKind {
  return INBOX_KINDS.some((k) => k.id === v) ? (v as InboxKind) : "ajutor";
}

export const Route = createFileRoute("/mesaje")({
  validateSearch: (raw: Record<string, unknown>): { cutie?: InboxKind } => {
    const cutie = parseKind(raw.cutie);
    return cutie === "ajutor" ? {} : { cutie };
  },
  component: MesajePage,
});

function MesajePage() {
  const cutie = Route.useSearch().cutie ?? "ajutor";
  const navigate = Route.useNavigate();
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-3 font-display text-2xl font-semibold">Mesaje</h1>
        <p className="mt-2 text-sm text-muted">
          Ajutor, client, producător — sponsorii sunt la urmă.
        </p>
        <div className="mt-4">
          <MyNotices />
        </div>
        <div className="mt-4">
          <Inbox
            kind={cutie}
            onKind={(next) => void navigate({ search: next === "ajutor" ? {} : { cutie: next } })}
          />
        </div>
      </div>
    </AppShell>
  );
}
