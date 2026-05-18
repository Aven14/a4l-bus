import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-dark shadow-elevated",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%] max-h-6 max-w-6" fill="none">
        <path
          d="M4 6h16M4 12h12M4 18h16"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="18" cy="18" r="3" fill="#dc2626" />
      </svg>
    </div>
  );
}

export function BrandLogo({
  compact = false,
  light = false,
  variant = "default",
  className,
}: {
  compact?: boolean;
  light?: boolean;
  variant?: "default" | "navbarCenter";
  className?: string;
}) {
  if (variant === "navbarCenter") {
    return (
      <div className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
        <LogoMark className={compact ? "h-9 w-9" : "h-10 w-10"} />
        <div className="min-w-0 leading-tight">
          <span
            className={cn(
              "block text-[0.8125rem] font-extrabold tracking-tight sm:text-base",
              light ? "text-white" : "text-ink"
            )}
          >
            Cross Track{" "}
            <span className={light ? "text-white" : "text-gradient-brand"}>Bus</span>
          </span>
          <span
            className={cn(
              "mt-0.5 block text-[9px] font-semibold uppercase tracking-widest sm:text-[10px]",
              light ? "text-white/75" : "text-muted"
            )}
          >
            Réseau transport
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark className={compact ? "h-9 w-9" : "h-11 w-11"} />
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
