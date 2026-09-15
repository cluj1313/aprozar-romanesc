import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminField } from "@/components/admin/pills";
import {
  daysOf,
  mergeAdPrices,
  placementsOf,
  secondsOf,
} from "@/lib/ad-pricing";
import { formatLei, parseLeiToBani } from "@/lib/money";
import { saveAdPrice } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { AdPrice } from "@/lib/types";
import { catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";

function LeiInput({
  id,
  priceBani,
  onSave,
}: {
  id: string;
  priceBani: number;
  onSave: (id: string, priceBani: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        key={`${id}-${priceBani}`}
        className={`${adminField} h-10 w-28 text-right tabular-nums`}
        defaultValue={(priceBani / 100).toFixed(2).replace(".", ",")}
        inputMode="decimal"
        aria-label="Preț în lei"
        onBlur={(e) => {
          const bani = parseLeiToBani(e.target.value);
          if (bani !== priceBani) onSave(id, bani);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      <span className="text-xs text-subtle">lei</span>
    </div>
  );
}

export function AdPricesPanel({ prices }: { prices: AdPrice[] }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const merged = mergeAdPrices(prices);
  const places = placementsOf(merged);
  const days = daysOf(merged);
  const seconds = secondsOf(merged);

  const save = useMutation({
    mutationFn: (p: { id: string; priceBani: number }) => saveAdPrice({ data: p }),
    onSuccess: () => {
      setFlash("Prețul e salvat");
      void qc.invalidateQueries({ queryKey: platformQueryKey });
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  const put = (id: string, priceBani: number) => save.mutate({ id, priceBani });

  return (
    <section className="mt-6 rounded-2xl border border-border bg-elevated p-3">
      <h2 className="text-lg font-semibold">Prețuri reclame</h2>
      <p className="mt-1 text-xs text-muted">
        Aici le schimbi tu, în lei. Se văd imediat când cineva pune o reclamă — loc, zile și
        secunde pe ecran.
      </p>

      <p className="mt-4 text-xs font-semibold text-muted">Loc pe ecran</p>
      <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg">
        {places.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{p.label}</p>
              <p className="text-xs text-muted">{p.hint}</p>
            </div>
            <LeiInput id={`place:${p.id}`} priceBani={p.priceBani} onSave={put} />
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs font-semibold text-muted">Zile de rulare</p>
      <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg">
        {days.map((d) => (
          <li key={d.days} className="flex items-center gap-3 px-3 py-2">
            <p className="min-w-0 flex-1 text-sm font-semibold">
              {d.days} {d.days === 1 ? "zi" : "zile"}
            </p>
            <LeiInput id={`days:${d.days}`} priceBani={d.priceBani} onSave={put} />
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs font-semibold text-muted">Secunde pe ecran</p>
      <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg">
        {seconds.map((s) => (
          <li key={s.seconds} className="flex items-center gap-3 px-3 py-2">
            <p className="min-w-0 flex-1 text-sm font-semibold">{s.seconds} secunde</p>
            <LeiInput id={`seconds:${s.seconds}`} priceBani={s.priceBani} onSave={put} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted">
        Exemplu: Jos pe Acasă {formatLei(places[0]?.priceBani ?? 0)} + 7 zile{" "}
        {formatLei(days.find((d) => d.days === 7)?.priceBani ?? 0)} + 10 s{" "}
        {formatLei(seconds.find((s) => s.seconds === 10)?.priceBani ?? 0)}.
      </p>
    </section>
  );
}
