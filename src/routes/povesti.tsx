import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/povesti")({
  component: () => <Outlet />,
});
