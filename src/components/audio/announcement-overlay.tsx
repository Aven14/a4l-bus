"use client";

import { useAudio } from "@/contexts/audio-context";

export function AnnouncementOverlay() {
  const { isAnnouncing, announcementLabel } = useAudio();

  if (!isAnnouncing) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-surface/85">
      <div className="panel-highlight mx-4 max-w-md p-8 text-center">
        <p className="label-caps announce-blink mb-2 text-signal">Annonce en cours</p>
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-track">
          Message passagers
        </h2>
        {announcementLabel && (
          <p className="mt-3 text-muted">{announcementLabel}</p>
        )}

        <div className="mt-6 flex h-10 items-end justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="audio-bar w-1"
              style={{ height: "35%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
