import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/wa-icon";
import { formatLei } from "@/lib/money";
import { openWhatsApp } from "@/lib/order-message";
import { useShop } from "@/lib/store";

export function OrderShareQueue() {
  const queue = useShop((s) => s.shareQueue);
  const shiftShareQueue = useShop((s) => s.shiftShareQueue);
  const next = queue[0];
  if (!next) return null;
  const rest = queue.length - 1;

  return (
    <div className="border-t border-border bg-elevated px-4 py-3">
      <p className="text-sm font-semibold">Trimite comanda către {next.producerName}</p>
      <p className="mt-0.5 text-xs text-muted">
        {formatLei(next.totalBani)}
        {rest > 0
          ? ` · mai rămân ${rest} ${rest === 1 ? "fermă" : "ferme"}`
          : " · mesaj separat, doar marfa lor"}
      </p>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          className="h-11 flex-1 rounded-full"
          onClick={() => {
            openWhatsApp(next.producerPhone, next.text);
            shiftShareQueue();
          }}
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp
        </Button>
        <Button type="button" variant="secondary" className="h-11 rounded-full px-4" onClick={() => shiftShareQueue()}>
          Sari
        </Button>
      </div>
    </div>
  );
}
