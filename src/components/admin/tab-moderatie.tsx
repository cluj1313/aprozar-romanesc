import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminArea, adminField } from "@/components/admin/pills";
import { Button } from "@/components/ui/button";
import { isPersonBlocked } from "@/lib/ad-live";
import { moderatePerson } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { ModerationKind, Platform } from "@/lib/types";
import { catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";
import { formatWhen } from "@/lib/utils";

export function TabModeratie({
  platform,
  focusPersonId,
}: {
  platform: Platform;
  focusPersonId: string | null;
}) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [personId, setPersonId] = useState(focusPersonId ?? platform.people[0]?.id ?? "");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (focusPersonId) setPersonId(focusPersonId);
  }, [focusPersonId]);

  const person = platform.people.find((p) => p.id === personId);
  const events = platform.events.filter((e) => e.personId === personId);

  const act = useMutation({
    mutationFn: (kind: ModerationKind) => moderatePerson({ data: { personId, kind, body } }),
    onSuccess: (_, kind) => {
      setBody("");
      setFlash(
        kind === "warning"
          ? "Avertisment pus"
          : kind === "personal"
            ? "Anunțul personal a plecat"
            : kind === "block7"
              ? "Blocat 7 zile"
              : "Blocat definitiv",
      );
      void qc.invalidateQueries({ queryKey: platformQueryKey });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  return (
    <div>
      <p className="text-sm text-muted">
        Avertismente, anunț privat, blocare. Nu deschizi taraba omului și nu-i schimbi produsele —
        asta o face el, din contul lui.
      </p>
      <p className="mt-3 text-sm font-semibold">Utilizator</p>
      <select className={`${adminField} mt-2`} value={personId} onChange={(e) => setPersonId(e.target.value)}>
        {platform.people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.role === "buyer" ? "cumpărător" : p.role === "producer" ? "producător" : "sponsor"}
          </option>
        ))}
      </select>
      {person ? (
        <p className="mt-2 text-xs text-muted">
          {person.warnings} avertismente
          {isPersonBlocked(person) ? " · blocat pe platformă" : ""}
        </p>
      ) : null}
      <textarea
        className={`${adminArea} mt-3`}
        placeholder="Anunț personal sau avertisment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          className="rounded-xl"
          disabled={act.isPending || body.trim().length < 2}
          onClick={() => act.mutate("personal")}
        >
          Anunț personal
        </Button>
        <Button
          type="button"
          className="rounded-xl"
          disabled={act.isPending || body.trim().length < 2}
          onClick={() => act.mutate("warning")}
        >
          Avertisment
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="rounded-xl"
          disabled={act.isPending}
          onClick={() => act.mutate("block7")}
        >
          Blochează 7 zile
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="rounded-xl"
          disabled={act.isPending}
          onClick={() => act.mutate("blockforever")}
        >
          Blochează definitiv
        </Button>
      </div>
      {events.length ? (
        <ul className="mt-5 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl bg-sunken px-3 py-2 text-sm">
              <p className="text-[11px] font-semibold text-subtle">
                {kindLabel(e.kind)} · {formatWhen(e.createdAt)}
              </p>
              {e.body ? <p className="mt-0.5">{e.body}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function kindLabel(k: ModerationKind) {
  if (k === "warning") return "Avertisment";
  if (k === "personal") return "Anunț personal";
  if (k === "block7") return "Blocare 7 zile";
  return "Blocare definitivă";
}
