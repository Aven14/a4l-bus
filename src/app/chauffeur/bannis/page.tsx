import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasAnyRole, hasRole } from "@/lib/roles";
import { getActiveBans } from "@/actions/bans";
import { BannedList } from "@/components/chauffeur/banned-list";
import { PageHeader } from "@/components/ui/page-header";

export default async function ChauffeurBannisPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?redirect=/chauffeur/bannis");
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

  const bans = await getActiveBans();

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Personnes bannies des bus"
        subtitle="Liste des passagers interdits — recherche par nom"
      />
      <BannedList initialBans={bans} />
    </div>
  );
}
