import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProducerOnly } from "@/components/producer-only";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PriceLive } from "@/components/price-live";
import { QtyStepper } from "@/components/qty-stepper";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProduct } from "@/lib/catalog-fns";
import { CATEGORIES } from "@/lib/categories";
import { UNITS, formatLei, parseLeiToBani, roundToStep } from "@/lib/money";
import { useShop } from "@/lib/store";
import type { Product } from "@/lib/types";
import { catalogQueryKey, useCatalog } from "@/lib/use-catalog";
import { newId } from "@/lib/utils";

export const Route = createFileRoute("/admin/produs/$id")({ component: ProductEditorPage });

function ProductEditorPage() {
  return (
    <ProducerOnly>
      <ProductEditor />
    </ProducerOnly>
  );
}

function ProductEditor() {
  const { id } = Route.useParams();
  const isNew = id === "nou";
  const { data } = useCatalog();
  const session = useShop((s) => s.session);
  const existing = data?.products.find((p) => p.id === id);
  const defaultProducer =
    session.role === "producer" ? session.producerId : (existing?.producerId ?? data?.producers[0]?.id ?? "nelu");

  const [form, setForm] = useState<Product>(() =>
    existing ?? {
      id: newId("p"),
      slug: "",
      name: "",
      category: "legume",
      producerId: defaultProducer,
      unit: "kg",
      priceBani: 1000,
      bulkQty: null,
      bulkPriceBani: null,
      step: 0.5,
      stock: 10,
      image: "/images/rosii.jpg",
      blurb: "",
      visible: true,
      featured: false,
      sortOrder: 50,
    },
  );
  const [qty, setQty] = useState(form.step || 1);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (existing) {
      setForm(existing);
      setQty(existing.step || 1);
    }
  }, [existing]);

  const producer = data?.producers.find((p) => p.id === form.producerId);
  const preview: Product = useMemo(() => form, [form]);

  const mutation = useMutation({
    mutationFn: () =>
      saveProduct({
        data: {
          ...form,
          producerId: session.role === "producer" ? session.producerId : form.producerId,
          slug: form.slug || slugify(form.name),
          bulkQty: form.bulkQty && form.bulkQty > 0 ? form.bulkQty : null,
          bulkPriceBani: form.bulkPriceBani && form.bulkPriceBani > 0 ? form.bulkPriceBani : null,
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: catalogQueryKey });
      setSaved(true);
      void navigate({ to: "/admin/produse" });
    },
  });

  if (!isNew && data && !existing) {
    return <p className="p-6">Produsul nu există.</p>;
  }

  if (session.role === "producer" && existing && existing.producerId !== session.producerId) {
    return (
      <div className="p-6">
        <p>Produsul nu e pe taraba ta. Doar tu îți schimbi marfa.</p>
        <Link to="/admin/produse" className="mt-3 inline-block text-sm font-semibold text-primary">
          Înapoi la produse
        </Link>
      </div>
    );
  }

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-2 md:px-6">
      <div>
        <p className="text-xs text-subtle">
          <Link to="/admin/produse" className="hover:text-primary">
            Produse
          </Link>
          {" / "}
          {isNew ? "Nou" : form.name}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {isNew ? "Pune marfă pe tarabă" : "Schimbă produsul"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tu pui prețul. Aplicația doar înmulțește — vezi în dreapta cât plătește omul.
        </p>

        <div className="mt-4 space-y-3">
          <Field label="Cum se cheamă">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Câteva vorbe">
            <Textarea value={form.blurb} onChange={(e) => set("blurb", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categorie">
              <select
                className="h-11 w-full rounded-md border border-border bg-elevated px-3"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {(data?.categories ?? CATEGORIES).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            {session.role === "producer" ? (
              <Field label="Ferma">
                <p className="flex h-11 items-center rounded-md border border-border bg-sunken px-3 text-sm">
                  {producer?.name ?? "Taraba ta"}
                </p>
              </Field>
            ) : (
              <Field label="De la cine">
                <select
                  className="h-11 w-full rounded-md border border-border bg-elevated px-3"
                  value={form.producerId}
                  onChange={(e) => set("producerId", e.target.value)}
                >
                  {(data?.producers ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <Field label="Cu ce se vinde">
            <div className="flex flex-wrap gap-1.5">
              {UNITS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => set("unit", u.id)}
                  className={`h-10 rounded-full border px-3 text-sm font-semibold ${
                    form.unit === u.id
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-elevated"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Preț pe ${form.unit} (lei)`}>
              <Input
                inputMode="decimal"
                defaultValue={(form.priceBani / 100).toFixed(2).replace(".", ",")}
                onBlur={(e) => set("priceBani", parseLeiToBani(e.target.value))}
              />
            </Field>
            <Field label="Cât mai ai">
              <Input
                inputMode="decimal"
                defaultValue={String(form.stock)}
                onBlur={(e) => set("stock", Number(e.target.value.replace(",", ".")) || 0)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pas (cât adaugi o dată)">
              <Input
                inputMode="decimal"
                defaultValue={String(form.step)}
                onBlur={(e) => {
                  const n = Number(e.target.value.replace(",", ".")) || 1;
                  set("step", n);
                  setQty(roundToStep(n, n));
                }}
              />
            </Field>
            <Field label="Poză (cale)">
              <Input value={form.image} onChange={(e) => set("image", e.target.value)} />
            </Field>
          </div>
          <div className="rounded-lg border border-border bg-sunken p-3">
            <p className="text-sm font-semibold">Preț mai bun la cantitate (opțional)</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Field label={`De la câți ${form.unit}`}>
                <Input
                  inputMode="decimal"
                  defaultValue={form.bulkQty ? String(form.bulkQty) : ""}
                  onBlur={(e) => {
                    const n = Number(e.target.value.replace(",", "."));
                    set("bulkQty", Number.isFinite(n) && n > 0 ? n : null);
                  }}
                />
              </Field>
              <Field label="Atunci prețul e">
                <Input
                  inputMode="decimal"
                  defaultValue={
                    form.bulkPriceBani ? (form.bulkPriceBani / 100).toFixed(2).replace(".", ",") : ""
                  }
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    set("bulkPriceBani", v ? parseLeiToBani(v) : null);
                  }}
                />
              </Field>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => set("visible", e.target.checked)}
            />
            Se vede pe tarabă
          </label>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name}>
            {mutation.isPending ? "Se salvează…" : "Publică pe tarabă"}
          </Button>
          <Button type="button" variant="secondary" asChild>
            <Link to="/admin/produse">Anulează</Link>
          </Button>
        </div>
        {saved ? <p className="mt-2 text-sm text-primary">Salvat.</p> : null}
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wide text-subtle uppercase">Cum se vede prețul</p>
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-elevated shadow-soft">
          <img src={preview.image} alt="" className="aspect-[3/2] w-full object-cover" />
          <div className="p-4">
            <p className="text-xs text-subtle">{producer?.name}</p>
            <p className="font-display text-xl font-semibold">{preview.name || "Fără nume"}</p>
            <p className="mt-1 text-sm text-muted">{preview.blurb || "Câteva vorbe despre marfă."}</p>
            <p className="mt-2">
              <span className="font-semibold tabular-nums">{formatLei(preview.priceBani)}</span>
              <span className="text-subtle"> / {preview.unit}</span>
            </p>
            <QtyStepper
              className="mt-3"
              qty={qty}
              step={preview.step}
              unit={preview.unit}
              onChange={(n) => setQty(n <= 0 ? preview.step : n)}
            />
            <div className="mt-3">
              <PriceLive product={preview} qty={qty} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
