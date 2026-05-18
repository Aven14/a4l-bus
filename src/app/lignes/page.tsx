import Link from "next/link";
import { getPublicNetworkLines } from "@/actions/lines";
import { PageHeader } from "@/components/ui/page-header";

export default async function LignesPage() {
  const lines = await getPublicNetworkLines();

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Lignes du réseau"
        subtitle="Consultez les lignes et leurs arrêts (accès libre, sans compte)."
      />

      {lines.length === 0 ? (
        <div className="panel-soft p-10 text-center text-muted">
          Aucune ligne n&apos;est encore configurée dans la base.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((line) => (
            <li key={line.id}>
              <Link
                href={`/lignes/l${line.number}`}
                className="panel-soft flex items-center gap-4 p-4 transition hover:shadow-card-hover"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-lg font-bold text-white shadow-card"
                  style={{ backgroundColor: line.color }}
                >
                  {line.number}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{line.name}</p>
                  <p className="text-sm text-muted">
                    {line.stops.length} arrêt{line.stops.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/" className="font-medium text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
