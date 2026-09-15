import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ImageField } from "@/components/image-field";
import { MsgActions } from "@/components/msg-actions";
import { AppCard } from "@/components/other-apps";
import { adminArea, adminField } from "@/components/admin/pills";
import { Button } from "@/components/ui/button";
import { deleteAppLink, hideAppLink, saveAppLink } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { AppLink } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppsEditor({
  apps,
  onDone,
  embedded,
}: {
  apps: AppLink[];
  onDone: () => void;
  embedded?: boolean;
}) {
  const setFlash = useShop((s) => s.setFlash);
  const [open, setOpen] = useState(!embedded);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [url, setUrl] = useState("");

  const reset = () => {
    setEditId(null);
    setTitle("");
    setBody("");
    setImage("");
    setUrl("");
    if (embedded) setOpen(false);
  };

  const save = useMutation({
    mutationFn: () =>
      saveAppLink({
        data: { id: editId ?? undefined, title, body, image, url },
      }),
    onSuccess: (res) => {
      if (res && "ok" in res && !res.ok) {
        setFlash("error" in res ? res.error : "Nu am putut salva aplicația");
        return;
      }
      reset();
      setFlash("Aplicația e pe listă");
      onDone();
    },
    onError: () => setFlash("Nu am putut salva. Încearcă o poză mai mică sau un link de imagine."),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAppLink({ data: { id } }),
    onSuccess: () => {
      setFlash("Aplicația a fost ștearsă");
      onDone();
    },
  });
  const hide = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => hideAppLink({ data: p }),
    onSuccess: (_res, p) => {
      setFlash(p.hidden ? "Aplicația e ascunsă din meniu" : "Aplicația e din nou vizibilă");
      onDone();
    },
  });

  function startEdit(a: AppLink) {
    setEditId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setImage(a.image);
    setUrl(a.url);
    setOpen(true);
  }

  const formOpen = open || Boolean(editId);

  return (
    <section className={embedded ? "mt-4" : "mt-8"}>
      {embedded ? null : <h2 className="font-semibold">Alte aplicații de-ale mele</h2>}
      <ul className="space-y-3">
        {apps.map((a) => (
          <li
            key={a.id}
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-elevated",
              a.hidden && "opacity-55",
            )}
          >
            <AppCard app={{ ...a, url: "" }} />
            <div className="flex items-start justify-between gap-3 border-t border-border px-3 py-2">
              <p className="min-w-0 truncate text-xs text-primary">
                {a.hidden ? "Ascunsă · " : ""}
                {a.url || "Fără link"}
              </p>
              <MsgActions
                hidden={a.hidden}
                onEdit={() => startEdit(a)}
                onHide={() => hide.mutate({ id: a.id, hidden: !a.hidden })}
                onDelete={() => del.mutate(a.id)}
              />
            </div>
          </li>
        ))}
      </ul>

      {formOpen ? (
        <>
          <p className="mt-4 text-sm text-muted">
            Nume, o vorbă scurtă, link și un banner. Poza o iei din galerie, faci una nouă, sau pui
            un link.
          </p>
          <input
            className={`${adminField} mt-3`}
            placeholder="Numele aplicației"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className={`${adminArea} mt-2 min-h-20`}
            placeholder="O vorbă scurtă sub banner"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="mt-2">
            <ImageField
              label="Banner"
              value={image}
              onChange={setImage}
              onError={setFlash}
              wide
            />
          </div>
          <input
            className={`${adminField} mt-2`}
            placeholder="Linkul — https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            autoComplete="url"
          />
          <Button
            type="button"
            className="mt-3 w-full rounded-xl"
            disabled={save.isPending || title.trim().length < 2 || !url.trim()}
            onClick={() => save.mutate()}
          >
            {editId ? "Salvează aplicația" : "Adaugă aplicația"}
          </Button>
          <button type="button" className="mt-2 w-full text-sm font-semibold text-muted" onClick={reset}>
            Renunță
          </button>
        </>
      ) : (
        <button
          type="button"
          className="mt-3 h-11 w-full rounded-full border border-border bg-elevated text-sm font-semibold"
          onClick={() => setOpen(true)}
        >
          Adaugă o aplicație
        </button>
      )}
    </section>
  );
}
