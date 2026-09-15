import { useEffect } from "react";
import { useShop } from "@/lib/store";

export function ThemeSync() {
  const prefs = useShop((s) => s.prefs);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", prefs.theme === "dark");
    root.setAttribute("data-text", prefs.text);
    root.setAttribute("data-font", prefs.font || "oswald");
  }, [prefs.theme, prefs.text, prefs.font]);
  return null;
}
