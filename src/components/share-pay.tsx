import { SHARE_MAX, SHARE_MIN, SHARE_TEXT } from "@/lib/ad-pricing";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/store";

function shareUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function shareHref() {
  const text = `${SHARE_TEXT} ${shareUrl()}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function ShareHero({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "overflow-hidden rounded-xl" : "overflow-hidden rounded-2xl"}>
      <img
        src="/images/splash.png"
        alt="Aprozar Românesc"
        className="w-full object-contain"
      />
    </div>
  );
}

export function SharePay({
  needed = SHARE_MIN,
  onDone,
  onClose,
}: {
  needed?: number;
  onDone: () => void;
  onClose: () => void;
}) {
  const credits = useShop((s) => s.adShareCredits);
  const addAdShare = useShop((s) => s.addAdShare);
  const have = Math.min(credits, needed);

  function bump() {
    const next = addAdShare();
    if (next >= needed) onDone();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-fg/50 p-3 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-bg p-4 shadow-soft">
        <ShareHero />
        <h2 className="mt-3 font-display text-xl font-semibold">Achită cu Share</h2>
        <p className="mt-1 text-sm text-muted">
          Momentan reclama se pornește dacă trimiți aplicația la {SHARE_MIN}–{SHARE_MAX} oameni.
          Așa creștem taraba.
        </p>
        <p className="mt-3 text-sm font-semibold tabular-nums">
          Trimise: {have} / {needed}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Button asChild>
            <a
              href={shareHref()}
              target="_blank"
              rel="noreferrer"
              onClick={() => bump()}
            >
              WhatsApp
            </a>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(`${SHARE_TEXT} ${shareUrl()}`);
              bump();
            }}
          >
            Copiază mesajul
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Mai târziu
          </Button>
        </div>
      </div>
    </div>
  );
}
