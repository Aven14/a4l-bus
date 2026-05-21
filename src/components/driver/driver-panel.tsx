"use client";

import { useState } from "react";
import { useAudio } from "@/contexts/audio-context";
import { TRANSPORT_LINES, type LineDef } from "@/lib/transport-data";
import { cn } from "@/lib/utils";

export function DriverPanel() {
  const { playAnnouncement } = useAudio();
  const [selectedLine, setSelectedLine] = useState<LineDef | null>(null);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const handleAnnounce = (audioPath: string, label: string) => {
    playAnnouncement(audioPath, label);
    setLastTriggered(label);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="panel p-4">
        <h2 className="label-caps mb-3 text-primary">Lignes</h2>
        <div className="space-y-2">
          {TRANSPORT_LINES.map((line) => (
            <button
              key={line.number}
              type="button"
              onClick={() => setSelectedLine(line)}
              className={cn(
                "w-full rounded-md px-4 py-3 text-left shadow-card transition",
                selectedLine?.number === line.number
                  ? "bg-primary text-white shadow-elevated"
                  : "bg-surface text-ink hover:bg-primary-light/35 hover:shadow-card-hover"
              )}
            >
              <span className="text-lg font-bold">L{line.number}</span>
              <span className="mt-0.5 block truncate text-xs opacity-80">
                {line.name.replace(/^Ligne \d+ — /, "")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        {!selectedLine ? (
          <p className="py-16 text-center text-muted">
            Sélectionnez une ligne pour afficher les arrêts
          </p>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-ink">{selectedLine.name}</h2>
              <span
                className="rounded-md px-3 py-1 text-xs font-bold text-white shadow-card"
                style={{ backgroundColor: selectedLine.color }}
              >
                Ligne {selectedLine.number}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {selectedLine.stops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() =>
                    handleAnnounce(
                      stop.audioPath,
                      `Ligne ${selectedLine.number} — ${stop.name}`
                    )
                  }
                  className="group flex items-center gap-3 rounded-md bg-surface p-4 text-left shadow-card transition hover:shadow-card-hover"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm text-white group-hover:bg-primary-dark">
                    ▶
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{stop.name}</p>
                    <p className="text-xs text-muted">Annoncer l&apos;arrêt</p>
                  </div>
                </button>
              ))}
            </div>

            {lastTriggered && (
              <p className="mt-4 rounded-md bg-accent-light px-3 py-2 text-center text-sm text-accent shadow-card">
                Dernière annonce : {lastTriggered}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
