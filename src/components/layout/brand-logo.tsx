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
        {/* Bus stylisé */}
        <path
          d="M4 7h16c0.55 0 1 0.45 1 1v8c0 0.55-0.45 1-1 1h-1c-0.55 0-1-0.45-1-1v-1H6v1c0 0.55-0.45 1-1 1H4c-0.55 0-1-0.45-1-1V8c0-0.55 0.45-1 1-1z"
          fill="white"
        />
        {/* Fenêtres du bus */}
        <rect x="6" y="9" width="3" height="2" rx="0.5" fill="#194A78" />
        <rect x="10.5" y="9" width="3" height="2" rx="0.5" fill="#194A78" />
        <rect x="15" y="9" width="3" height="2" rx="0.5" fill="#194A78" />
        {/* Roues */}
        <circle cx="7" cy="17" r="1.5" fill="#26BBDC" />
        <circle cx="17" cy="17" r="1.5" fill="#26BBDC" />
        {/* Ligne de trajet */}
        <path
          d="M2 5c2 0 3 1 5 1s3-1 5-1 3 1 5 1"
          stroke="#26BBDC"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
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
            Clear
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
          ClearGroup
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
