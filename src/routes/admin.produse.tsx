import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProducerOnly } from "@/components/producer-only";
import { deleteProduct, patchProduct } from "@/lib/catalog-fns";
import { categoryLabel } from "@/lib/categories";
import { formatLei, parseLeiToBani } from "@/lib/money";
import { useShop } from "@/lib/store";
import { catalogQueryKey, useCatalog } from "@/lib/use-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/produse")({ component: AdminProductsPage });

function AdminProductsPage() {
  return (
    <ProducerOnly>
      <AdminProducts />
    </ProducerOnly>
  );
}

function AdminProducts() {
  const session = useShop((s) => s.session);
  const setFlash = useShop((s) => s.setFlash);
  const { data } = useCatalog();
  const qc = useQueryClient();
  const producerId = session.role === "producer" ? session.producerId : null;
  const products = (data?.products ?? []).filter((p) => !producerId || p.producerId === producerId);
  const mutation = useMutation({
    mutationFn: (payload: { id: string; priceBani?: number; stock?: number; visible?: boolean }) =>
      patchProduct({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogQueryKey }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      setFlash("Produsul a fost șters");
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Marfa mea</h1>
          <p className="text-sm text-muted">
            Editează, ascunde ce nu e gata, sau șterge ce nu mai ai.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/produs/$id" params={{ id: "nou" }}>
            Produs nou
          </Link>
        </Button>
      </div>

      <ul className="mt-4 space-y-2 md:hidden">
        {products.map((p) => (
          <li key={p.id} className="rounded-2xl border border-border bg-elevated p-3">
            <div className="flex items-center gap-3">
              <img src={p.image} alt="" className="size-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted">
                  {formatLei(p.priceBani)} · stoc {p.stock}
                  {p.visible ? "" : " · ascuns"}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              <Link
                to="/admin/produs/$id"
                params={{ id: p.id }}
                className="text-sm font-semibold text-primary"
              >
                Editează
              </Link>
              <button
                type="button"
                className="text-sm font-semibold text-muted"
                onClick={() => mutation.mutate({ id: p.id, visible: !p.visible })}
              >
                {p.visible ? "Ascunde" : "Arată"}
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-danger"
                onClick={() => del.mutate(p.id)}
              >
                Șterge
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border bg-elevated md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="px-3 py-2 font-semibold">Produs</th>
              <th className="px-3 py-2 font-semibold">Preț</th>
              <th className="px-3 py-2 font-semibold">Stoc</th>
              <th className="px-3 py-2 font-semibold">Pe tarabă</th>
              <th className="px-3 py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const producer = data?.producers.find((x) => x.id === p.producerId);
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">
                      {producer?.name} · {categoryLabel(p.category, data?.categories)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-10 w-24 tabular-nums"
                        defaultValue={(p.priceBani / 100).toFixed(2).replace(".", ",")}
                        aria-label={`Preț ${p.name}`}
                        onBlur={(e) => {
                          const bani = parseLeiToBani(e.target.value);
                          if (bani !== p.priceBani) mutation.mutate({ id: p.id, priceBani: bani });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                      />
                      <span className="text-xs text-subtle">/ {p.unit}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">pe raft: {formatLei(p.priceBani)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      className="h-10 w-20 tabular-nums"
                      defaultValue={String(p.stock)}
                      aria-label={`Stoc ${p.name}`}
                      onBlur={(e) => {
                        const n = Number(e.target.value.replace(",", "."));
                        if (Number.isFinite(n) && n !== p.stock) mutation.mutate({ id: p.id, stock: n });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        p.visible ? "bg-primary/15 text-primary" : "bg-sunken text-muted"
                      }`}
                      onClick={() => mutation.mutate({ id: p.id, visible: !p.visible })}
                    >
                      {p.visible ? "Se vede" : "Ascuns"}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        to="/admin/produs/$id"
                        params={{ id: p.id }}
                        className="text-sm font-semibold text-primary"
                      >
                        Editează
                      </Link>
                      <button
                        type="button"
                        className="text-sm font-semibold text-danger"
                        onClick={() => del.mutate(p.id)}
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {products.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">Niciun produs. Pune primul pe tarabă.</p>
      ) : null}
    </div>
  );
}
