import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminField } from "@/components/admin/pills";
import { Button } from "@/components/ui/button";
import { deleteCategory, saveCategory } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";

export function TabCategorii({ platform }: { platform: Platform }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const save = useMutation({
    mutationFn: (p: { id?: string; label: string }) => saveCategory({ data: p }),
    onSuccess: () => {
      setLabel("");
      setEditing(null);
      setFlash("Categoria e salvată");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setFlash(res.error);
        return;
      }
      setFlash("Categoria a fost ștearsă");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  return (
    <div>
      <p className="text-sm text-muted">
        Categoriile se văd pe tarabă, la căutare. Producătorul își alege categoria când pune un
        produs — tu doar ții lista.
      </p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (label.trim().length >= 2) save.mutate({ label });
        }}
      >
        <input
          className={adminField}
          placeholder="Categorie nouă, ex. Verdețuri"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Button type="submit" className="h-12 shrink-0 rounded-xl" disabled={save.isPending}>
          Adaugă
        </Button>
      </form>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-elevated">
        {platform.categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 px-4 py-3">
            {editing === c.id ? (
              <>
                <input
                  className={adminField}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => save.mutate({ id: c.id, label: editLabel })}
                >
                  Salvează
                </Button>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 font-semibold">{c.label}</p>
                <button
                  type="button"
                  className="text-sm font-semibold text-primary"
                  onClick={() => {
                    setEditing(c.id);
                    setEditLabel(c.label);
                  }}
                >
                  Editează
                </button>
                <button
                  type="button"
                  className="text-sm font-semibold text-danger"
                  onClick={() => del.mutate(c.id)}
                >
                  Șterge
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
