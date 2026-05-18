"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateTrackingPosition } from "@/actions/tracking";

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
    shiftId: string;
    currentStopId: string | null;
    destinationStopId: string | null;
  };
};

export function LiveTrackingClient({ initialData }: LiveTrackingClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [currentStopId, setCurrentStopId] = useState<string | null>(initialData.currentStopId);
  const [destinationStopId, setDestinationStopId] = useState<string | null>(initialData.destinationStopId);
  const [message, setMessage] = useState<string | null>(null);

  const { line, shiftId } = initialData;

  // Trouver les index des arrêts actuels
  const currentIndex = line.stops.findIndex((s) => s.id === currentStopId);
  const destIndex = line.stops.findIndex((s) => s.id === destinationStopId);

  // Actualisation automatique toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const handleStopClick = async (stopId: string) => {
    if (pending) return;
    setPending(true);
    setMessage(null);

    try {
      const result = await updateTrackingPosition(shiftId, stopId);
      
      if (result.success) {
        // Logique de suivi : premier clic = arrêt actuel, second = destination
        if (!currentStopId) {
          setCurrentStopId(stopId);
          setMessage("Position actuelle définie");
        } else if (!destinationStopId || destinationStopId === stopId) {
          setDestinationStopId(stopId);
          setMessage(`En direction de ${line.stops.find(s => s.id === stopId)?.name}`);
        } else {
          // Reset et nouveau départ
          setCurrentStopId(stopId);
          setDestinationStopId(null);
          setMessage("Nouvelle position actuelle");
        }
        
        router.refresh();
      } else {
        setMessage(result.error ?? "Erreur");
      }
    } finally {
      setPending(false);
    }
  };

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

      {/* Indicateur de direction */}
      {destIndex > currentIndex && currentIndex >= 0 && (
        <div className="panel-soft bg-gradient-to-r from-primary-light to-white p-4 text-center">
          <p className="text-sm font-semibold text-primary">
            En direction de{" "}
            <span className="text-lg font-bold">{line.stops[destIndex]?.name}</span>
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="text-center text-sm font-medium text-primary">{message}</p>
      )}

      {/* Liste des arrêts avec suivi */}
      <div className="space-y-0">
        {line.stops.map((stop, index) => {
          const isCurrent = stop.id === currentStopId;
          const isDestination = stop.id === destinationStopId;
          const isPassed = currentIndex > index;
          const isNext = index === currentIndex + 1;

          return (
            <div key={stop.id}>
              <button
                onClick={() => handleStopClick(stop.id)}
                disabled={pending}
                className={`w-full text-left transition disabled:cursor-not-allowed ${
                  isCurrent || isDestination
                    ? "panel-highlight shadow-elevated"
                    : "panel-soft hover:shadow-card-hover"
                } ${isPassed ? "opacity-60" : ""} p-4`}
              >
                <div className="flex items-center gap-4">
                  {/* Numéro d'arrêt */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold transition ${
                      isCurrent
                        ? "bg-primary text-white scale-110 shadow-elevated"
                        : isDestination
                        ? "bg-accent text-white scale-110 shadow-elevated"
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
                          : isDestination
                          ? "text-xl text-accent"
                          : "text-ink"
                      }`}
                    >
                      {stop.name}
                    </p>
                    {isCurrent && (
                      <p className="mt-1 text-sm font-medium text-primary animate-pulse">
                        ● Arrêt actuel
                      </p>
                    )}
                    {isDestination && (
                      <p className="mt-1 text-sm font-medium text-accent animate-pulse">
                        🎯 Destination
                      </p>
                    )}
                    {isPassed && (
                      <p className="mt-1 text-xs text-muted">✓ Passé</p>
                    )}
                  </div>

                  {/* Indicateur visuel */}
                  {isNext && !isCurrent && (
                    <div className="text-xs font-semibold text-primary">Prochain →</div>
                  )}
                </div>
              </button>

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
          💡 <strong>Instructions :</strong> Cliquez sur un arrêt pour mettre à jour votre position.
          Le premier arrêt sélectionné devient votre position actuelle. Le second devient votre destination.
        </p>
      </div>
    </div>
  );
}
