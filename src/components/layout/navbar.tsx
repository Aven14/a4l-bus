"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { logoutUser } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { hasRole } from "@/lib/roles";
import type { UserRole } from "@prisma/client";

type NavUser = {
  firstname: string;
  lastname: string;
  roles: UserRole[];
};

type NavItem = {
  href: string;
  label: string;
  /** Actif aussi pour `/lignes/xxx` si href est `/lignes` */
  matchPrefix?: string;
};

function linksForRoles(roles: UserRole[]): NavItem[] {
  const links: NavItem[] = [
    { href: "/espace-personnel", label: "Mon espace" },
  ];

  if (hasRole(roles, "DRIVER") || hasRole(roles, "ADMIN")) {
    links.push(
      { href: "/chauffeur", label: "Mon service" },
      { href: "/chauffeur/annonces", label: "Annonces" }
    );
  }
  if (hasRole(roles, "CONTROLLER") || hasRole(roles, "ADMIN")) {
    links.push({ href: "/controleur", label: "Contrôle" });
  }
  if (hasRole(roles, "ADMIN")) {
    links.push({ href: "/admin", label: "Admin" });
  }

  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-md px-2.5 py-2 text-sm font-medium transition sm:px-3",
        active
          ? "bg-primary text-white shadow-card"
          : "text-muted hover:bg-primary-light/40 hover:text-primary"
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const leftLinks: NavItem[] = [
    { href: "/", label: "Accueil" },
    { href: "/lignes", label: "Lignes", matchPrefix: "/lignes" },
    ...(user ? linksForRoles(user.roles) : []),
  ];

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-hidden border-b border-line/70 bg-surface/95 shadow-elevated backdrop-blur-md">
      <div className="mx-auto grid h-14 w-full max-w-[100vw] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 sm:h-[3.75rem] sm:gap-3 sm:px-5 lg:px-8">
        <nav className="flex min-w-0 items-center gap-0.5 justify-self-start overflow-x-auto overflow-y-hidden py-0.5 sm:gap-1">
          {leftLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={
                link.matchPrefix
                  ? pathname === link.href ||
                    pathname.startsWith(`${link.matchPrefix}/`)
                  : pathname === link.href
              }
            />
          ))}
        </nav>

        <div className="shrink-0 justify-self-center px-1">
          <Link
            href="/"
            className="block transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <BrandLogo variant="navbarCenter" compact />
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-1.5 sm:gap-3">
          {!user ? (
            <>
              <Link
                href="/connexion"
                className="shrink-0 rounded-md px-2 py-2 text-xs font-semibold text-primary hover:bg-primary-light/50 sm:px-3 sm:text-sm"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="btn-primary shrink-0 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
              >
                Inscription
              </Link>
            </>
          ) : (
            <>
              <span className="hidden max-w-[min(10rem,28vw)] truncate text-xs font-medium text-muted sm:inline md:max-w-[14rem] md:text-sm">
                {user.firstname} {user.lastname}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 rounded-md bg-accent-light px-2.5 py-2 text-xs font-semibold text-accent shadow-card transition hover:shadow-card-hover sm:px-4 sm:text-sm"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
