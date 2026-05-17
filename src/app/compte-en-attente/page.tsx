import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";

export default async function CompteEnAttentePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role === "DRIVER") redirect("/chauffeur");
  if (user.role === "CONTROLLER") redirect("/controleur");
  if (user.role === "ADMIN") redirect("/admin");

  return (
    <div className="page-enter mx-auto max-w-lg px-4 text-center">
      <PageHeader
        title="Compte en attente"
        subtitle={`Bonjour ${user.firstname}, un administrateur doit vous attribuer un rôle avant d'accéder aux panels.`}
      />
      <div className="panel p-6">
        <p className="text-muted">
          Email : <strong className="text-ink">{user.email}</strong>
        </p>
        <p className="mt-4 text-sm text-muted">
          Contactez l&apos;équipe admin du serveur pour obtenir l&apos;accès chauffeur ou contrôleur.
        </p>
        <Link href="/connexion" className="btn-secondary mt-6 inline-flex">
          Retour connexion
        </Link>
      </div>
    </div>
  );
}
