import { useEffect } from "react";

export function AppViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
      if (h > 0) root.style.setProperty("--app-h", `${h}px`);
    };
    apply();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);
  return null;
}
