import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 flex-col justify-center gap-[3px] border-2 border-track bg-surface",
          compact ? "h-9 w-9 px-1" : "h-11 w-11 px-1.5"
        )}
        aria-hidden
      >
        <span className="block h-[3px] w-full bg-track" />
        <span className="block h-[3px] w-3/4 bg-track" />
        <span className="block h-[3px] w-full bg-track" />
      </div>
      <div className="leading-none">
        <span
          className={cn(
            "font-display font-extrabold uppercase tracking-tight text-track",
            compact ? "text-sm" : "text-base"
          )}
        >
          Cross Track
        </span>
        <span
          className={cn(
            "font-display block font-extrabold uppercase tracking-[0.2em] text-track",
            compact ? "text-lg" : "text-xl"
          )}
        >
          Bus
        </span>
        {!compact && (
          <span className="label-caps mt-1 block">Réseau RP · Arma 3</span>
        )}
      </div>
    </div>
  );
}
