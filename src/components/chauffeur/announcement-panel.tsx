"use client";

import { useState } from "react";
import { announceStop } from "@/actions/shifts";

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
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAnnounce = async (stop: Stop, index: number) => {
    setPending(stop.id);
    setMessage(null);

    const label = `Arrêt ${index + 1} — ${stop.name}`;

    // Diffuser l'annonce à tous les onglets via BroadcastChannel
    const channel = new BroadcastChannel("crossbus-announcements");
    channel.postMessage({
      audioPath: stop.audioUrl,
      label,
    });
    channel.close();

    // Mettre à jour la position du chauffeur
    const result = await announceStop(stop.id);
    
    if (result.success) {
      setMessage(`✓ Annonce diffusée : ${label}`);
    }

    setPending(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-muted">
        Ligne {lineNumber} — {lineName}
      </p>
      
      {message && (
        <div className="rounded-md bg-primary-light p-3 text-center text-sm font-medium text-primary">
          {message}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {stops.map((stop, index) => (
          <button
            key={stop.id}
            type="button"
            disabled={pending === stop.id}
            onClick={() => handleAnnounce(stop, index)}
            className="flex items-center gap-4 rounded-md bg-surface p-4 text-left shadow-card transition hover:shadow-card-hover disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white shadow-card">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{stop.name}</p>
              <p className="text-xs text-muted">
                {pending === stop.id ? "Annonce en cours..." : "Annoncer"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
