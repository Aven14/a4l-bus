"use client";

import { useState } from "react";
import { useAudio } from "@/contexts/audio-context";
import { TRANSPORT_LINES, type LineDef } from "@/lib/transport-data";

export function DriverPanel() {
  const { queueAnnouncement, isAnnouncing } = useAudio();
  const [selectedLine, setSelectedLine] = useState<LineDef | null>(null);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const handleAnnounce = (audioPath: string, label: string) => {
    queueAnnouncement(audioPath, label);
    setLastTriggered(label);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="glass-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Lignes
        </h2>
        <div className="space-y-2">
          {TRANSPORT_LINES.map((line) => (
            <button
              key={line.number}
              type="button"
              onClick={() => setSelectedLine(line)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                selectedLine?.number === line.number
                  ? "border-accent/50 bg-accent/10 text-white"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <span className="font-bold">L{line.number}</span>
              <span className="mt-0.5 block text-xs text-slate-500 truncate">
                {line.name.replace(/^Ligne \d+ — /, "")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        {!selectedLine ? (
          <p className="py-12 text-center text-slate-500">
            Sélectionnez une ligne pour afficher les arrêts
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {selectedLine.name}
              </h2>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-white"
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
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/50 p-4 text-left transition hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent transition group-hover:bg-accent group-hover:text-white">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{stop.name}</p>
                    <p className="text-xs text-slate-500">Annoncer l&apos;arrêt</p>
                  </div>
                </button>
              ))}
            </div>

            {lastTriggered && (
              <p className="mt-4 text-center text-sm text-accent">
                Dernière annonce : {lastTriggered}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
