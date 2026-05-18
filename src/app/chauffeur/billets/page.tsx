import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasAnyRole } from "@/lib/roles";
import { getMyActiveShift } from "@/actions/shifts";
import { TicketForm } from "@/components/tickets/ticket-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function ChauffeurBilletsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!hasAnyRole(user.roles, ["DRIVER", "ADMIN"])) redirect("/espace-personnel");

  const shift = await getMyActiveShift();
  if (!shift) redirect("/chauffeur");

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Émission de billets"
        subtitle={`Service ligne ${shift.line.number} — ${shift.line.name}`}
      />
      <Link href="/chauffeur" className="btn-secondary mb-6 inline-flex text-sm">
        ← Retour service
      </Link>
      <TicketForm />
    </div>
  );
}
