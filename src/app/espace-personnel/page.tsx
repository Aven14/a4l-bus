import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasRole, formatRoles, ROLE_LABELS } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import type { UserRole } from "@prisma/client";

const PANEL_LINKS: {
  role: UserRole;
  href: string;
  title: string;
  desc: string;
}[] = [
  {
    role: "DRIVER",
    href: "/chauffeur",
    title: "Espace chauffeur",
    desc: "Prise de service, annonces et émission de billets.",
  },
  {
    role: "CONTROLLER",
    href: "/controleur",
    title: "Contrôle billets",
    desc: "Vérification des titres de transport des passagers.",
  },
  {
    role: "ADMIN",
    href: "/admin",
    title: "Administration",
    desc: "Gestion des comptes, lignes et billets.",
  },
];

export default async function EspacePersonnelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?redirect=/espace-personnel");

  const accessiblePanels = PANEL_LINKS.filter((p) =>
    hasRole(user.roles, p.role)
  );

  return (
    <div className="page-enter mx-auto max-w-2xl px-4">
      <PageHeader
        title="Espace personnel"
        subtitle={`Bienvenue, ${user.firstname} ${user.lastname}`}
      />

      <div className="panel space-y-4 p-6">
        <div>
          <p className="label-caps text-muted">Identité RP</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {user.firstname} {user.lastname}
          </p>
        </div>
        <div>
          <p className="label-caps text-muted">Email</p>
          <p className="mt-1 text-ink">{user.email}</p>
        </div>
        <div>
          <p className="label-caps text-muted">Rôles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
              >
                {ROLE_LABELS[role]}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{formatRoles(user.roles)}</p>
        </div>
      </div>

      {accessiblePanels.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-ink">Vos espaces</h2>
          <div className="grid gap-3">
            {accessiblePanels.map((panel) => (
              <Link
                key={panel.href}
                href={panel.href}
                className="panel-soft block p-5 transition hover:border-primary/30"
              >
                <h3 className="font-bold text-primary">{panel.title}</h3>
                <p className="mt-1 text-sm text-muted">{panel.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="panel-soft mt-8 p-6 text-center">
          <p className="text-muted">
            Vous êtes inscrit en tant que <strong className="text-ink">Civil</strong>.
            Un administrateur peut vous attribuer des rôles supplémentaires
            (chauffeur, contrôleur).
          </p>
          <Link href="/" className="btn-secondary mt-4 inline-flex">
            Retour à l&apos;accueil
          </Link>
        </div>
      )}
    </div>
  );
}
