import { cn } from "@/lib/utils";

export type AdminTab =
  | "acasa"
  | "liste"
  | "anunturi"
  | "aplicatia"
  | "reclame"
  | "moderatie"
  | "categorii"
  | "ajutor";

export const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: "acasa", label: "Acasă" },
  { id: "liste", label: "Liste" },
  { id: "anunturi", label: "Anunțuri" },
  { id: "aplicatia", label: "Aplicația" },
  { id: "reclame", label: "Reclame" },
  { id: "moderatie", label: "Moderație" },
  { id: "categorii", label: "Categorii" },
  { id: "ajutor", label: "Ajutor" },
];

export function PillRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 py-1">{children}</div>;
}

export function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150",
        active
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-elevated text-fg hover:bg-sunken",
      )}
    >
      {children}
    </button>
  );
}

export const adminField =
  "h-12 w-full rounded-xl border border-border bg-elevated px-4 text-base text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const adminArea =
  "min-h-28 w-full rounded-xl border border-border bg-elevated px-4 py-3 text-base text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
