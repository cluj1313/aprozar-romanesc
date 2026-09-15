import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ImageField } from "@/components/image-field";
import { MsgActions } from "@/components/msg-actions";
import { AppCard } from "@/components/other-apps";
import { adminArea, adminField } from "@/components/admin/pills";
import { Button } from "@/components/ui/button";
import { deleteAppLink, saveAppLink } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { AppLink } from "@/lib/types";

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
    onSuccess: () => {
      reset();
      setFlash("Aplicația e pe listă");
      onDone();
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAppLink({ data: { id } }),
    onSuccess: onDone,
  });

  if (embedded && !open && !editId) {
    return (
      <button
        type="button"
        className="mt-3 h-11 w-full rounded-full border border-border bg-elevated text-sm font-semibold"
        onClick={() => setOpen(true)}
      >
        Adaugă o aplicație
      </button>
    );
  }

  return (
    <section className={embedded ? "mt-4" : "mt-8"}>
      {embedded ? null : <h2 className="font-semibold">Alte aplicații de-ale mele</h2>}
      <p className="text-sm text-muted">
        Un banner lat — poză din galerie — și un link. Așa pui și aplicațiile care vin.
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
        <ImageField label="Banner" value={image} onChange={setImage} wide />
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
        disabled={save.isPending || title.trim().length < 2 || !image || !url.trim()}
        onClick={() => save.mutate()}
      >
        {editId ? "Salvează aplicația" : "Adaugă aplicația"}
      </Button>
      {editId || (embedded && open) ? (
        <button type="button" className="mt-2 w-full text-sm font-semibold text-muted" onClick={reset}>
          Renunță
        </button>
      ) : null}
      {embedded ? null : (
        <ul className="mt-4 space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-2xl border border-border bg-elevated">
              <AppCard app={{ ...a, url: "" }} />
              <div className="flex items-start justify-between gap-3 border-t border-border px-3 py-2">
                <p className="min-w-0 truncate text-xs text-primary">{a.url || "Fără link"}</p>
                <MsgActions
                  onEdit={() => {
                    setEditId(a.id);
                    setTitle(a.title);
                    setBody(a.body);
                    setImage(a.image);
                    setUrl(a.url);
                    setOpen(true);
                  }}
                  onDelete={() => del.mutate(a.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
