import { useQuery } from "@tanstack/react-query";
import { getCatalog } from "@/lib/catalog-fns";
import type { Catalog } from "@/lib/types";

export const catalogQueryKey = ["catalog"] as const;

export function useCatalog(initialData?: Catalog) {
  return useQuery<Catalog>({
    queryKey: catalogQueryKey,
    queryFn: () => getCatalog(),
    initialData,
  });
}
