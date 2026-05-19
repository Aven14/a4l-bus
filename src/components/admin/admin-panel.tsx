"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  addLine,
  deleteLine,
  addStop,
  deleteStop,
  updateStop,
  seedTransportLines,
} from "@/actions/admin";
import { deleteTicket, cancelTicket, cleanupExpiredTickets } from "@/actions/tickets";
import { UsersPanel } from "@/components/admin/users-panel";
import { Dashboard } from "@/components/admin/admin-dashboard";
import { formatDate } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

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

type UserRow = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  roles: UserRole[];
  createdAt: Date;
};

type LogStats = {
  loginsByDay: Array<{ date: Date; count: bigint }>;
  ticketsByDay: Array<{ date: Date; count: bigint }>;
  ticketsByType: Array<{ ticketType: string; _count: number }>;
  usersByRole: Array<{ roles: string[]; _count: number }>;
  radioActivations: number;
};

type ActivityLog = {
  id: string;
  userId: string | null;
  user: { firstname: string; lastname: string; email: string } | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: Date;
};

export function AdminPanel({
  lines,
  tickets,
  users,
  logStats,
  logs,
}: {
  lines: LineWithStops[];
  tickets: TicketRow[];
  users: UserRow[];
  logStats: LogStats | null;
  logs: ActivityLog[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [lineNum, setLineNum] = useState("");
  const [lineName, setLineName] = useState("");
  const [lineColor, setLineColor] = useState("#E63946");
  const [stopLineId, setStopLineId] = useState("");
  const [stopName, setStopName] = useState("");
  const [stopAudio, setStopAudio] = useState("");

  // États pour l'édition d'arrêts
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [editStopName, setEditStopName] = useState("");
  const [editStopAudio, setEditStopAudio] = useState("");
  const [editStopOrder, setEditStopOrder] = useState(0);

  // Tab principal - lire depuis l'URL si disponible
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as "dashboard" | "lines" | "tickets" | "users") || "lines";
  const [mainTab, setMainTab] = useState<"dashboard" | "lines" | "tickets" | "users">(initialTab);

  // Mettre à jour l'URL quand on change d'onglet
  useEffect(() => {
    router.replace(`/admin?tab=${mainTab}`, { scroll: false });
  }, [mainTab, router]);

  const tabs = [
    { key: "dashboard" as const, label: "Dashboard" },
    { key: "lines" as const, label: "Lignes & Arrêts" },
    { key: "tickets" as const, label: "Billets" },
    { key: "users" as const, label: "Utilisateurs" },
  ];

  return (
    <div className="space-y-8">
      {/* Navigation principale */}
      <div className="flex gap-2 border-b border-line pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`rounded-md px-4 py-2 font-medium transition ${
              mainTab === tab.key
                ? "bg-primary text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === "dashboard" && <Dashboard stats={logStats} logs={logs} />}

      {mainTab === "lines" && (
      <section className="panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-primary">Lignes & arrêts</h2>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await seedTransportLines();
                setMessage(res.success ? "Lignes importées." : res.error ?? "Erreur");
                if (res.success) window.location.href = `/admin?tab=${mainTab}`;
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
                window.location.href = `/admin?tab=${mainTab}`;
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
            className="input-field sm:col-span-2"
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
                // Générer le slug automatiquement depuis le nom
                const slug = stopName
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
                
                // Calculer le prochain ordre automatiquement
                const selectedLine = lines.find(l => l.id === stopLineId);
                const nextOrder = selectedLine ? selectedLine.stops.length : 0;
                
                await addStop(stopLineId, stopName, slug, stopAudio, nextOrder);
                window.location.href = `/admin?tab=${mainTab}`;
              })
            }
          >
            + Arrêt
          </button>
        </div>

        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.id} className="rounded-md bg-canvas/80 p-4 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-primary">
                  L{line.number} — {line.name}
                </span>
                <button
                  type="button"
                  className="text-xs text-accent hover:opacity-80"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteLine(line.id);
                      window.location.href = `/admin?tab=${mainTab}`;
                    })
                  }
                >
                  Supprimer ligne
                </button>
              </div>
              <ul className="space-y-2 text-sm text-muted">
                {line.stops.map((stop) => (
                  <li key={stop.id} className="rounded-md bg-surface p-3 shadow-card">
                    {editingStopId === stop.id ? (
                      // Mode édition
                      <div className="space-y-2">
                        <div className="grid gap-2 sm:grid-cols-4">
                          <input
                            type="text"
                            value={editStopName}
                            onChange={(e) => setEditStopName(e.target.value)}
                            className="input-field sm:col-span-2"
                            placeholder="Nom"
                          />
                          <input
                            type="text"
                            value={editStopAudio}
                            onChange={(e) => setEditStopAudio(e.target.value)}
                            className="input-field"
                            placeholder="Audio"
                          />
                          <input
                            type="number"
                            value={editStopOrder}
                            onChange={(e) => setEditStopOrder(parseInt(e.target.value))}
                            className="input-field"
                            placeholder="Ordre"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-primary text-xs"
                            onClick={() =>
                              startTransition(async () => {
                                const slug = editStopName
                                  .toLowerCase()
                                  .normalize("NFD")
                                  .replace(/[\u0300-\u036f]/g, "")
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/^-|-$/g, "");
                                await updateStop(stop.id, {
                                  name: editStopName,
                                  slug,
                                  audioUrl: editStopAudio,
                                  order: editStopOrder,
                                });
                                setEditingStopId(null);
                                window.location.href = `/admin?tab=${mainTab}`;
                              })
                            }
                          >
                            ✓ Sauvegarder
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-xs"
                            onClick={() => setEditingStopId(null)}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Mode affichage
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium text-ink">{stop.name}</span>
                          <div className="mt-1 flex gap-3 text-xs">
                            <span className="text-muted">
                              Ordre : {stop.order}
                            </span>
                            <code className="text-primary">{stop.audioUrl}</code>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-primary hover:opacity-80"
                            onClick={() => {
                              setEditingStopId(stop.id);
                              setEditStopName(stop.name);
                              setEditStopAudio(stop.audioUrl);
                              setEditStopOrder(stop.order);
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            type="button"
                            className="text-accent hover:opacity-80"
                            onClick={() =>
                              startTransition(async () => {
                                await deleteStop(stop.id);
                                window.location.href = `/admin?tab=${mainTab}`;
                              })
                            }
                          >
                            × Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      )}

      {mainTab === "tickets" && (
      <section className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Titres de transport</h2>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await cleanupExpiredTickets();
                setMessage(result.success ? `${result.count} billets supprimés.` : result.error ?? "Erreur");
                if (result.success) window.location.href = `/admin?tab=${mainTab}`;
              })
            }
          >
            Nettoyer expirés (+7 jours)
          </button>
        </div>
        {tickets.length === 0 ? (
          <p className="text-muted">Aucun billet actif.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 pr-4">Passager</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Expire</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-line">
                    <td className="py-2 pr-4 text-primary">
                      {t.firstname} {t.lastname}
                    </td>
                    <td className="py-2 pr-4">{t.ticketType}</td>
                    <td className="py-2 pr-4">{formatDate(t.expiresAt)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        className="text-yellow-600 hover:opacity-80 mr-3"
                        onClick={() =>
                          startTransition(async () => {
                            await cancelTicket(t.id);
                            window.location.href = `/admin?tab=${mainTab}`;
                          })
                        }
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="text-accent hover:opacity-80"
                        onClick={() =>
                          startTransition(async () => {
                            await deleteTicket(t.id);
                            window.location.href = `/admin?tab=${mainTab}`;
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
      )}

      {mainTab === "users" && <UsersPanel users={users} />}

      {message && (
        <p className="text-center text-sm text-primary">{message}</p>
      )}
    </div>
  );
}
