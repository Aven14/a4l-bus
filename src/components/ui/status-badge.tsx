import { cn } from "@/lib/utils";

type Status = "valid" | "expired" | "not_found";

const config: Record<Status, { label: string; className: string }> = {
  valid: {
    label: "Valide",
    className: "bg-track text-surface border-track",
  },
  expired: {
    label: "Expiré",
    className: "bg-canvas text-muted border-line",
  },
  not_found: {
    label: "Introuvable",
    className: "bg-surface text-signal border-signal",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "font-display inline-flex border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
        className
      )}
    >
      {label}
    </span>
  );
}
