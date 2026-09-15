import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/lib/catalog-fns";
import { savedFromShop } from "@/lib/order-status";
import { useShop } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export function useSyncMyOrders() {
  const myOrderIds = useShop((s) => s.myOrderIds);
  const hydrateOrders = useShop((s) => s.hydrateOrders);
  const { data: catalog } = useCatalog();
  const enabled = myOrderIds.length > 0;

  const q = useQuery({
    queryKey: ["orders", "sync"],
    queryFn: () => listOrders(),
    enabled,
    refetchInterval: enabled ? 20_000 : false,
    staleTime: 8_000,
  });

  useEffect(() => {
    if (!q.data || !catalog) return;
    const mine = new Set(myOrderIds);
    const rows = q.data.filter((o) => mine.has(o.id));
    if (!rows.length) return;
    hydrateOrders(rows.map((o) => savedFromShop(o, catalog.products, catalog.producers)));
  }, [q.data, catalog, hydrateOrders, myOrderIds]);
}
