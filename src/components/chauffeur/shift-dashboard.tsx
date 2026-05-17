"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startShift, endShift } from "@/actions/shifts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils";

type LineRow = {
  id: string;
  number: number;
  name: string;
  color: string;
  isOccupied: boolean;
  occupiedBy: { firstname: string; lastname: string } | null;
};

type Shift = {
  id: string;
  startedAt: Date;
  line: {
    id: string;
    number: number;
    name: string;
    color: string;
    stops: { id: string; name: string; order: number }[];
  };
};

export function ShiftDashboard({
  lines,
  myShift,
}: {
  lines: LineRow[];
  myShift: Shift | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleStart = (lineId: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await startShift(lineId);
      if (res.success) router.refresh();
      else setMessage(res.error ?? "Erreur");
    });
  };

  const handleEnd = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await endShift();
      if (res.success) router.refresh();
      else setMessage(res.error ?? "Erreur");
    });
  };

  if (myShift) {
    return (
      <div className="space-y-6">
        <div className="panel-highlight p-6">
          <p className="label-caps text-primary">Service en cours</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">
            Ligne {myShift.line.number} — {myShift.line.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Début : {formatDate(myShift.startedAt)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/chauffeur/annonces" className="btn-primary">
              Annonces arrêts ({myShift.line.stops.length})
            </Link>
            <Link href="/chauffeur/billets" className="btn-secondary">
              Émettre un billet
            </Link>
            <button
              type="button"
              onClick={handleEnd}
              disabled={pending}
              className="rounded-xl border-2 border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent-light"
            >
              {pending ? <LoadingSpinner /> : "Terminer le service"}
            </button>
          </div>
        </div>
        {message && <p className="text-center text-sm text-accent">{message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted">Choisissez une ligne pour prendre votre service.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {lines.map((line) => (
          <button
            key={line.id}
            type="button"
            disabled={line.isOccupied || pending}
            onClick={() => handleStart(line.id)}
            className="panel-soft p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
                style={{ backgroundColor: line.color }}
              >
                {line.number}
              </span>
              <div>
                <p className="font-semibold text-ink">{line.name}</p>
                {line.isOccupied ? (
                  <p className="text-xs text-accent">
                    Prise par {line.occupiedBy?.firstname} {line.occupiedBy?.lastname}
                  </p>
                ) : (
                  <p className="text-xs text-primary">Disponible</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      {lines.length === 0 && (
        <p className="text-center text-muted">
          Aucune ligne configurée. Contactez l&apos;administrateur.
        </p>
      )}
      {message && <p className="text-center text-sm text-accent">{message}</p>}
    </div>
  );
}
