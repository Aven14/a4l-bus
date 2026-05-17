import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  light = false,
  className,
}: {
  compact?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-md shadow-primary/25",
          compact ? "h-9 w-9" : "h-11 w-11"
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className={cn(compact ? "h-5 w-5" : "h-6 w-6")}
          fill="none"
        >
          <path
            d="M4 6h16M4 12h12M4 18h16"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="3" fill="#dc2626" />
        </svg>
      </div>
      <div className="leading-tight">
        <span
          className={cn(
            "block text-sm font-bold tracking-tight",
            light ? "text-white" : "text-ink"
          )}
        >
          Cross Track
        </span>
        <span
          className={cn(
            "block text-base font-extrabold tracking-tight",
            light ? "text-white" : "text-gradient-brand"
          )}
        >
          Bus
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-0.5 block text-[10px] font-medium uppercase tracking-wider",
              light ? "text-white/70" : "text-muted"
            )}
          >
            Réseau RP
          </span>
        )}
      </div>
    </div>
  );
}
