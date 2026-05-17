"use client";

import { useAudio } from "@/contexts/audio-context";

export function AnnouncementOverlay() {
  const { isAnnouncing, announcementLabel } = useAudio();

  if (!isAnnouncing) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="panel-highlight announce-blink mx-4 max-w-md p-8 text-center">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
          LIVE
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-ink">
          Annonce en cours
        </h2>
        {announcementLabel && (
          <p className="mt-2 text-primary font-medium">{announcementLabel}</p>
        )}

        <div className="mt-6 flex h-10 items-end justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="audio-bar w-1.5"
              style={{ height: "35%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
