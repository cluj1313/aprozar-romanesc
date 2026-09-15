import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { TabAcasa } from "@/components/admin/tab-acasa";
import { TabAjutor } from "@/components/admin/tab-ajutor";
import { TabAplicatia } from "@/components/admin/tab-aplicatia";
import { TabAnunturi } from "@/components/admin/tab-anunturi";
import { TabCategorii } from "@/components/admin/tab-categorii";
import { TabListe, type ListTab } from "@/components/admin/tab-liste";
import { TabModeratie } from "@/components/admin/tab-moderatie";
import { TabReclame } from "@/components/admin/tab-reclame";
import { ADMIN_TABS, type AdminTab, Pill, PillRow } from "@/components/admin/pills";
import { saveSiteCopy } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import { catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey, usePlatform } from "@/lib/use-platform";

export function AdminDashboard({
  tab,
  list,
  onTab,
  onList,
}: {
  tab: AdminTab;
  list: ListTab;
  onTab: (tab: AdminTab) => void;
  onList: (list: ListTab) => void;
}) {
  const { data, isPending } = usePlatform();
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);
  const [editingCopy, setEditingCopy] = useState(false);
  const [copyDraft, setCopyDraft] = useState<string[]>([]);
  const setFlash = useShop((s) => s.setFlash);
  const session = useShop((s) => s.session);
  const setSession = useShop((s) => s.setSession);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const saveCopy = useMutation({
    mutationFn: () =>
      saveSiteCopy({
        data: {
          items: (data?.siteCopy ?? []).map((p, i) => ({
            id: p.id,
            body: copyDraft[i] ?? p.body,
          })),
        },
      }),
    onSuccess: () => {
      setEditingCopy(false);
      setFlash("Coperta e pusă");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  if (isPending || !data) {
    return <p className="px-4 py-10 text-center text-muted">Se încarcă panoul…</p>;
  }

  const showCover = tab !== "acasa" && tab !== "liste" && tab !== "aplicatia";

  return (
    <div className="mx-auto max-w-xl px-4 pb-8">
      {showCover ? (
        <div className="space-y-2 pt-2">
          {data.siteCopy.map((p) => (
            <p key={p.id} className="rounded-2xl bg-panel px-4 py-3 text-sm leading-relaxed text-panel-fg">
              {p.body}
            </p>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-primary"
            onClick={() => {
              setCopyDraft(data.siteCopy.map((p) => p.body));
              onTab("acasa");
              setEditingCopy(true);
            }}
          >
            Modifică textul
          </button>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/"
          className="flex h-12 items-center justify-center rounded-full border border-border bg-elevated text-sm text-muted"
        >
          Cum mă văd ceilalți
        </Link>
        <Link
          to="/aplicatia"
          className="flex h-12 items-center justify-center rounded-full border border-border bg-elevated text-sm text-muted"
        >
          Pagina aplicației
        </Link>
      </div>

      <div className="mt-3">
        <PillRow>
          {ADMIN_TABS.map((t) => (
            <Pill key={t.id} active={tab === t.id} onClick={() => onTab(t.id)}>
              {t.label}
            </Pill>
          ))}
        </PillRow>
      </div>

      <div className="mt-4">
        {tab === "acasa" ? (
          <TabAcasa
            platform={data}
            onTab={onTab}
            editingCopy={editingCopy}
            setEditingCopy={(v) => {
              if (v) setCopyDraft(data.siteCopy.map((p) => p.body));
              setEditingCopy(v);
            }}
            copyDraft={copyDraft.length ? copyDraft : data.siteCopy.map((p) => p.body)}
            setCopyDraft={setCopyDraft}
            onSaveCopy={() => saveCopy.mutate()}
            savingCopy={saveCopy.isPending}
          />
        ) : null}
        {tab === "liste" ? (
          <TabListe
            platform={data}
            sub={list}
            onSub={onList}
            onWarn={(id) => {
              setFocusPersonId(id);
              onTab("moderatie");
            }}
          />
        ) : null}
        {tab === "anunturi" ? <TabAnunturi platform={data} /> : null}
        {tab === "aplicatia" ? <TabAplicatia platform={data} /> : null}
        {tab === "reclame" ? <TabReclame platform={data} /> : null}
        {tab === "moderatie" ? <TabModeratie platform={data} focusPersonId={focusPersonId} /> : null}
        {tab === "categorii" ? <TabCategorii platform={data} /> : null}
        {tab === "ajutor" ? <TabAjutor platform={data} /> : null}
      </div>

      <p className="mt-10 text-center text-xs text-subtle">
        {session.role === "admin" ? session.name : "Admin"}
      </p>
      <button
        type="button"
        className="mx-auto mt-2 block text-sm font-semibold text-primary"
        onClick={() => {
          setSession({ role: "guest" });
          void navigate({ to: "/" });
        }}
      >
        Ieși din Admin
      </button>
    </div>
  );
}
