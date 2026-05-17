"use client";

import { useAudio } from "@/contexts/audio-context";

type Stop = {
  id: string;
  name: string;
  audioUrl: string;
  order: number;
};

export function AnnouncementPanel({
  lineNumber,
  lineName,
  stops,
}: {
  lineNumber: number;
  lineName: string;
  stops: Stop[];
}) {
  const { queueAnnouncement, isAnnouncing } = useAudio();

  return (
    <div className="space-y-4">
      <p className="text-muted">
        Ligne {lineNumber} — {lineName}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {stops.map((stop, index) => (
          <button
            key={stop.id}
            type="button"
            disabled={isAnnouncing}
            onClick={() =>
              queueAnnouncement(
                stop.audioUrl,
                `Arrêt ${index + 1} — ${stop.name}`
              )
            }
            className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 text-left transition hover:border-primary hover:bg-primary-light/30 disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{stop.name}</p>
              <p className="text-xs text-muted">Annoncer</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
