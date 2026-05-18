import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser, ensureBootstrapAdmin } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import { getActiveTickets, getTicketStats } from "@/actions/tickets";
import { getAdminLines } from "@/actions/admin";
import { getAllUsers } from "@/actions/users";
import { getLogStats, getAdminLogs } from "@/actions/logs";

export default async function AdminPage() {
  await ensureBootstrapAdmin();
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?redirect=/admin");
  if (!hasRole(user.roles, "ADMIN")) redirect("/espace-personnel");

  const [lines, tickets, stats, users, logStats, logs] = await Promise.all([
    getAdminLines(),
    getActiveTickets(),
    getTicketStats(),
    getAllUsers(),
    getLogStats(),
    getAdminLogs(100),
  ]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Administration"
        subtitle="Dashboard, utilisateurs, lignes, arrêts et billets."
      />
      <AdminPanel
        lines={lines}
        tickets={tickets}
        stats={stats}
        users={users}
        logStats={logStats}
        logs={logs}
      />
    </div>
  );
}
