export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 border-b border-line pb-6">
      <p className="label-caps mb-1 text-primary">Cross Track Bus</p>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-xl text-muted">{subtitle}</p>
      )}
    </div>
  );
}
