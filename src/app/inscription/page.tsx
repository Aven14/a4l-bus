import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { PageHeader } from "@/components/ui/page-header";

export default function InscriptionPage() {
  return (
    <div className="page-enter mx-auto max-w-md px-4">
      <PageHeader
        title="Inscription"
        subtitle="Créez un compte. Un admin vous attribuera le rôle chauffeur ou contrôleur."
      />
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
