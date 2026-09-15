import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin/dashboard";
import { ADMIN_TABS, type AdminTab } from "@/components/admin/pills";
import { ProducerHome } from "@/components/producer-home";
import { useShop } from "@/lib/store";

const TAB_IDS = new Set(ADMIN_TABS.map((t) => t.id));

export type AdminListTab = "sponsori" | "producatori" | "clienti";

function parseTab(v: unknown): AdminTab {
  return typeof v === "string" && TAB_IDS.has(v as AdminTab) ? (v as AdminTab) : "acasa";
}

function parseList(v: unknown): AdminListTab {
  return v === "producatori" || v === "clienti" ? v : "sponsori";
}

export const Route = createFileRoute("/admin/")({
  validateSearch: (raw: Record<string, unknown>): { tab?: AdminTab; list?: AdminListTab } => {
    const tab = parseTab(raw.tab);
    const list = parseList(raw.list);
    return {
      ...(tab !== "acasa" ? { tab } : {}),
      ...(list !== "sponsori" ? { list } : {}),
    };
  },
  component: AdminIndex,
});

function AdminIndex() {
  const session = useShop((s) => s.session);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = search.tab ?? "acasa";
  const list = search.list ?? "sponsori";
  if (session.role === "admin") {
    return (
      <AdminDashboard
        tab={tab}
        list={list}
        onTab={(next) => {
          if (next === tab) return;
          void navigate({
            search: {
              ...(next !== "acasa" ? { tab: next } : {}),
              ...(next === "liste" && list !== "sponsori" ? { list } : {}),
            },
          });
        }}
        onList={(next) => {
          if (tab === "liste" && next === list) return;
          void navigate({
            search: {
              tab: "liste",
              ...(next !== "sponsori" ? { list: next } : {}),
            },
          });
        }}
      />
    );
  }
  return <ProducerHome />;
}
