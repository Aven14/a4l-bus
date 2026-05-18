import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasAnyRole, hasRole } from "@/lib/roles";
import { getLinesWithAvailability } from "@/actions/shifts";
import { ShiftDashboard } from "@/components/chauffeur/shift-dashboard";
import { PageHeader } from "@/components/ui/page-header";

export default async function ChauffeurPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?redirect=/chauffeur");
  if (!hasAnyRole(user.roles, ["DRIVER", "ADMIN"])) {
    redirect("/espace-personnel");
  }
  if (
    hasRole(user.roles, "CONTROLLER") &&
    !hasRole(user.roles, "DRIVER") &&
    !hasRole(user.roles, "ADMIN")
  ) {
    redirect("/controleur");
  }

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
