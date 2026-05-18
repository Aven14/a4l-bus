import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicLineByNumber } from "@/actions/lines";
import { PageHeader } from "@/components/ui/page-header";

type Props = { params: Promise<{ lineId: string }> };

export default async function LigneDetailPage({ params }: Props) {
  const { lineId } = await params;
  
  // Extraire le numéro de ligne depuis le slug (ex: "l1" -> 1)
  const lineNumber = parseInt(lineId.replace("l", ""), 10);
  if (isNaN(lineNumber)) notFound();
  
  const line = await getPublicLineByNumber(lineNumber);
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

      <ol className="relative space-y-0">
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
              </div>
            </div>
            {index < line.stops.length - 1 && (
              <div className="flex justify-center py-2">
                <svg className="h-6 w-6 text-primary animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
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
