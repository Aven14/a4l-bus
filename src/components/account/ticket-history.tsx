"use client";

import { formatDate } from "@/lib/utils";

type Ticket = {
  id: string;
  firstname: string;
  lastname: string;
  ticketType: string;
  createdAt: Date;
  expiresAt: Date | null;
  cancelled: boolean;
  cancelledAt: Date | null;
};

export function TicketHistory({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-muted">Aucun titre de transport trouvé.</p>
        <p className="mt-2 text-sm text-muted">
          Les chauffeurs peuvent vous créer un titre de transport.
        </p>
      </div>
    );
  }

  const activeTickets = tickets.filter(
    (t) =>
      !t.cancelled && (!t.expiresAt || new Date(t.expiresAt) > new Date())
  );
  const expiredTickets = tickets.filter(
    (t) => t.cancelled || (t.expiresAt && new Date(t.expiresAt) <= new Date())
  );

  return (
    <div className="space-y-6">
      {/* Titres actifs */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-primary">
          Titres actifs ({activeTickets.length})
        </h2>
        {activeTickets.length === 0 ? (
          <p className="text-muted">Aucun titre actif.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="panel-highlight rounded-md bg-surface p-4 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">
                      {ticket.firstname} {ticket.lastname}
                    </p>
                    <p className="text-sm text-primary font-medium">
                      {getTicketLabel(ticket.ticketType)}
                    </p>
                  </div>
                  {ticket.ticketType === "Lifetime Pass" && (
                    <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800">
                      ∞ ILLIMITÉ
                    </span>
                  )}
                </div>
                <div className="mt-3 text-xs text-muted">
                  <p>Créé le {formatDate(ticket.createdAt)}</p>
                  {ticket.expiresAt ? (
                    <p>Expire le {formatDate(ticket.expiresAt)}</p>
                  ) : (
                    <p className="text-green-600 font-medium">
                      Valable indéfiniment
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historique */}
      {expiredTickets.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-muted">
            Historique ({expiredTickets.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Créé le</th>
                  <th className="pb-2 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {expiredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-line opacity-60">
                    <td className="py-2 pr-4">
                      {getTicketLabel(ticket.ticketType)}
                    </td>
                    <td className="py-2 pr-4">{formatDate(ticket.createdAt)}</td>
                    <td className="py-2">
                      {ticket.cancelled ? (
                        <span className="text-accent">Annulé</span>
                      ) : (
                        <span className="text-muted">Expiré</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function getTicketLabel(type: string): string {
  const labels: Record<string, string> = {
    "Single Trip": "Trajet unique",
    "Day Pass": "Pass journée",
    "Week Pass": "Pass semaine",
    "Lifetime Pass": "Pass illimité",
  };
  return labels[type] || type;
}
