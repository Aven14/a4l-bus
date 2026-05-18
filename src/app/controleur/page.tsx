import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasAnyRole, hasRole } from "@/lib/roles";
import { getAllTickets } from "@/actions/tickets";
import { TicketsList } from "@/components/controleur/tickets-list";
import { PageHeader } from "@/components/ui/page-header";

export default async function ControleurPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?redirect=/controleur");
  if (!hasAnyRole(user.roles, ["CONTROLLER", "ADMIN"])) {
    redirect("/espace-personnel");
  }
  if (
    hasRole(user.roles, "DRIVER") &&
    !hasRole(user.roles, "CONTROLLER") &&
    !hasRole(user.roles, "ADMIN")
  ) {
    redirect("/chauffeur");
  }

  const tickets = await getAllTickets();

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Contrôle des billets"
        subtitle={`${user.firstname} ${user.lastname}`}
      />
      <TicketsList initialTickets={tickets} />
    </div>
  );
}
