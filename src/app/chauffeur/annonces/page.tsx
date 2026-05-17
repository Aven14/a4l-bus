import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMyActiveShift } from "@/actions/shifts";
import { AnnouncementPanel } from "@/components/chauffeur/announcement-panel";
import { PageHeader } from "@/components/ui/page-header";

export default async function ChauffeurAnnoncesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role !== "DRIVER" && user.role !== "ADMIN") redirect("/chauffeur");

  const shift = await getMyActiveShift();
  if (!shift) {
    redirect("/chauffeur");
  }

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Annonces arrêts"
        subtitle="Déclenchez les sons pour chaque arrêt de votre ligne."
      />
      <Link href="/chauffeur" className="btn-secondary mb-6 inline-flex text-sm">
        ← Retour service
      </Link>
      <AnnouncementPanel
        lineNumber={shift.line.number}
        lineName={shift.line.name}
        stops={shift.line.stops}
      />
    </div>
  );
}
