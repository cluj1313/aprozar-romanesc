import { useQuery } from "@tanstack/react-query";
import { getAppPage } from "@/lib/platform-fns";
import type { AppPage } from "@/lib/types";

export const appPageQueryKey = ["app-page"] as const;

function visitorKey() {
  if (typeof window === "undefined") return undefined;
  try {
    let key = window.localStorage.getItem("aprozar-vid");
    if (!key) {
      key = window.crypto?.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem("aprozar-vid", key);
    }
    return key;
  } catch {
    return undefined;
  }
}

export function useAppPage(initial?: AppPage) {
  return useQuery<AppPage>({
    queryKey: appPageQueryKey,
    queryFn: () => getAppPage({ data: { visitorKey: visitorKey() } }),
    initialData: initial,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export { visitorKey };
