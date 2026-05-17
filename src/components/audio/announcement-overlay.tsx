"use client";

import { useAudio } from "@/contexts/audio-context";

export function AnnouncementOverlay() {
  const { isAnnouncing, announcementLabel } = useAudio();

  if (!isAnnouncing) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/70 backdrop-blur-sm pointer-events-none">
      <div className="glass-card glass-card-accent announce-active mx-4 max-w-md p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-accent">
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </div>
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-accent animate-pulse">
          Annonce en cours
        </p>
        <h2 className="mb-4 text-xl font-bold text-white">
          ANNOUNCEMENT IN PROGRESS
        </h2>
        {announcementLabel && (
          <p className="mb-4 text-slate-300">{announcementLabel}</p>
        )}

        <div className="flex h-12 items-end justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="audio-bar w-1.5 rounded-full bg-accent"
              style={{ height: "40%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
