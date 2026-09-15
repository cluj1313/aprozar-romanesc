import { useQuery } from "@tanstack/react-query";
import { getPlatform } from "@/lib/platform-fns";
import type { Platform } from "@/lib/types";

export const platformQueryKey = ["platform"] as const;

export function usePlatform() {
  return useQuery<Platform>({
    queryKey: platformQueryKey,
    queryFn: () => getPlatform(),
  });
}
