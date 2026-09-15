import { Navigate } from "@tanstack/react-router";
import { useShop } from "@/lib/store";

export function ProducerOnly({ children }: { children: React.ReactNode }) {
  const session = useShop((s) => s.session);
  if (session.role === "admin") return <Navigate to="/admin" />;
  if (session.role !== "producer") return <Navigate to="/cont" />;
  return children;
}
