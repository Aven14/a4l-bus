"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Stop = {
  id: string;
  name: string;
  order: number;
};

type LineData = {
  id: string;
  number: number;
  name: string;
  color: string;
  driver: string;
  stops: Stop[];
};

type LiveTrackingClientProps = {
  initialData: {
    line: LineData;
    currentStopId: string | null;
  };
};

export function LiveTrackingClient({ initialData }: LiveTrackingClientProps) {
  const router = useRouter();
  const { currentStopId } = initialData;

  const { line } = initialData;

  // Trouver l'index de l'arrêt actuel
  const currentIndex = line.stops.findIndex((s) => s.id === currentStopId);

  // Actualisation automatique toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-6">
      {/* En-tête de la ligne */}
      <div className="panel-highlight p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold text-white shadow-elevated"
            style={{ backgroundColor: line.color }}
          >
            {line.number}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-ink">{line.name}</h2>
            <p className="text-sm text-muted">Chauffeur : {line.driver}</p>
          </div>
          <Link href="/chauffeur" className="btn-secondary text-sm">
            ← Retour
          </Link>
        </div>
      </div>

      {/* Indicateur de position */}
      {currentIndex === 0 && (
        <div className="panel-soft bg-gradient-to-r from-primary-light to-white p-4 text-center">
          <p className="text-sm font-semibold text-primary">
            🚌 Bus actuellement au départ : <span className="text-lg font-bold">{line.stops[0]?.name}</span>
          </p>
        </div>
      )}

      {/* Liste des arrêts avec suivi */}
      <div className="space-y-0">
        {line.stops.map((stop, index) => {
          const isCurrent = stop.id === currentStopId;
          const isPassed = currentStopId && line.stops.findIndex((s) => s.id === currentStopId) > index;

          return (
            <div key={stop.id}>
              <div
                className={`panel-soft p-4 ${
                  isCurrent
                    ? "panel-highlight shadow-elevated"
                    : isPassed
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Numéro d'arrêt */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold transition ${
                      isCurrent
                        ? "bg-primary text-white scale-110 shadow-elevated"
                        : isPassed
                        ? "bg-gray-200 text-gray-500"
                        : "bg-primary-light text-primary"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Nom de l'arrêt */}
                  <div className="flex-1">
                    <p
                      className={`font-semibold transition ${
                        isCurrent
                          ? "text-xl text-primary"
                          : "text-ink"
                      }`}
                    >
                      {stop.name}
                    </p>
                    {isPassed && (
                      <p className="mt-1 text-xs text-muted">✓ Passé</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Flèche entre les arrêts */}
              {index < line.stops.length - 1 && (
                <div className="flex justify-center py-2">
                  <svg
                    className={`h-6 w-6 transition ${
                      isPassed || isCurrent ? "text-primary" : "text-muted"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="panel-soft bg-accent-light/50 p-4 text-center">
        <p className="text-sm text-muted">
          💡 Le chauffeur met à jour sa position en annonçant les arrêts depuis son espace.
        </p>
      </div>
    </div>
  );
}
