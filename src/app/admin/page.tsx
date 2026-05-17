import { AdminPanel } from "@/components/admin/admin-panel";
import { PageHeader } from "@/components/ui/page-header";
import { hasAdminAccess, ensureBootstrapAdmin } from "@/lib/session";
import { getActiveTickets, getTicketStats } from "@/actions/tickets";
import { getAdminLines } from "@/actions/admin";
import { getAllUsers } from "@/actions/users";

export default async function AdminPage() {
  await ensureBootstrapAdmin();
  const authenticated = await hasAdminAccess();
  const [lines, tickets, stats, users] = await Promise.all([
    getAdminLines(),
    getActiveTickets(),
    getTicketStats(),
    authenticated ? getAllUsers() : [],
  ]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Administration"
        subtitle="Utilisateurs, lignes, arrêts et billets."
      />
      <AdminPanel
        authenticated={authenticated}
        lines={lines}
        tickets={tickets}
        stats={stats}
        users={users}
      />
    </div>
  );
}
