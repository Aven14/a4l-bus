export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 border-b-2 border-track pb-6">
      <p className="label-caps mb-2">Cross Track Bus</p>
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-track md:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-xl text-muted">{subtitle}</p>
      )}
    </div>
  );
}
