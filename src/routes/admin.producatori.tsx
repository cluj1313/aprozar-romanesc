import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProducerOnly } from "@/components/producer-only";
import { SocialEditor } from "@/components/social-row";
import { saveProducer } from "@/lib/catalog-fns";
import { formatLei, parseLeiToBani } from "@/lib/money";
import { DEFAULT_PRODUCER_SOCIAL_INTRO, pickSocial, withSocial } from "@/lib/social";
import { useShop } from "@/lib/store";
import type { Producer } from "@/lib/types";
import { catalogQueryKey, useCatalog } from "@/lib/use-catalog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/admin/producatori")({ component: AdminProducersPage });

function AdminProducersPage() {
  return (
    <ProducerOnly>
      <AdminProducers />
    </ProducerOnly>
  );
}

function AdminProducers() {
  const session = useShop((s) => s.session);
  const { data } = useCatalog();
  const list =
    session.role === "producer"
      ? (data?.producers ?? []).filter((p) => p.id === session.producerId)
      : (data?.producers ?? []);
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <h1 className="font-display text-2xl font-semibold">Producători</h1>
      <p className="text-sm text-muted">Ridicare, drum, minim de comandă — totul în lei, fără taxe.</p>
      <div className="mt-4 space-y-4">
        {list.map((p) => (
          <ProducerForm key={p.id} producer={p} />
        ))}
      </div>
    </div>
  );
}

function ProducerForm({ producer }: { producer: Producer }) {
  const [form, setForm] = useState(producer);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      const { blocked: _b, warningCount: _w, ...rest } = form;
      return saveProducer({ data: rest });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogQueryKey }),
  });
  const set = <K extends keyof Producer>(k: K, v: Producer[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form
      className="rounded-xl border border-border bg-elevated p-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="flex gap-3">
        <img src={form.image} alt="" className="size-16 rounded-md object-cover" />
        <div className="flex-1">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input value={form.village} onChange={(e) => set("village", e.target.value)} />
            <Input value={form.county} onChange={(e) => set("county", e.target.value)} />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Label>Vorbe despre fermă</Label>
        <Textarea value={form.blurb} onChange={(e) => set("blurb", e.target.value)} />
      </div>
      <SocialEditor
        values={pickSocial(form)}
        onChange={(next) => setForm((f) => withSocial(f, next))}
        introPlaceholder={DEFAULT_PRODUCER_SOCIAL_INTRO}
      />
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <Label>Telefon</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label>Drum (lei)</Label>
          <Input
            defaultValue={(form.deliveryFeeBani / 100).toFixed(2).replace(".", ",")}
            onBlur={(e) => set("deliveryFeeBani", parseLeiToBani(e.target.value))}
          />
        </div>
        <div>
          <Label>Gratuit peste</Label>
          <Input
            defaultValue={(form.freeOverBani / 100).toFixed(2).replace(".", ",")}
            onBlur={(e) => set("freeOverBani", parseLeiToBani(e.target.value))}
          />
        </div>
        <div>
          <Label>Minim comandă</Label>
          <Input
            defaultValue={(form.minOrderBani / 100).toFixed(2).replace(".", ",")}
            onBlur={(e) => set("minOrderBani", parseLeiToBani(e.target.value))}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.pickup} onChange={(e) => set("pickup", e.target.checked)} />
          Ridicare
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.delivery} onChange={(e) => set("delivery", e.target.checked)} />
          Livrare
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
          Se vede în magazin
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        Acum: drum {formatLei(form.deliveryFeeBani)}
        {form.freeOverBani ? `, gratuit de la ${formatLei(form.freeOverBani)}` : ""}
      </p>
      <Button type="submit" className="mt-3" disabled={mutation.isPending}>
        {mutation.isPending ? "Se salvează…" : "Salvează ferma"}
      </Button>
    </form>
  );
}
