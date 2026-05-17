import { AdminPanel } from "@/components/admin/admin-panel";
import { PageHeader } from "@/components/ui/page-header";
import { isAdminAuthenticated } from "@/lib/auth";
import { getActiveTickets, getTicketStats } from "@/actions/tickets";
import { getAdminLines } from "@/actions/admin";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  const [lines, tickets, stats] = await Promise.all([
    getAdminLines(),
    getActiveTickets(),
    getTicketStats(),
  ]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Administration"
        subtitle="Gestion des lignes, arrêts et billets."
      />
      <AdminPanel
        authenticated={authenticated}
        lines={lines}
        tickets={tickets}
        stats={stats}
      />
    </div>
  );
}
