"use client";

import { useState, useTransition } from "react";
import { getAllTickets } from "@/actions/tickets";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

type TicketRow = {
  id: string;
  firstname: string;
  lastname: string;
  ticketType: string;
  createdAt: Date;
  expiresAt: Date;
};

function ticketStatus(expiresAt: Date): "valid" | "expired" {
  return new Date(expiresAt) > new Date() ? "valid" : "expired";
}

export function TicketsList({ initialTickets }: { initialTickets: TicketRow[] }) {
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState(initialTickets);
  const [pending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const results = await getAllTickets(query);
      setTickets(results);
    });
  };

  const reset = () => {
    setQuery("");
    startTransition(async () => {
      setTickets(await getAllTickets());
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="panel flex flex-wrap gap-3 p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher prénom ou nom..."
          className="input-field min-w-[200px] flex-1"
        />
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "..." : "Rechercher"}
        </button>
        <button type="button" className="btn-secondary" onClick={reset}>
          Réinitialiser
        </button>
      </form>

      <p className="text-sm text-muted">{tickets.length} billet(s)</p>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left">
                <th className="px-4 py-3 font-semibold text-muted">Passager</th>
                <th className="px-4 py-3 font-semibold text-muted">Type</th>
                <th className="px-4 py-3 font-semibold text-muted">Créé</th>
                <th className="px-4 py-3 font-semibold text-muted">Expire</th>
                <th className="px-4 py-3 font-semibold text-muted">Statut</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {t.firstname} {t.lastname}
                  </td>
                  <td className="px-4 py-3">{t.ticketType}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(t.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticketStatus(t.expiresAt)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tickets.length === 0 && (
          <p className="p-8 text-center text-muted">Aucun billet trouvé.</p>
        )}
      </div>
    </div>
  );
}
