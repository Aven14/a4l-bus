"use client";

import { useState, useTransition } from "react";
import {
  loginAdmin,
  logoutAdmin,
  addLine,
  deleteLine,
  addStop,
  deleteStop,
  seedTransportLines,
} from "@/actions/admin";
import { deleteTicket } from "@/actions/tickets";
import { formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type LineWithStops = {
  id: string;
  number: number;
  name: string;
  color: string;
  stops: {
    id: string;
    name: string;
    slug: string;
    audioUrl: string;
    order: number;
  }[];
};

type TicketRow = {
  id: string;
  firstname: string;
  lastname: string;
  ticketType: string;
  createdAt: Date;
  expiresAt: Date;
};

type Stats = { total: number; active: number; expired: number };

export function AdminPanel({
  authenticated,
  lines,
  tickets,
  stats,
}: {
  authenticated: boolean;
  lines: LineWithStops[];
  tickets: TicketRow[];
  stats: Stats;
}) {
  const [authed, setAuthed] = useState(authenticated);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [lineNum, setLineNum] = useState("");
  const [lineName, setLineName] = useState("");
  const [lineColor, setLineColor] = useState("#E63946");
  const [stopLineId, setStopLineId] = useState("");
  const [stopName, setStopName] = useState("");
  const [stopSlug, setStopSlug] = useState("");
  const [stopAudio, setStopAudio] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await loginAdmin(password);
      if (res.success) {
        setAuthed(true);
        setMessage(null);
        window.location.reload();
      } else {
        setMessage(res.error ?? "Erreur");
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
      setAuthed(false);
      window.location.reload();
    });
  };

  if (!authed) {
    return (
      <form onSubmit={handleLogin} className="glass-card mx-auto max-w-sm p-8">
        <h2 className="mb-4 text-xl font-bold text-white">Accès Admin</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field mb-4"
          placeholder="Mot de passe admin"
          required
        />
        {message && <p className="mb-3 text-sm text-red-400">{message}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? <LoadingSpinner /> : "Connexion"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total billets" value={stats.total} />
          <StatCard label="Actifs" value={stats.active} accent />
          <StatCard label="Expirés" value={stats.expired} />
        </div>
        <button type="button" onClick={handleLogout} className="btn-secondary">
          Déconnexion
        </button>
      </div>

      <section className="glass-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">Lignes & arrêts</h2>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await seedTransportLines();
                setMessage(res.success ? "Lignes importées." : res.error ?? "Erreur");
                if (res.success) window.location.reload();
              })
            }
          >
            Importer lignes prédéfinies
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          <input
            type="number"
            placeholder="N°"
            value={lineNum}
            onChange={(e) => setLineNum(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Nom"
            value={lineName}
            onChange={(e) => setLineName(e.target.value)}
            className="input-field sm:col-span-2"
          />
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            className="input-field h-[42px] cursor-pointer p-1"
            title="Couleur de la ligne"
          />
          <button
            type="button"
            className="btn-primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await addLine(parseInt(lineNum, 10), lineName, lineColor);
                window.location.reload();
              })
            }
          >
            + Ligne
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={stopLineId}
            onChange={(e) => setStopLineId(e.target.value)}
            className="input-field"
          >
            <option value="">Ligne…</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                L{l.number} — {l.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nom arrêt"
            value={stopName}
            onChange={(e) => setStopName(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="slug"
            value={stopSlug}
            onChange={(e) => setStopSlug(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="/audio/line1/stop.mp3"
            value={stopAudio}
            onChange={(e) => setStopAudio(e.target.value)}
            className="input-field"
          />
          <button
            type="button"
            className="btn-primary"
            disabled={pending || !stopLineId}
            onClick={() =>
              startTransition(async () => {
                await addStop(stopLineId, stopName, stopSlug, stopAudio, 0);
                window.location.reload();
              })
            }
          >
            + Arrêt
          </button>
        </div>

        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.id} className="rounded-lg border border-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-white">
                  L{line.number} — {line.name}
                </span>
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteLine(line.id);
                      window.location.reload();
                    })
                  }
                >
                  Supprimer ligne
                </button>
              </div>
              <ul className="space-y-1 text-sm text-slate-400">
                {line.stops.map((stop) => (
                  <li key={stop.id} className="flex justify-between">
                    <span>
                      {stop.name} — <code className="text-xs">{stop.audioUrl}</code>
                    </span>
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-300"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteStop(stop.id);
                          window.location.reload();
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Billets actifs</h2>
        {tickets.length === 0 ? (
          <p className="text-slate-500">Aucun billet actif.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-500">
                  <th className="pb-2 pr-4">Passager</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Expire</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-white">
                      {t.firstname} {t.lastname}
                    </td>
                    <td className="py-2 pr-4">{t.ticketType}</td>
                    <td className="py-2 pr-4">{formatDate(t.expiresAt)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        className="text-red-400 hover:text-red-300"
                        onClick={() =>
                          startTransition(async () => {
                            await deleteTicket(t.id);
                            window.location.reload();
                          })
                        }
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {message && (
        <p className="text-center text-sm text-accent">{message}</p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="glass-card p-4 text-center">
      <p className={`text-2xl font-bold ${accent ? "text-accent" : "text-white"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
