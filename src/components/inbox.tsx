import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pill, PillRow } from "@/components/admin/pills";
import { HelpBot } from "@/components/help-bot";
import { MsgActions } from "@/components/msg-actions";
import { Button } from "@/components/ui/button";
import { phonesMatch } from "@/lib/admin-identity";
import {
  deleteMessage,
  listMessages,
  setMessageHidden,
  updateMessage,
} from "@/lib/catalog-fns";
import {
  answerTicket,
  deleteSponsorMessage,
  deleteTicket,
  sendSponsorMessage,
  setSponsorMessageHidden,
  setTicketHidden,
  updateSponsorMessage,
  updateTicket,
} from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { HelpTicket, ShopMessage, SponsorMessage } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { platformQueryKey, usePlatform } from "@/lib/use-platform";
import { cn, formatWhen } from "@/lib/utils";

export const INBOX_KINDS = [
  { id: "ajutor", label: "Ajutor" },
  { id: "sponsori", label: "Sponsori" },
  { id: "producatori", label: "Producători" },
  { id: "clienti", label: "Clienți" },
] as const;

export type InboxKind = (typeof INBOX_KINDS)[number]["id"];

export const messagesQueryKey = ["messages"] as const;

export function Inbox({
  kind,
  onKind,
}: {
  kind: InboxKind;
  onKind: (kind: InboxKind) => void;
}) {
  const session = useShop((s) => s.session);
  const contact = useShop((s) => s.contact);
  const { data: catalog } = useCatalog();
  const { data: platform } = usePlatform();
  const messagesQ = useQuery({ queryKey: messagesQueryKey, queryFn: () => listMessages() });
  const producers = catalog?.producers ?? [];
  const isAdmin = session.role === "admin";
  const myPhone = session.role === "admin" ? session.phone : (contact?.phone ?? "");
  const myProducerId = session.role === "producer" ? session.producerId : null;
  const shopMessages = (messagesQ.data ?? []).filter((m) => isAdmin || !m.hidden);

  const tickets = (platform?.tickets ?? []).filter((t) => {
    if (!isAdmin && t.hidden) return false;
    if (isAdmin) return true;
    if (!myPhone) return false;
    return phonesMatch(t.authorPhone, myPhone);
  });

  const sponsorThreads = (platform?.sponsors ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    company: s.company,
    phone: s.phone,
    messages: s.messages.filter((m) => isAdmin || !m.hidden),
  }));

  const producerThreads = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; name: string; image?: string; messages: typeof shopMessages }
    >();
    for (const p of producers) {
      if (myProducerId && p.id !== myProducerId) continue;
      byId.set(p.id, { id: p.id, name: p.name, image: p.image, messages: [] });
    }
    for (const m of shopMessages) {
      if (myProducerId && m.producerId !== myProducerId) continue;
      const farm = byId.get(m.producerId) ?? {
        id: m.producerId,
        name: producers.find((p) => p.id === m.producerId)?.name ?? m.producerId,
        messages: [],
      };
      farm.messages = [...farm.messages, m];
      byId.set(m.producerId, farm);
    }
    return [...byId.values()].sort((a, b) => b.messages.length - a.messages.length);
  }, [producers, shopMessages, myProducerId]);

  const clientThreads = useMemo(() => {
    const byKey = new Map<
      string,
      { name: string; phone: string; messages: typeof shopMessages }
    >();
    const filtered = myProducerId
      ? shopMessages.filter((m) => m.producerId === myProducerId)
      : shopMessages;
    for (const m of filtered) {
      const key = m.customerPhone.replace(/\D/g, "") || m.customerName;
      const cur = byKey.get(key) ?? { name: m.customerName, phone: m.customerPhone, messages: [] };
      cur.messages.push(m);
      byKey.set(key, cur);
    }
    return [...byKey.values()].sort((a, b) => b.messages.length - a.messages.length);
  }, [shopMessages, myProducerId]);

  const counts = {
    ajutor: tickets.length,
    sponsori: sponsorThreads.reduce((n, s) => n + s.messages.length, 0),
    producatori: shopMessages.filter((m) => !myProducerId || m.producerId === myProducerId).length,
    clienti: clientThreads.length,
  };

  return (
    <div>
      <PillRow>
        {INBOX_KINDS.map((k) => (
          <Pill key={k.id} active={kind === k.id} onClick={() => onKind(k.id)}>
            {k.label}
            {counts[k.id] ? (
              <span className="ml-1.5 tabular-nums text-xs opacity-80">{counts[k.id]}</span>
            ) : null}
          </Pill>
        ))}
      </PillRow>

      <div className="mt-4">
        {kind === "ajutor" ? <AjutorBox tickets={tickets} isAdmin={isAdmin} /> : null}
        {kind === "sponsori" ? <SponsoriBox threads={sponsorThreads} isAdmin={isAdmin} /> : null}
        {kind === "producatori" ? (
          <ProducatoriBox threads={producerThreads} isAdmin={isAdmin} />
        ) : null}
        {kind === "clienti" ? <ClientiBox threads={clientThreads} canManage={isAdmin || !!myProducerId} /> : null}
      </div>
    </div>
  );
}

function AjutorBox({ tickets, isAdmin }: { tickets: HelpTicket[]; isAdmin: boolean }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const ans = useMutation({
    mutationFn: (p: { id: string; answer: string; train: boolean }) => answerTicket({ data: p }),
    onSuccess: () => {
      setFlash("Răspunsul a plecat");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const save = useMutation({
    mutationFn: (p: { id: string; question: string }) => updateTicket({ data: p }),
    onSuccess: () => {
      setEditing(null);
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const hide = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => setTicketHidden({ data: p }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: platformQueryKey }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteTicket({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: platformQueryKey }),
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Întrebări despre cum merge aplicația. Botul răspunde din antrenament; ce nu știe ajunge la
        administrator.
      </p>
      {tickets.length === 0 ? (
        <p className="text-sm text-muted">Niciun mesaj de ajutor încă.</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li
              key={t.id}
              className={cn(
                "rounded-xl border border-border bg-elevated p-3",
                t.hidden && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-subtle">
                    {t.authorName}
                    {t.authorPhone ? ` · ${t.authorPhone}` : ""} · {formatWhen(t.createdAt)}
                    {t.hidden ? " · Ascuns" : ""}
                  </p>
                  {editing === t.id ? (
                    <div className="mt-2">
                      <textarea
                        className="min-h-16 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={save.isPending || editText.trim().length < 2}
                          onClick={() => save.mutate({ id: t.id, question: editText.trim() })}
                        >
                          Salvează
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}>
                          Renunță
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-semibold">{t.question}</p>
                  )}
                  {t.answer ? (
                    <p className="mt-2 rounded-lg bg-panel px-3 py-2 text-sm text-panel-fg">{t.answer}</p>
                  ) : isAdmin ? (
                    <div className="mt-2">
                      <textarea
                        className="min-h-16 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                        placeholder="Răspunsul tău"
                        value={reply[t.id] ?? ""}
                        onChange={(e) => setReply((s) => ({ ...s, [t.id]: e.target.value }))}
                      />
                      <Button
                        type="button"
                        className="mt-2 w-full"
                        disabled={ans.isPending || !(reply[t.id] ?? "").trim()}
                        onClick={() =>
                          ans.mutate({ id: t.id, answer: (reply[t.id] ?? "").trim(), train: true })
                        }
                      >
                        Trimite răspunsul
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Așteaptă răspunsul administratorului.</p>
                  )}
                </div>
                {isAdmin ? (
                  <MsgActions
                    hidden={t.hidden}
                    onEdit={() => {
                      setEditing(t.id);
                      setEditText(t.question);
                    }}
                    onHide={() => hide.mutate({ id: t.id, hidden: !t.hidden })}
                    onDelete={() => del.mutate(t.id)}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <HelpBot />
    </div>
  );
}

function SponsoriBox({
  threads,
  isAdmin,
}: {
  threads: {
    id: string;
    name: string;
    company: string;
    phone: string;
    messages: SponsorMessage[];
  }[];
  isAdmin: boolean;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const send = useMutation({
    mutationFn: (p: { sponsorId: string; body: string }) =>
      sendSponsorMessage({ data: { ...p, fromAdmin: true } }),
    onSuccess: (_, p) => {
      setDraft((s) => ({ ...s, [p.sponsorId]: "" }));
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const save = useMutation({
    mutationFn: (p: { id: string; body: string }) => updateSponsorMessage({ data: p }),
    onSuccess: () => {
      setEditing(null);
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const hide = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => setSponsorMessageHidden({ data: p }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: platformQueryKey }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteSponsorMessage({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: platformQueryKey }),
  });

  if (!threads.length) {
    return <p className="text-sm text-muted">Niciun mesaj cu sponsorii.</p>;
  }

  return (
    <ul className="space-y-3">
      {threads.map((s) => (
        <li key={s.id} className="rounded-xl border border-border bg-elevated p-3">
          <p className="font-semibold">
            {s.name}
            {s.company ? ` — ${s.company}` : ""}
          </p>
          <p className="text-xs text-muted">{s.phone}</p>
          {s.messages.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nicio convorbire încă.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {s.messages.map((m) => (
                <li key={m.id} className={cn("flex items-start gap-2", m.hidden && "opacity-60")}>
                  <div
                    className={
                      m.fromAdmin
                        ? "min-w-0 flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-fg"
                        : "min-w-0 flex-1 rounded-lg bg-sunken px-3 py-2 text-sm"
                    }
                  >
                    <p className="text-xs opacity-80">
                      {m.fromAdmin ? "Tu" : s.name} · {formatWhen(m.createdAt)}
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
                            className="text-xs font-semibold text-primary-fg underline"
                            disabled={save.isPending || !editText.trim()}
                            onClick={() => save.mutate({ id: m.id, body: editText.trim() })}
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
                  {isAdmin ? (
                    <MsgActions
                      hidden={m.hidden}
                      onEdit={() => {
                        setEditing(m.id);
                        setEditText(m.body);
                      }}
                      onHide={() => hide.mutate({ id: m.id, hidden: !m.hidden })}
                      onDelete={() => del.mutate(m.id)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {isAdmin ? (
            <div className="mt-2 flex gap-2">
              <input
                className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-sm"
                placeholder="Scrie sponsorului…"
                value={draft[s.id] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [s.id]: e.target.value }))}
              />
              <Button
                type="button"
                disabled={send.isPending || !(draft[s.id] ?? "").trim()}
                onClick={() => send.mutate({ sponsorId: s.id, body: (draft[s.id] ?? "").trim() })}
              >
                Trimite
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ProducatoriBox({
  threads,
  isAdmin,
}: {
  threads: {
    id: string;
    name: string;
    image?: string;
    messages: ShopMessage[];
  }[];
  isAdmin: boolean;
}) {
  const withMail = threads.filter((t) => t.messages.length > 0);
  const list = isAdmin || withMail.length ? (isAdmin ? threads : withMail) : threads;

  if (!list.length) {
    return <p className="text-sm text-muted">Niciun mesaj cu producătorii.</p>;
  }

  return (
    <ul className="space-y-2">
      {list.map((p) => (
        <li key={p.id}>
          <Link
            to="/producatori/$id"
            params={{ id: p.id }}
            className="flex items-center gap-3 rounded-xl border border-border bg-elevated p-3"
          >
            {p.image ? (
              <img src={p.image} alt="" className="size-11 rounded-md object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted">
                {p.messages.length
                  ? `${p.messages.length} mesaje · ultimul: ${p.messages[0]?.body ?? ""}`
                  : "Scrie un mesaj"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ClientiBox({
  threads,
  canManage,
}: {
  threads: {
    name: string;
    phone: string;
    messages: ShopMessage[];
  }[];
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const save = useMutation({
    mutationFn: (p: { id: string; body: string }) => updateMessage({ data: p }),
    onSuccess: () => {
      setEditing(null);
      void qc.invalidateQueries({ queryKey: messagesQueryKey });
    },
  });
  const hide = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => setMessageHidden({ data: p }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: messagesQueryKey }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteMessage({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: messagesQueryKey }),
  });

  if (!threads.length) {
    return <p className="text-sm text-muted">Niciun mesaj cu clienții.</p>;
  }
  return (
    <ul className="space-y-2">
      {threads.map((c) => (
        <li key={c.phone} className="rounded-xl border border-border bg-elevated p-3">
          <p className="font-semibold">{c.name}</p>
          <a href={`tel:${c.phone}`} className="text-xs text-primary">
            {c.phone}
          </a>
          <ul className="mt-2 space-y-1.5">
            {c.messages.map((m) => (
              <li
                key={m.id}
                className={cn("rounded-lg bg-sunken px-3 py-2 text-sm", m.hidden && "opacity-60")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-subtle">
                      {formatWhen(m.createdAt)}
                      {m.hidden ? " · Ascuns" : ""}
                    </p>
                    {editing === m.id ? (
                      <div className="mt-1">
                        <textarea
                          className="min-h-14 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="mt-1 flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-semibold text-primary"
                            disabled={save.isPending || editText.trim().length < 2}
                            onClick={() => save.mutate({ id: m.id, body: editText.trim() })}
                          >
                            Salvează
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-muted"
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
                  {canManage ? (
                    <MsgActions
                      hidden={m.hidden}
                      onEdit={() => {
                        setEditing(m.id);
                        setEditText(m.body);
                      }}
                      onHide={() => hide.mutate({ id: m.id, hidden: !m.hidden })}
                      onDelete={() => del.mutate(m.id)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
