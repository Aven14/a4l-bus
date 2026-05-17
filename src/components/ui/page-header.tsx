export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-slate-400">{subtitle}</p>
      )}
      <div className="mt-4 h-1 w-16 rounded-full bg-accent" />
    </div>
  );
}
