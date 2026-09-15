import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pill, PillRow, adminField } from "@/components/admin/pills";
import { MsgActions } from "@/components/msg-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addSponsorPayment,
  deleteSponsorMessage,
  saveSponsor,
  sendSponsorMessage,
  setSponsorMessageHidden,
  updateSponsorMessage,
} from "@/lib/platform-fns";
import { formatLei, parseLeiToBani } from "@/lib/money";
import { useShop } from "@/lib/store";
import type { Platform, ShopPerson, Sponsor } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";
import { cn, formatWhen } from "@/lib/utils";
import { isPersonBlocked } from "@/lib/ad-live";

export type ListTab = "sponsori" | "producatori" | "clienti";

export function TabListe({
  platform,
  onWarn,
  sub: subProp,
  onSub,
}: {
  platform: Platform;
  onWarn: (personId: string) => void;
  sub?: ListTab;
  onSub?: (tab: ListTab) => void;
}) {
  const [inner, setInner] = useState<ListTab>("sponsori");
  const sub = subProp ?? inner;
  const setSub = onSub ?? setInner;
  const { data } = useCatalog();

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Vezi cine e pe aplicație. Nu deschizi taraba și nu schimbi marfa — fiecare își ține contul.
      </p>
      <PillRow>
        <Pill active={sub === "sponsori"} onClick={() => setSub("sponsori")}>
          Sponsori
        </Pill>
        <Pill active={sub === "producatori"} onClick={() => setSub("producatori")}>
          Producători
        </Pill>
        <Pill active={sub === "clienti"} onClick={() => setSub("clienti")}>
          Clienți
        </Pill>
      </PillRow>

      {sub === "sponsori" ? <Sponsors platform={platform} /> : null}
      {sub === "producatori" ? (
        <PeopleList
          people={platform.people.filter((p) => p.role === "producer")}
          catalog={data}
          onWarn={onWarn}
        />
      ) : null}
      {sub === "clienti" ? (
        <ClientList people={platform.people.filter((p) => p.role === "buyer")} />
      ) : null}
    </div>
  );
}

function Sponsors({ platform }: { platform: Platform }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [open, setOpen] = useState(platform.sponsors[0]?.id ?? "");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const add = useMutation({
    mutationFn: () => saveSponsor({ data: { name, company, phone, email } }),
    onSuccess: () => {
      setName("");
      setCompany("");
      setPhone("");
      setEmail("");
      setFlash("Sponsor adăugat");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });

  return (
    <div className="mt-3 space-y-4">
      {platform.sponsors.map((s) => (
        <SponsorCard key={s.id} sponsor={s} open={open === s.id} onOpen={() => setOpen(s.id)} />
      ))}
      {platform.sponsors.length === 0 ? (
        <p className="text-sm text-muted">Niciun sponsor încă.</p>
      ) : null}

      <form
        className="rounded-2xl border border-border bg-elevated p-4"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <p className="font-semibold">Sponsor nou</p>
        <div className="mt-3 space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nume" required />
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Firmă" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon"
            inputMode="tel"
            required
          />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        </div>
        <Button type="submit" className="mt-3 w-full rounded-xl" disabled={add.isPending}>
          Adaugă sponsorul
        </Button>
      </form>
    </div>
  );
}

function SponsorCard({
  sponsor,
  open,
  onOpen,
}: {
  sponsor: Sponsor;
  open: boolean;
  onOpen: () => void;
}) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const total = sponsor.payments.reduce((s, p) => s + p.amountBani, 0);
  const [month, setMonth] = useState("");
  const [lei, setLei] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const pay = useMutation({
    mutationFn: () =>
      addSponsorPayment({
        data: {
          sponsorId: sponsor.id,
          monthLabel: month,
          amountBani: parseLeiToBani(lei),
        },
      }),
    onSuccess: () => {
      setMonth("");
      setLei("");
      setFlash("Luna a fost trecută");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const send = useMutation({
    mutationFn: () =>
      sendSponsorMessage({ data: { sponsorId: sponsor.id, body: msg, fromAdmin: true } }),
    onSuccess: () => {
      setMsg("");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const saveMsg = useMutation({
    mutationFn: (p: { id: string; body: string }) => updateSponsorMessage({ data: p }),
    onSuccess: () => {
      setEditing(null);
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const hideMsg = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => setSponsorMessageHidden({ data: p }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: platformQueryKey }),
  });
  const delMsg = useMutation({
    mutationFn: (id: string) => deleteSponsorMessage({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: platformQueryKey }),
  });

  return (
    <article className="rounded-2xl border border-border bg-elevated p-4">
      <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={onOpen}>
        <div>
          <p className="font-semibold">
            {sponsor.name}
            {sponsor.company ? ` — ${sponsor.company}` : ""}
          </p>
          <a href={`tel:${sponsor.phone}`} className="text-sm text-muted" onClick={(e) => e.stopPropagation()}>
            {sponsor.phone}
          </a>
        </div>
        <div className="text-right">
          <p className="font-semibold tabular-nums">{formatLei(total)}</p>
          <p className="text-[11px] text-subtle">total</p>
        </div>
      </button>
      {open ? (
        <div className="mt-4">
          <p className="text-sm font-semibold">Lună de lună</p>
          <ul className="mt-2 space-y-1 text-sm">
            {sponsor.payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>{p.monthLabel}</span>
                <span className="tabular-nums">{formatLei(p.amountBani)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              className={adminField}
              placeholder="Luna, ex. Septembrie 2026"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <input
              className={`${adminField} w-24 shrink-0`}
              placeholder="Lei"
              inputMode="decimal"
              value={lei}
              onChange={(e) => setLei(e.target.value)}
            />
            <Button
              type="button"
              className="h-12 shrink-0 rounded-xl"
              disabled={!month || !lei || pay.isPending}
              onClick={() => pay.mutate()}
            >
              Adaugă
            </Button>
          </div>

          <p className="mt-5 text-sm font-semibold">Mesaje între noi</p>
          <ul className="mt-2 space-y-2">
            {sponsor.messages.map((m) => (
              <li key={m.id} className={cn("flex items-start gap-2", m.hidden && "opacity-60")}>
                <div
                  className={
                    m.fromAdmin
                      ? "min-w-0 flex-1 rounded-2xl bg-primary px-3 py-2.5 text-sm text-primary-fg"
                      : "min-w-0 flex-1 rounded-2xl bg-sunken px-3 py-2.5 text-sm"
                  }
                >
                  <p className="text-xs font-semibold opacity-80">
                    {m.fromAdmin ? "Tu" : `${sponsor.name} — ${sponsor.company}`} ·{" "}
                    {formatWhen(m.createdAt)}
                    {m.hidden ? " · Ascuns" : ""}
                  </p>
                  {editing === m.id ? (
                    <div className="mt-1">
                      <textarea
                        className="min-h-14 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold"
                          disabled={saveMsg.isPending || !editText.trim()}
                          onClick={() => saveMsg.mutate({ id: m.id, body: editText.trim() })}
                        >
                          Salvează
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold opacity-80"
                          onClick={() => setEditing(null)}
                        >
                          Renunță
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-0.5">{m.body}</p>
                  )}
                </div>
                <MsgActions
                  hidden={m.hidden}
                  onEdit={() => {
                    setEditing(m.id);
                    setEditText(m.body);
                  }}
                  onHide={() => hideMsg.mutate({ id: m.id, hidden: !m.hidden })}
                  onDelete={() => delMsg.mutate(m.id)}
                />
              </li>
            ))}
          </ul>
          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (msg.trim()) send.mutate();
            }}
          >
            <input
              className={adminField}
              placeholder="Scrie sponsorului…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
          </form>
        </div>
      ) : null}
    </article>
  );
}

function PeopleList({
  people,
  catalog,
  onWarn,
}: {
  people: ShopPerson[];
  catalog: ReturnType<typeof useCatalog>["data"];
  onWarn: (id: string) => void;
}) {
  return (
    <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-elevated">
      {people.map((p) => {
        const farm = catalog?.producers.find((x) => x.id === p.producerId);
        const blocked = isPersonBlocked(p);
        return (
          <li key={p.id} className="px-4 py-4">
            <p className="font-semibold">{p.name}</p>
            <a href={`tel:${p.phone}`} className="text-sm text-muted">
              {p.phone}
            </a>
            <p className="mt-1 text-sm text-muted">
              Rating {farm?.rating.toFixed(1) ?? "—"} · {farm?.ratingCount ?? 0} recenzii · {p.warnings}{" "}
              {p.warnings === 1 ? "avertisment" : "avertismente"}
              {blocked ? " · blocat" : ""}
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-primary"
              onClick={() => onWarn(p.id)}
            >
              Adaugă avertisment
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ClientList({ people }: { people: ShopPerson[] }) {
  const ordered = [...people].sort((a, b) => b.visits - a.visits);
  return (
    <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-elevated">
      {ordered.map((p) => (
        <li key={p.id} className="px-4 py-4">
          <p className="font-semibold">{p.name}</p>
          <a href={`tel:${p.phone}`} className="text-sm text-muted">
            {p.phone}
          </a>
          <p className="mt-1 text-sm text-muted">
            {p.visits} {p.visits === 1 ? "intrare" : "intrări"} · {p.purchases}{" "}
            {p.purchases === 1 ? "cumpărătură finalizată" : "cumpărături finalizate"}
          </p>
        </li>
      ))}
    </ul>
  );
}
