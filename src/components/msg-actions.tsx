import { cn } from "@/lib/utils";

export function MsgActions({
  hidden,
  onEdit,
  onHide,
  onDelete,
  className,
}: {
  hidden?: boolean;
  onEdit?: () => void;
  onHide?: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 flex-col items-end gap-1", className)}>
      {onEdit ? (
        <button type="button" className="text-sm font-semibold text-primary" onClick={onEdit}>
          Editează
        </button>
      ) : null}
      {onHide ? (
        <button type="button" className="text-sm font-semibold text-muted" onClick={onHide}>
          {hidden ? "Arată" : "Ascunde"}
        </button>
      ) : null}
      <button type="button" className="text-sm font-semibold text-danger" onClick={onDelete}>
        Șterge
      </button>
    </div>
  );
}
