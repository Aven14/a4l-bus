"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatDate } from "@/lib/utils";

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

const COLORS = ["#1d4ed8", "#E63946", "#2A9D8F", "#F4A261", "#9B5DE5"];

export function Dashboard({
  stats,
  logs,
}: {
  stats: LogStats | null;
  logs: ActivityLog[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");

  const loginData =
    stats?.loginsByDay.map((d) => ({
      date: formatDate(new Date(d.date)),
      connexions: Number(d.count),
    })) || [];

  const ticketData =
    stats?.ticketsByDay.map((d) => ({
      date: formatDate(new Date(d.date)),
      billets: Number(d.count),
    })) || [];

  const ticketTypeData =
    stats?.ticketsByType.map((t) => ({
      type: getTicketLabel(t.ticketType),
      count: t._count,
    })) || [];

  const roleData =
    stats?.usersByRole.map((u) => ({
      role: u.roles.map((r) => getRoleLabel(r)).join(", "),
      count: u._count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`rounded-md px-4 py-2 font-medium transition ${
            activeTab === "overview"
              ? "bg-primary text-white"
              : "bg-surface text-muted hover:text-ink"
          }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`rounded-md px-4 py-2 font-medium transition ${
            activeTab === "logs"
              ? "bg-primary text-white"
              : "bg-surface text-muted hover:text-ink"
          }`}
        >
          Logs d'activité
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          {/* Stats rapides */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Connexions (7j)"
              value={loginData.reduce((sum, d) => sum + d.connexions, 0)}
            />
            <StatCard
              label="Billets créés (7j)"
              value={ticketData.reduce((sum, d) => sum + d.billets, 0)}
            />
            <StatCard
              label="Activations radio (7j)"
              value={stats?.radioActivations || 0}
            />
            <StatCard
              label="Total utilisateurs"
              value={roleData.reduce((sum, d) => sum + d.count, 0)}
            />
          </div>

          {/* Graphiques */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Connexions */}
            <div className="panel p-4">
              <h3 className="mb-4 text-sm font-bold text-primary">
                Connexions au site (7 derniers jours)
              </h3>
              {loginData.length === 0 ? (
                <p className="text-center text-muted">Pas encore de données</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={loginData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="connexions"
                      stroke="#1d4ed8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Billets créés */}
            <div className="panel p-4">
              <h3 className="mb-4 text-sm font-bold text-primary">
                Billets créés (7 derniers jours)
              </h3>
              {ticketData.length === 0 ? (
                <p className="text-center text-muted">Pas encore de données</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ticketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="billets" fill="#2A9D8F" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Répartition des billets */}
            <div className="panel p-4">
              <h3 className="mb-4 text-sm font-bold text-primary">
                Répartition des billets par type
              </h3>
              {ticketTypeData.length === 0 ? (
                <p className="text-center text-muted">Pas encore de données</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={ticketTypeData}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {ticketTypeData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Répartition des rôles */}
            <div className="panel p-4">
              <h3 className="mb-4 text-sm font-bold text-primary">
                Utilisateurs par rôle
              </h3>
              {roleData.length === 0 ? (
                <p className="text-center text-muted">Pas encore de données</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {roleData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Logs */
        <div className="panel p-4">
          <h3 className="mb-4 text-lg font-bold text-primary">
            Logs d'activité ({logs.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Utilisateur</th>
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">Entité</th>
                  <th className="pb-2">Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line">
                    <td className="py-2 pr-4 text-muted">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-2 pr-4">
                      {log.user
                        ? `${log.user.firstname} ${log.user.lastname}`
                        : "Système"}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="rounded-md bg-primary-light px-2 py-1 text-xs font-medium text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted">{log.entity || "-"}</td>
                    <td className="py-2 text-muted">{log.details || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted">{label}</p>
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

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    CIVIL: "Civil",
    DRIVER: "Chauffeur",
    CONTROLLER: "Contrôleur",
    ADMIN: "Admin",
  };
  return labels[role] || role;
}
