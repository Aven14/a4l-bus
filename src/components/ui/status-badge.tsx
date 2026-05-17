import { cn } from "@/lib/utils";

type Status = "valid" | "expired" | "not_found";

const config: Record<Status, { label: string; className: string }> = {
  valid: {
    label: "Valide",
    className: "bg-primary text-white",
  },
  expired: {
    label: "Expiré",
    className: "bg-canvas text-muted border border-line",
  },
  not_found: {
    label: "Introuvable",
    className: "bg-accent-light text-accent border border-red-200",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {label}
    </span>
  );
}
