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
      <form onSubmit={handleSearch} className="glass-card mb-6 flex flex-wrap gap-3 p-6">
        <input
          type="text"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          className="input-field flex-1 min-w-[120px]"
          placeholder="Prénom"
          required
        />
        <input
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          className="input-field flex-1 min-w-[120px]"
          placeholder="Nom"
          required
        />
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <LoadingSpinner /> : "Vérifier"}
        </button>
      </form>

      {result && (
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Résultat</h3>
            <StatusBadge status={result.status} />
          </div>

          {result.ticket ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-slate-500">Passager</dt>
                <dd className="font-medium text-white">
                  {result.ticket.firstname} {result.ticket.lastname}
                </dd>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-slate-500">Type</dt>
                <dd className="text-white">{result.ticket.ticketType}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-slate-500">Créé le</dt>
                <dd className="text-white">{formatDate(result.ticket.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Expire le</dt>
                <dd className="text-white">{formatDate(result.ticket.expiresAt)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-slate-400">
              Aucun billet trouvé pour ce passager.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
