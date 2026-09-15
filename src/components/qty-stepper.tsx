import { Minus, Plus } from "lucide-react";
import { formatQty, roundToStep } from "@/lib/money";
import { cn } from "@/lib/utils";

export function QtyStepper({
  qty,
  step,
  unit,
  onChange,
  className,
  compact,
  allowZero,
}: {
  qty: number;
  step: number;
  unit: string;
  onChange: (qty: number) => void;
  className?: string;
  compact?: boolean;
  allowZero?: boolean;
}) {
  const dec = () => {
    if (allowZero && qty <= step) onChange(0);
    else onChange(roundToStep(Math.max(step, qty - step), step));
  };
  const inc = () => onChange(roundToStep(qty + step, step));
  const compactLabel = Number.isInteger(qty)
    ? String(qty)
    : qty.toLocaleString("ro-RO", { maximumFractionDigits: 2 });
  return (
    <div className={cn("flex items-center", compact ? "gap-1" : "gap-2", className)}>
      <button
        type="button"
        aria-label="Scade"
        onClick={dec}
        className={cn(
          "flex items-center justify-center rounded-full border border-border bg-elevated text-fg hover:bg-sunken",
          compact ? "size-9" : "size-11",
        )}
      >
        <Minus className="size-4" />
      </button>
      <div
        className={cn(
          "text-center font-semibold tabular-nums",
          compact ? "min-w-8 text-sm" : "min-w-16 text-base",
        )}
      >
        {compact ? compactLabel : formatQty(qty, unit)}
      </div>
      <button
        type="button"
        aria-label="Adaugă"
        onClick={inc}
        className={cn(
          "flex items-center justify-center rounded-full border border-border bg-elevated text-fg hover:bg-sunken",
          compact ? "size-9" : "size-11",
        )}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
