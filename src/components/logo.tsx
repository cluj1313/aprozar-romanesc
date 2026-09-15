import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/images/logo-badge.png"
      alt=""
      className={cn("size-12 object-contain", className)}
    />
  );
}
