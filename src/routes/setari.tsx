import { createFileRoute } from "@tanstack/react-router";
import { AdSlot } from "@/components/ad-slot";
import { AppShell } from "@/components/app-shell";
import { InstallApp } from "@/components/install-app";
import {
  AD_BLOCK_FOREVER_BANI,
  AD_BLOCK_YEAR_BANI,
  adsAreBlocked,
  adsBlockCopy,
} from "@/lib/ad-block";
import { FONT_CHOICES } from "@/lib/fonts";
import { formatLei } from "@/lib/money";
import { useShop } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setari")({ component: SetariPage });

function SetariPage() {
  const prefs = useShop((s) => s.prefs);
  const setPrefs = useShop((s) => s.setPrefs);
  const adsBlockedUntil = useShop((s) => s.adsBlockedUntil);
  const blockAds = useShop((s) => s.blockAds);
  const setFlash = useShop((s) => s.setFlash);
  const font = prefs.font || "oswald";
  const blocked = adsAreBlocked(adsBlockedUntil);
  const forever = adsBlockedUntil === "forever";
  const blockNote = adsBlockCopy(adsBlockedUntil);

  const buy = (kind: "year" | "forever") => {
    if (forever) {
      setFlash("Reclamele sunt deja oprite pentru totdeauna");
      return;
    }
    blockAds(kind);
    setFlash(
      kind === "forever"
        ? "Reclamele sunt oprite pentru totdeauna"
        : "Reclamele sunt oprite un an",
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-3 font-display text-2xl font-semibold">Setări</h1>
        <p className="mt-1 text-sm text-muted">Litere, fundal, forma cardurilor.</p>

        <div className="mt-5">
          <InstallApp />
        </div>

        <h2 className="mt-6 text-sm font-semibold">Mărimea textului</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["normal", "Normal"],
              ["large", "Mare"],
              ["xl", "Foarte mare"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPrefs({ text: id })}
              className={cn(
                "h-16 rounded-lg border text-sm font-semibold",
                prefs.text === id
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-elevated",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-semibold">Literele</h2>
        <p className="mt-1 text-xs text-muted">Prețul e mereu cu litere înalte, ca Oswald.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {FONT_CHOICES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPrefs({ font: f.id })}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left",
                font === f.id
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-elevated",
              )}
            >
              <span className="block font-display text-lg font-semibold leading-none">{f.label}</span>
              <span
                className={cn(
                  "mt-1 block text-xs",
                  font === f.id ? "text-primary-fg/80" : "text-muted",
                )}
              >
                {f.hint}
              </span>
              <span
                className="mt-1.5 block text-xl font-semibold leading-none"
                style={{ fontFamily: f.family, letterSpacing: "0.04em" }}
              >
                22,50 lei
              </span>
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-semibold">Fundal</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPrefs({ theme: "light" })}
            className={cn(
              "h-16 rounded-lg border font-semibold",
              prefs.theme === "light"
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-elevated",
            )}
          >
            Luminos
          </button>
          <button
            type="button"
            onClick={() => setPrefs({ theme: "dark" })}
            className={cn(
              "h-16 rounded-lg border font-semibold",
              prefs.theme === "dark"
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-fg text-bg",
            )}
          >
            Întunecat
          </button>
        </div>

        <h2 className="mt-6 text-sm font-semibold">Carduri producători și povești</h2>
        <p className="mt-1 text-xs text-muted">Înalte ca portretele, sau mai plate, pe lățime.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPrefs({ cards: "tall" })}
            className={cn(
              "h-20 rounded-lg border font-semibold",
              prefs.cards === "tall"
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-elevated",
            )}
          >
            Înalte
          </button>
          <button
            type="button"
            onClick={() => setPrefs({ cards: "flat" })}
            className={cn(
              "h-20 rounded-lg border font-semibold",
              prefs.cards === "flat"
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-elevated",
            )}
          >
            Plate
          </button>
        </div>

        <h2 id="fara-reclame" className="mt-8 scroll-mt-16 text-sm font-semibold">
          Fără reclame
        </h2>
        <p className="mt-1 text-xs text-muted">
          Le oprești pe telefonul ăsta — și din meniul de sus. {formatLei(AD_BLOCK_YEAR_BANI)} un an,{" "}
          {formatLei(AD_BLOCK_FOREVER_BANI)} pentru totdeauna.
        </p>
        {blockNote ? (
          <p className="mt-3 rounded-xl border border-border bg-elevated px-4 py-3 text-sm">{blockNote}</p>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => buy("year")}
            className={cn(
              "rounded-lg border px-3 py-3 text-left",
              blocked && !forever
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-elevated",
            )}
          >
            <span className="block font-display text-xl font-semibold leading-none tabular-nums">
              50 lei
            </span>
            <span className={cn("mt-1.5 block text-xs", blocked && !forever ? "text-primary-fg/80" : "text-muted")}>
              Un an fără reclame
            </span>
          </button>
          <button
            type="button"
            onClick={() => buy("forever")}
            className={cn(
              "rounded-lg border px-3 py-3 text-left",
              forever ? "border-primary bg-primary text-primary-fg" : "border-border bg-elevated",
            )}
          >
            <span className="block font-display text-xl font-semibold leading-none tabular-nums">
              100 lei
            </span>
            <span className={cn("mt-1.5 block text-xs", forever ? "text-primary-fg/80" : "text-muted")}>
              Pentru totdeauna
            </span>
          </button>
        </div>

        {blocked ? null : (
          <div className="mt-6">
            <AdSlot position="account_bottom" className="px-0 pb-0" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
