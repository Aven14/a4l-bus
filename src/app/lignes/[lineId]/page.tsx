import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicLineById } from "@/actions/lines";
import { PageHeader } from "@/components/ui/page-header";

type Props = { params: Promise<{ lineId: string }> };

export default async function LigneDetailPage({ params }: Props) {
  const { lineId } = await params;
  const line = await getPublicLineById(lineId);
  if (!line) notFound();

  return (
    <div className="page-enter mx-auto max-w-2xl px-4">
      <PageHeader
        title={line.name}
        subtitle={`Ligne ${line.number} · ${line.stops.length} arrêt${line.stops.length !== 1 ? "s" : ""}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/lignes" className="btn-secondary text-sm">
          ← Toutes les lignes
        </Link>
        <span
          className="rounded-md px-3 py-1 text-xs font-bold text-white shadow-card"
          style={{ backgroundColor: line.color }}
        >
          L{line.number}
        </span>
      </div>

      <ol className="space-y-2">
        {line.stops.map((stop, index) => (
          <li key={stop.id}>
            <div className="panel-soft flex gap-4 p-4">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-light text-sm font-bold text-primary"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{stop.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{stop.audioUrl}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {line.stops.length === 0 && (
        <p className="panel-soft p-6 text-center text-muted">Aucun arrêt sur cette ligne.</p>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/" className="font-medium text-primary hover:underline">
          Accueil
        </Link>
      </p>
    </div>
  );
}
