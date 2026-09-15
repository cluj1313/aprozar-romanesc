import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { AdSlot } from "@/components/ad-slot";
import { CartBar } from "@/components/cart-bar";
import { FlashToast } from "@/components/flash-toast";
import { Header } from "@/components/header";
import { OrderShareQueue } from "@/components/order-share-queue";
import { TabBar } from "@/components/tab-bar";
import { touchVisitor } from "@/lib/platform-fns";
import { appPageQueryKey, visitorKey } from "@/lib/use-app-page";
import { useSyncMyOrders } from "@/lib/use-sync-orders";

export function AppShell({ children }: { children: React.ReactNode }) {
  useSyncMyOrders();
  useTouchVisitor();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";
  const onPay = pathname.startsWith("/cos") || pathname.startsWith("/comanda");

  return (
    <div className="app-shell mx-auto flex min-h-0 w-full max-w-xl flex-col overflow-hidden bg-bg text-fg shadow-soft">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <div className="mt-auto shrink-0 bg-bg">
        <OrderShareQueue />
        {onPay ? <AdSlot position="checkout_more" className="px-4 pb-1" /> : null}
        <CartBar />
        {onHome ? <AdSlot position="home_bottom" /> : null}
        <TabBar />
      </div>
      <FlashToast />
    </div>
  );
}

function useTouchVisitor() {
  const qc = useQueryClient();
  useEffect(() => {
    const key = visitorKey();
    if (!key) return;
    void touchVisitor({ data: { key } }).then(() => {
      void qc.invalidateQueries({ queryKey: appPageQueryKey });
    });
  }, [qc]);
}
