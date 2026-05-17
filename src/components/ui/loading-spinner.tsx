export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block h-6 w-6 animate-spin border-2 border-line border-t-track ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}
