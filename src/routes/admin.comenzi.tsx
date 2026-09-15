import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MsgActions } from "@/components/msg-actions";
import { ProducerOnly } from "@/components/producer-only";
import { Button } from "@/components/ui/button";
import {
  deleteMessage,
  listMessages,
  listOrders,
  setMessageHidden,
  updateMessage,
  updateOrderStatus,
} from "@/lib/catalog-fns";
import { formatLei, formatQty } from "@/lib/money";
import { useShop } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/comenzi")({ component: AdminOrdersPage });

function AdminOrdersPage() {
  return (
    <ProducerOnly>
      <AdminOrders />
    </ProducerOnly>
  );
}

const STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "noua", label: "Nouă" },
  { id: "confirmata", label: "Confirmată" },
  { id: "pregatita", label: "Pregătită" },
  { id: "gata", label: "Gata" },
  { id: "anulata", label: "Anulată" },
];

function AdminOrders() {
  const session = useShop((s) => s.session);
  const producerId = session.role === "producer" ? session.producerId : null;
  const { data: catalog } = useCatalog();
  const qc = useQueryClient();
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: () => listOrders() });
  const messagesQ = useQuery({ queryKey: ["messages"], queryFn: () => listMessages() });
  const mutation = useMutation({
    mutationFn: (p: { id: string; status: OrderStatus }) => updateOrderStatus({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
  const orders = (ordersQ.data ?? []).filter(
    (o) => !producerId || o.items.some((i) => i.producerId === producerId),
  );
  const messages = (messagesQ.data ?? []).filter((m) => !producerId || m.producerId === producerId);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const saveMsg = useMutation({
    mutationFn: (p: { id: string; body: string }) => updateMessage({ data: p }),
    onSuccess: () => {
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });
  const hideMsg = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => setMessageHidden({ data: p }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["messages"] }),
  });
  const delMsg = useMutation({
    mutationFn: (id: string) => deleteMessage({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["messages"] }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <h1 className="font-display text-2xl font-semibold">Comenzi</h1>
      <p className="text-sm text-muted">Sună clientul, apoi treci comanda mai departe.</p>
      <div className="mt-4 space-y-4">
        {orders.map((o) => (
          <article key={o.id} className="rounded-xl border border-border bg-elevated p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{o.customerName}</p>
                <a href={`tel:${o.customerPhone}`} className="text-sm text-primary">
                  {o.customerPhone}
                </a>
                <p className="text-xs text-subtle">{o.id}</p>
              </div>
              <p className="font-price text-xl font-semibold">{formatLei(o.totalBani)}</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {o.items
                .filter((i) => !producerId || i.producerId === producerId)
                .map((i) => (
                  <li key={i.productId} className="flex justify-between gap-3">
                    <span>
                      {i.productName} · {formatQty(i.qty, i.unit)} · {i.fulfillment}
                    </span>
                    <span className="tabular-nums">{formatLei(i.lineBani)}</span>
                  </li>
                ))}
            </ul>
            {o.address ? <p className="mt-2 text-sm text-muted">Adresă: {o.address}</p> : null}
            {o.customerNote ? (
              <p className="mt-1 text-sm font-semibold text-primary">{o.customerNote}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => mutation.mutate({ id: o.id, status: s.id })}
                  className={`h-9 rounded-full border px-3 text-xs font-semibold ${
                    o.status === s.id
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-bg"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <Button asChild size="sm" variant="secondary">
                <a href={`tel:${o.customerPhone}`}>Sună</a>
              </Button>
            </div>
          </article>
        ))}
        {orders.length === 0 ? (
          <p className="rounded-xl border border-border bg-elevated p-6 text-sm text-muted">
            Nicio comandă. Când cineva pune marfă în coș și trimite, apare aici.
          </p>
        ) : null}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Mesaje</h2>
      <ul className="mt-3 space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              "rounded-xl border border-border bg-elevated p-4",
              m.hidden && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{m.customerName}</p>
                <a href={`tel:${m.customerPhone}`} className="text-sm text-primary">
                  {m.customerPhone}
                </a>
                <p className="mt-1 text-xs text-subtle">
                  către {catalog?.producers.find((p) => p.id === m.producerId)?.name}
                  {m.hidden ? " · Ascuns" : ""}
                </p>
                {editing === m.id ? (
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
                        disabled={saveMsg.isPending || editText.trim().length < 2}
                        onClick={() => saveMsg.mutate({ id: m.id, body: editText.trim() })}
                      >
                        Salvează
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}>
                        Renunță
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm">{m.body}</p>
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
            </div>
          </li>
        ))}
        {messages.length === 0 ? <p className="text-sm text-muted">Niciun mesaj.</p> : null}
      </ul>
    </div>
  );
}
