"use client";

import { useState } from "react";
import { useAudio } from "@/contexts/audio-context";
import { TRANSPORT_LINES, type LineDef } from "@/lib/transport-data";
import { cn } from "@/lib/utils";

export function DriverPanel() {
  const { queueAnnouncement, isAnnouncing } = useAudio();
  const [selectedLine, setSelectedLine] = useState<LineDef | null>(null);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const handleAnnounce = (audioPath: string, label: string) => {
    queueAnnouncement(audioPath, label);
    setLastTriggered(label);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="panel p-4">
        <h2 className="label-caps mb-3">Lignes</h2>
        <div className="space-y-1">
          {TRANSPORT_LINES.map((line) => (
            <button
              key={line.number}
              type="button"
              onClick={() => setSelectedLine(line)}
              className={cn(
                "w-full border-2 px-3 py-2.5 text-left transition",
                selectedLine?.number === line.number
                  ? "border-track bg-track text-surface"
                  : "border-line bg-surface text-track hover:border-track"
              )}
            >
              <span className="font-display text-lg font-extrabold">
                L{line.number}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {line.name.replace(/^Ligne \d+ — /, "")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        {!selectedLine ? (
          <p className="py-16 text-center text-muted">
            Sélectionnez une ligne
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <h2 className="font-display text-lg font-bold uppercase text-track">
                {selectedLine.name}
              </h2>
              <span
                className="font-display px-3 py-1 text-xs font-bold uppercase text-surface"
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
                  disabled={isAnnouncing}
                  onClick={() =>
                    handleAnnounce(
                      stop.audioPath,
                      `Ligne ${selectedLine.number} — ${stop.name}`
                    )
                  }
                  className="group flex items-center gap-3 border-2 border-line bg-surface p-4 text-left transition hover:border-track hover:shadow-[3px_3px_0_var(--color-track)] disabled:opacity-40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-track bg-canvas font-display text-xs font-bold text-track group-hover:bg-track group-hover:text-surface">
                    ▶
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold uppercase text-track">
                      {stop.name}
                    </p>
                    <p className="label-caps mt-0.5">Annoncer</p>
                  </div>
                </button>
              ))}
            </div>

            {lastTriggered && (
              <p className="label-caps mt-4 border-t border-line pt-4 text-center">
                Dernière : {lastTriggered}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
