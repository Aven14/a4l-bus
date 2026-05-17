import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="page-enter mx-auto max-w-md px-4">
      <PageHeader
        title="Connexion"
        subtitle="Accédez à votre espace chauffeur ou contrôleur."
      />
      <LoginForm redirectTo={redirect} />
      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
