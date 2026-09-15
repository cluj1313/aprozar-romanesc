import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { deleteCategory, saveCategory } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import { useCatalog, catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";
import { cn } from "@/lib/utils";

type Tool = "add" | "edit" | "delete" | null;

export function CategoryStrip({
  q,
  mode = "home",
}: {
  q?: string;
  mode?: "home" | "shop";
}) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { q?: string; c?: string };
  const { data } = useCatalog();
  const categories = data?.categories?.length ? data.categories : [...DEFAULT_CATEGORIES];
  const session = useShop((s) => s.session);
  const setFlash = useShop((s) => s.setFlash);
  const isAdmin = session.role === "admin";
  const qc = useQueryClient();
  const shop = mode === "shop";
  const [open, setOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, x: 0, sl: 0, moved: false });
  const [tool, setTool] = useState<Tool>(null);
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (p: { id?: string; label: string }) => saveCategory({ data: p }),
    onSuccess: () => {
      setLabel("");
      setEditingId(null);
      setTool(null);
      setFlash("Categoria e salvată");
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setFlash(res.error);
        return;
      }
      setTool(null);
      setFlash("Categoria a fost ștearsă");
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
      void qc.invalidateQueries({ queryKey: platformQueryKey });
    },
  });

  function needAdmin() {
    if (isAdmin) return true;
    setFlash("Doar administratorul schimbă categoriile");
    void navigate({ to: "/admin" });
    return false;
  }

  function onToate() {
    setOpen((v) => !v);
    if (search.c) {
      void navigate({ to: "/produse", search: { q: q || undefined, c: undefined } });
    }
  }

  function onChip(c: { id: string; label: string }) {
    if (tool === "edit") {
      if (!needAdmin()) return;
      setEditingId(c.id);
      setLabel(c.label);
      return;
    }
    if (tool === "delete") {
      if (!needAdmin()) return;
      del.mutate(c.id);
      return;
    }
    void navigate({ to: "/produse", search: { q: q || undefined, c: c.id } });
  }

  const chipClass = (active: boolean) =>
    cn(
      "flex h-7 max-w-full shrink-0 items-center rounded-full border px-2.5 text-xs font-medium",
      active ? "border-primary bg-primary text-primary-fg" : "border-border bg-elevated",
    );

  const iconClass = (active: boolean, dashed = false) =>
    cn(
      "flex size-7 shrink-0 items-center justify-center rounded-full border",
      dashed
        ? "border-dashed border-primary text-primary"
        : active
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-elevated text-fg",
    );

  const showTools = !shop;

  const actions = showTools ? (
    <>
      {tool === "add" ? (
        <form
          className="flex h-7 min-w-36 items-center rounded-full border border-primary bg-elevated px-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!needAdmin()) return;
            if (label.trim().length >= 2) save.mutate({ label });
          }}
        >
          <input
            className="h-6 min-w-0 flex-1 bg-transparent text-xs focus-visible:outline-none"
            placeholder="Nume categorie"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Categorie nouă"
            autoFocus
          />
        </form>
      ) : (
        <button
          type="button"
          aria-label="Adaugă categorie"
          className={
            open
              ? cn(chipClass(false), "border-dashed border-primary text-primary")
              : iconClass(false, true)
          }
          onClick={() => {
            if (!needAdmin()) return;
            setTool("add");
            setEditingId(null);
            setLabel("");
          }}
        >
          <Plus className="size-3.5" />
          {open ? <span className="ms-1">Adaugă Categorie</span> : null}
        </button>
      )}
      <button
        type="button"
        aria-label="Editează categorie"
        aria-pressed={tool === "edit"}
        className={iconClass(tool === "edit")}
        onClick={() => {
          if (!needAdmin()) return;
          setTool((t) => (t === "edit" ? null : "edit"));
          setEditingId(null);
        }}
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Șterge categorie"
        aria-pressed={tool === "delete"}
        className={iconClass(tool === "delete")}
        onClick={() => {
          if (!needAdmin()) return;
          setTool((t) => (t === "delete" ? null : "delete"));
          setEditingId(null);
        }}
      >
        <Trash2 className="size-3.5" />
      </button>
    </>
  ) : null;

  const chips = (
    <>
      <button type="button" onClick={onToate} className={chipClass(!search.c)}>
        Toate
      </button>
      {categories.map((c) =>
        editingId === c.id ? (
          <form
            key={c.id}
            className="flex h-7 min-w-36 items-center rounded-full border border-primary bg-elevated px-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (label.trim().length >= 2) save.mutate({ id: c.id, label });
            }}
          >
            <input
              className="h-6 min-w-0 flex-1 bg-transparent text-xs focus-visible:outline-none"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              aria-label="Redenumește categoria"
              autoFocus
            />
          </form>
        ) : (
          <button key={c.id} type="button" onClick={() => onChip(c)} className={chipClass(search.c === c.id)}>
            <span className="truncate">{c.label}</span>
          </button>
        ),
      )}
      {actions}
    </>
  );

  if (open) {
    return <div className="mt-1.5 flex flex-wrap gap-1.5">{chips}</div>;
  }

  return (
    <div
      ref={stripRef}
      className="hide-scrollbar mt-1.5 -mx-4 cursor-grab overflow-x-auto overscroll-x-contain active:cursor-grabbing"
      onPointerDown={(e) => {
        const el = stripRef.current;
        if (!el) return;
        drag.current = { on: true, x: e.clientX, sl: el.scrollLeft, moved: false };
        el.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current.on || !stripRef.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 4) drag.current.moved = true;
        stripRef.current.scrollLeft = drag.current.sl - dx;
      }}
      onPointerUp={(e) => {
        drag.current.on = false;
        stripRef.current?.releasePointerCapture(e.pointerId);
      }}
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.preventDefault();
          e.stopPropagation();
          drag.current.moved = false;
        }
      }}
    >
      <div className="flex w-max items-center gap-1.5 px-4 pe-8 pb-0.5">{chips}</div>
    </div>
  );
}
