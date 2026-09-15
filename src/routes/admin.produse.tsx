import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProducerOnly } from "@/components/producer-only";
import { patchProduct } from "@/lib/catalog-fns";
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
  const { data } = useCatalog();
  const qc = useQueryClient();
  const producerId = session.role === "producer" ? session.producerId : null;
  const products = (data?.products ?? []).filter((p) => !producerId || p.producerId === producerId);
  const mutation = useMutation({
    mutationFn: (payload: { id: string; priceBani?: number; stock?: number; visible?: boolean }) =>
      patchProduct({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogQueryKey }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Produse</h1>
          <p className="text-sm text-muted">Atinge prețul sau stocul, apasă Enter. Se vede imediat în magazin.</p>
        </div>
        <Button asChild>
          <Link to="/admin/produs/$id" params={{ id: "nou" }}>
            Produs nou
          </Link>
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-elevated">
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
                    <Link
                      to="/admin/produs/$id"
                      params={{ id: p.id }}
                      className="text-sm font-semibold text-primary"
                    >
                      Editează
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
