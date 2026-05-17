export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}
