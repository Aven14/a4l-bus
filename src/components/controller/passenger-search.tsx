"use client";

import { useState, useTransition } from "react";
import { searchTicket } from "@/actions/tickets";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function PassengerSearch() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchTicket>> | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await searchTicket(firstname, lastname);
      setResult(res);
    });
  };

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSearch} className="panel mb-6 flex flex-wrap gap-3 p-6">
        <input
          type="text"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          className="input-field min-w-[120px] flex-1"
          placeholder="Prénom"
          required
        />
        <input
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          className="input-field min-w-[120px] flex-1"
          placeholder="Nom"
          required
        />
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <LoadingSpinner /> : "Vérifier"}
        </button>
      </form>

      {result && (
        <div className="panel p-6">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
            <h3 className="text-lg font-bold text-ink">
              Résultat
            </h3>
            <StatusBadge status={result.status} />
          </div>

          {result.ticket ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="label-caps">Passager</dt>
                <dd className="font-medium text-primary">
                  {result.ticket.firstname} {result.ticket.lastname}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="label-caps">Type</dt>
                <dd>{result.ticket.ticketType}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="label-caps">Créé le</dt>
                <dd>{formatDate(result.ticket.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="label-caps">Expire le</dt>
                <dd>{formatDate(result.ticket.expiresAt)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted">Aucun billet trouvé pour ce passager.</p>
          )}
        </div>
      )}
    </div>
  );
}
