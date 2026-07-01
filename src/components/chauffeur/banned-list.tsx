"use client";

import { useState, useTransition } from "react";
import { getActiveBans, type BanRow } from "@/actions/bans";
import { formatDate } from "@/lib/utils";

export function BannedList({ initialBans }: { initialBans: BanRow[] }) {
  const [query, setQuery] = useState("");
  const [bans, setBans] = useState(initialBans);
  const [pending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setBans(await getActiveBans(query));
    });
  };

  const reset = () => {
    setQuery("");
    startTransition(async () => {
      setBans(await getActiveBans());
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="panel flex flex-wrap gap-3 p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par prénom ou nom..."
          className="input-field min-w-[200px] flex-1"
        />
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "..." : "Rechercher"}
        </button>
        <button type="button" className="btn-secondary" onClick={reset}>
          Réinitialiser
        </button>
      </form>

      <p className="text-sm text-muted">{bans.length} personne(s) bannie(s)</p>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left">
                <th className="px-4 py-3 font-semibold text-muted">Passager</th>
                <th className="px-4 py-3 font-semibold text-muted">Motif</th>
                <th className="px-4 py-3 font-semibold text-muted">Banni le</th>
                <th className="px-4 py-3 font-semibold text-muted">Par</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr key={ban.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {ban.firstname} {ban.lastname}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {ban.reason || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(ban.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {ban.bannedBy.firstname} {ban.bannedBy.lastname}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bans.length === 0 && (
          <p className="p-8 text-center text-muted">
            Aucune personne bannie pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
