import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void> };

function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || ios;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function InstallApp() {
  const [ready, setReady] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setIos(isIos());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setReady(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone) {
    return (
      <section className="rounded-xl border border-border bg-elevated p-4">
        <p className="flex items-center gap-2 font-semibold">
          <Smartphone className="size-4" />
          Pe telefon
        </p>
        <p className="mt-1 text-sm text-muted">Aplicația e pe ecranul de start. O deschizi ca pe oricare alta.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-elevated p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Smartphone className="size-4" />
        Instalează pe telefon
      </p>
      <p className="mt-1 text-sm text-muted">
        O pui pe ecranul de start, ca o aplicație. Fără magazin, fără cont.
      </p>
      {ready ? (
        <Button
          type="button"
          className="mt-3 w-full"
          onClick={() => {
            void ready.prompt();
          }}
        >
          Adaugă pe ecranul de start
        </Button>
      ) : ios ? (
        <p className="mt-3 text-sm">
          Pe iPhone: butonul de share, apoi <span className="font-semibold">Adaugă la ecranul de start</span>.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          În Chrome sau Brave: meniul ⋮ → <span className="font-semibold text-fg">Instalează aplicația</span> sau
          Adaugă la ecranul de start.
        </p>
      )}
    </section>
  );
}
