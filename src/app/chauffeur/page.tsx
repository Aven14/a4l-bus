import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLinesWithAvailability } from "@/actions/shifts";
import { ShiftDashboard } from "@/components/chauffeur/shift-dashboard";
import { PageHeader } from "@/components/ui/page-header";

export default async function ChauffeurPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role === "PENDING") redirect("/compte-en-attente");
  if (user.role === "CONTROLLER") redirect("/controleur");
  if (user.role !== "DRIVER" && user.role !== "ADMIN") redirect("/connexion");

  const data = await getLinesWithAvailability();
  if ("error" in data && data.error) {
    return (
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-accent">{data.error}</p>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Espace chauffeur"
        subtitle={`${user.firstname} ${user.lastname} — Prise et fin de service`}
      />
      <ShiftDashboard lines={data.lines} myShift={data.myShift} />
    </div>
  );
}
