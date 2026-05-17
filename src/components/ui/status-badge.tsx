import { cn } from "@/lib/utils";

type Status = "valid" | "expired" | "not_found";

const config: Record<Status, { label: string; className: string }> = {
  valid: {
    label: "Valide",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  expired: {
    label: "Expiré",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  not_found: {
    label: "Introuvable",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        className
      )}
    >
      {label}
    </span>
  );
}
