import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ShareHero } from "@/components/share-pay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SHARE_MAX, SHARE_MIN, SHARE_TEXT } from "@/lib/ad-pricing";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/trimite")({ component: TrimitePage });

function TrimitePage() {
  const [text, setText] = useState(SHARE_TEXT);
  const [copied, setCopied] = useState(false);
  const addAdShare = useShop((s) => s.addAdShare);
  const credits = useShop((s) => s.adShareCredits);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const message = `${text} ${origin}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-2 font-display text-2xl font-semibold">Trimite aplicația</h1>
        <p className="mt-1 text-sm text-muted">
          Asta e Aprozarul: piețe locale, 100% naturale, direct din grădină. Trimite la {SHARE_MIN}–
          {SHARE_MAX} oameni — așa pornește și reclama gratuită.
        </p>
        <div className="mt-3">
          <ShareHero />
        </div>
        <p className="mt-2 text-xs font-semibold tabular-nums text-primary">
          Ai trimis {credits} {credits === 1 ? "om" : "oameni"}
        </p>
        <label className="mt-3 block text-sm font-semibold">Mesajul tău</label>
        <Textarea className="mt-1 min-h-24" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex flex-col gap-2">
          <Button asChild>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => addAdShare()}
            >
              WhatsApp
            </a>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(message);
              addAdShare();
              setCopied(true);
            }}
          >
            {copied ? "Copiat" : "Copiază textul"}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Înapoi acasă</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
