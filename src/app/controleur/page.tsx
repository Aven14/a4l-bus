import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getAllTickets } from "@/actions/tickets";
import { TicketsList } from "@/components/controleur/tickets-list";
import { PageHeader } from "@/components/ui/page-header";

export default async function ControleurPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role === "PENDING") redirect("/compte-en-attente");
  if (user.role === "DRIVER") redirect("/chauffeur");
  if (user.role !== "CONTROLLER" && user.role !== "ADMIN") redirect("/connexion");

  const tickets = await getAllTickets();

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Espace contrôleur"
        subtitle={`${user.firstname} ${user.lastname} — Liste des titres de transport`}
      />
      <TicketsList initialTickets={tickets} />
    </div>
  );
}
