"use client";

import { useState, useTransition } from "react";
import { createTicket } from "@/actions/tickets";
import { TICKET_TYPES } from "@/lib/transport-data";
import { formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function TicketForm() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [ticketType, setTicketType] = useState(TICKET_TYPES[0].value);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    id: string;
    firstname: string;
    lastname: string;
    ticketType: string;
    expiresAt: Date;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreated(null);

    startTransition(async () => {
      const result = await createTicket(firstname, lastname, ticketType);
      if (result.success && result.ticket) {
        setCreated(result.ticket);
        setFirstname("");
        setLastname("");
      } else {
        setError(result.error ?? "Erreur inconnue");
      }
    });
  };

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Prénom</label>
          <input
            type="text"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            className="input-field"
            placeholder="Jean"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Nom</label>
          <input
            type="text"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            className="input-field"
            placeholder="Dupont"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Type de billet</label>
          <select
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value as typeof ticketType)}
            className="input-field"
          >
            {TICKET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} — {t.value}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? <LoadingSpinner /> : "Créer le billet"}
        </button>
      </form>

      {created && (
        <div className="glass-card glass-card-accent mt-4 p-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">
            Billet créé
          </p>
          <p className="text-white">
            <strong>
              {created.firstname} {created.lastname}
            </strong>
          </p>
          <p className="text-slate-400">{created.ticketType}</p>
          <p className="mt-2 text-sm text-slate-500">
            Expire le {formatDate(created.expiresAt)}
          </p>
        </div>
      )}
    </div>
  );
}
