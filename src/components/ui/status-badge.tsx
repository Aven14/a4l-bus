import { cn } from "@/lib/utils";

type Status = "valid" | "expired" | "not_found";

const config: Record<Status, { label: string; className: string }> = {
  valid: {
    label: "Valide",
    className: "bg-primary text-white shadow-card",
  },
  expired: {
    label: "Expiré",
    className: "bg-canvas text-muted shadow-card",
  },
  not_found: {
    label: "Introuvable",
    className: "bg-accent-light text-accent shadow-card",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {label}
    </span>
  );
}
