import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useShop.persist.onFinishHydration(() => setHydrated(true));
    if (useShop.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
