import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminArea, adminField } from "@/components/admin/pills";
import { Button } from "@/components/ui/button";
import { answerTicket, deleteFaq, saveFaq } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { platformQueryKey } from "@/lib/use-platform";
import { formatWhen } from "@/lib/utils";

export function TabAjutor({ platform }: { platform: Platform }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [train, setTrain] = useState<Record<string, boolean>>({});

  const add = useMutation({
    mutationFn: () => saveFaq({ data: { question: q, answer: a } }),
    onSuccess: () => {
      setQ("");
      setA("");
      setFlash("Botul a învățat perechea");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFaq({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: platformQueryKey }),
  });
  const ans = useMutation({
    mutationFn: (p: { id: string; answer: string; train: boolean }) => answerTicket({ data: p }),
    onSuccess: () => {
      setFlash("Răspunsul a plecat");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });

  const open = platform.tickets.filter((t) => !t.answer);
  const closed = platform.tickets.filter((t) => t.answer);

  return (
    <div>
      <p className="text-sm text-muted">
        Oamenii întreabă din Mesaje. Botul răspunde din perechile de mai jos. Dacă nu știe, întrebarea
        ajunge aici — tu răspunzi și, dacă vrei, îl antrenezi.
      </p>

      <h2 className="mt-5 font-semibold">Întrebări către tine</h2>
      {open.length === 0 ? <p className="mt-2 text-sm text-muted">Nicio întrebare în așteptare.</p> : null}
      <ul className="mt-2 space-y-3">
        {open.map((t) => (
          <li key={t.id} className="rounded-2xl border border-border bg-elevated p-4">
            <p className="text-xs text-subtle">
              {t.authorName}
              {t.authorPhone ? ` · ${t.authorPhone}` : ""} · {formatWhen(t.createdAt)}
            </p>
            <p className="mt-1 font-semibold">{t.question}</p>
            <textarea
              className={`${adminArea} mt-2 min-h-20`}
              placeholder="Răspunsul tău"
              value={reply[t.id] ?? ""}
              onChange={(e) => setReply((s) => ({ ...s, [t.id]: e.target.value }))}
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={train[t.id] ?? true}
                onChange={(e) => setTrain((s) => ({ ...s, [t.id]: e.target.checked }))}
              />
              Antrenează botul cu răspunsul ăsta
            </label>
            <Button
              type="button"
              className="mt-2 w-full rounded-xl"
              disabled={ans.isPending || !(reply[t.id] ?? "").trim()}
              onClick={() =>
                ans.mutate({
                  id: t.id,
                  answer: reply[t.id] ?? "",
                  train: train[t.id] ?? true,
                })
              }
            >
              Trimite răspunsul
            </Button>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-semibold">Antrenamentul botului</h2>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim() && a.trim()) add.mutate();
        }}
      >
        <input className={adminField} placeholder="Întrebare" value={q} onChange={(e) => setQ(e.target.value)} />
        <textarea className={adminArea} placeholder="Răspuns" value={a} onChange={(e) => setA(e.target.value)} />
        <Button type="submit" className="w-full rounded-xl" disabled={add.isPending}>
          Învață botul
        </Button>
      </form>
      <ul className="mt-3 space-y-2">
        {platform.faq.map((f) => (
          <li key={f.id} className="rounded-2xl bg-panel px-4 py-3 text-sm text-panel-fg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{f.question}</p>
                <p className="mt-1 text-muted">{f.answer}</p>
                <p className="mt-1 text-[11px] text-subtle">Folosit de {f.uses} ori</p>
              </div>
              <button type="button" className="text-sm font-semibold text-danger" onClick={() => del.mutate(f.id)}>
                Șterge
              </button>
            </div>
          </li>
        ))}
      </ul>

      {closed.length ? (
        <>
          <h2 className="mt-8 font-semibold">Răspunsuri date</h2>
          <ul className="mt-2 space-y-2">
            {closed.map((t) => (
              <li key={t.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                <p className="font-semibold">{t.question}</p>
                <p className="mt-1 text-muted">{t.answer}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
