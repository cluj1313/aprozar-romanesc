import { FolderTree, Megaphone, MessageCircleQuestion, RectangleHorizontal, Shield, Sprout, Star, Users, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { AdminTab } from "@/components/admin/pills";
import type { Platform } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";

export function TabAcasa({
  platform,
  onTab,
  editingCopy,
  setEditingCopy,
  copyDraft,
  setCopyDraft,
  onSaveCopy,
  savingCopy,
}: {
  platform: Platform;
  onTab: (tab: AdminTab) => void;
  editingCopy: boolean;
  setEditingCopy: (v: boolean) => void;
  copyDraft: string[];
  setCopyDraft: (v: string[]) => void;
  onSaveCopy: () => void;
  savingCopy: boolean;
}) {
  const { data } = useCatalog();
  const products = data?.products ?? [];

  return (
    <div>
      <p className="text-sm text-muted">
        Tu ții aplicația: categorii, anunțuri, reclame, sponsori. Conturile rămân ale oamenilor — nu
        intri acolo, nu le schimbi marfa, nu le deschizi taraba. Dacă au o întrebare, o trimit din
        Mesaje. Botul răspunde din ce l-ai antrenat; ce nu știe ajunge la tine.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Kpi icon={<Warehouse className="size-5" />} value={String(platform.stats.products)} label="Total produse" />
        <Kpi icon={<Sprout className="size-5" />} value={String(platform.stats.available)} label="Disponibile" />
        <Kpi
          icon={<Star className="size-5" />}
          value={String(platform.stats.reviews)}
          label={`${platform.stats.reviews} recenzii`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Action
          icon={<FolderTree className="size-5" />}
          title="Categorii"
          sub="Adaugă, schimbă sau șterge"
          onClick={() => onTab("categorii")}
        />
        <Action
          icon={<Megaphone className="size-5" />}
          title="Anunțuri"
          sub="La toți sau doar la un om"
          onClick={() => onTab("anunturi")}
        />
        <Action
          icon={<RectangleHorizontal className="size-5" />}
          title="Reclame"
          sub="Poziție, durată, orizontal"
          onClick={() => onTab("reclame")}
        />
        <Action
          icon={<Users className="size-5" />}
          title="Sponsori"
          sub="Investitori, plăți, vorbe"
          onClick={() => onTab("liste")}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onTab("liste")}
          className="rounded-2xl border border-border bg-elevated px-4 py-4 text-left"
        >
          <p className="font-semibold">Producători și clienți</p>
          <p className="mt-1 text-xs text-muted">Doar privire. Fără umblat în cont.</p>
        </button>
        <button
          type="button"
          onClick={() => onTab("anunturi")}
          className="rounded-2xl border border-border bg-elevated px-4 py-4 text-left"
        >
          <p className="font-semibold">Anunțuri site</p>
          <p className="mt-1 text-xs text-muted">Ce se vede pe Acasă</p>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onTab("moderatie")}
        className="mt-2 flex w-full items-center gap-2 rounded-2xl border border-border bg-elevated px-4 py-3.5 text-left font-semibold"
      >
        <Shield className="size-4 text-primary" />
        Moderație
      </button>
      <button
        type="button"
        onClick={() => onTab("ajutor")}
        className="mt-2 flex w-full items-center gap-2 rounded-2xl border border-border bg-elevated px-4 py-3.5 text-left font-semibold"
      >
        <MessageCircleQuestion className="size-4 text-primary" />
        Întrebări și bot
      </button>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Textul de pe copertă</h2>
          <button
            type="button"
            className="text-sm font-semibold text-primary"
            onClick={() => setEditingCopy(!editingCopy)}
          >
            {editingCopy ? "Închide" : "Modifică textul"}
          </button>
        </div>
        {editingCopy ? (
          <div className="mt-3 space-y-2">
            {copyDraft.map((p, i) => (
              <Textarea
                key={platform.siteCopy[i]?.id ?? i}
                value={p}
                onChange={(e) => {
                  const next = [...copyDraft];
                  next[i] = e.target.value;
                  setCopyDraft(next);
                }}
              />
            ))}
            <Button type="button" className="w-full rounded-xl" onClick={onSaveCopy} disabled={savingCopy}>
              {savingCopy ? "Se pune coperta…" : "Pune coperta"}
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {platform.siteCopy.map((p) => (
              <p key={p.id} className="rounded-2xl bg-panel px-4 py-3 text-sm leading-relaxed text-panel-fg">
                {p.body}
              </p>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-xs text-subtle">
        {products.length} produse în magazin. Prețurile le pun producătorii, din taraba lor.
      </p>
    </div>
  );
}

function Kpi({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-panel px-2 py-4 text-center text-panel-fg">
      <div className="mx-auto flex size-8 items-center justify-center text-primary">{icon}</div>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function Action({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-panel px-4 py-4 text-left text-panel-fg"
    >
      <div className="text-primary">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </button>
  );
}
