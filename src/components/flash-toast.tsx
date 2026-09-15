import { useEffect } from "react";
import { Check } from "lucide-react";
import { useShop } from "@/lib/store";

export function FlashToast() {
  const flash = useShop((s) => s.flash);
  const setFlash = useShop((s) => s.setFlash);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 2400);
    return () => window.clearTimeout(t);
  }, [flash, setFlash]);

  if (!flash) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-3 shadow-soft">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-fg">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <p className="text-sm font-semibold">{flash}</p>
      </div>
    </div>
  );
}
