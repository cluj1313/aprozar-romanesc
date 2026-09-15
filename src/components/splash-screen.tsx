import { useEffect, useState } from "react";

let dismissed = false;
const SHOW_MS = 220;
const FAIL_MS = 380;

export function SplashScreen() {
  const [show, setShow] = useState(() => !dismissed);

  useEffect(() => {
    let hideTimer = 0;
    const hide = () => {
      dismissed = true;
      setShow(false);
    };
    const arm = () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hide, SHOW_MS);
    };

    if (dismissed) {
      setShow(false);
    } else {
      arm();
    }

    const fail = window.setTimeout(hide, FAIL_MS);
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      dismissed = false;
      setShow(true);
      arm();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(fail);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="splash-screen fixed inset-0 z-[80] flex items-center justify-center bg-bg px-3" aria-hidden>
      <img
        src="/images/splash.png"
        alt=""
        className="max-h-full max-w-full object-contain"
        decoding="async"
      />
    </div>
  );
}
