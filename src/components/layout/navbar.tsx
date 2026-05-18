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

function linksForRoles(roles: UserRole[]) {
  const links: { href: string; label: string }[] = [
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
        "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition",
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

  const leftLinks = [
    { href: "/", label: "Accueil" },
    ...(user ? linksForRoles(user.roles) : []),
  ];

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-line/70 bg-surface/95 shadow-elevated backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        {/* Mobile : logo centré, puis nav + compte */}
        <div className="flex flex-col gap-2 py-3 md:hidden">
          <div className="flex justify-center">
            <Link
              href="/"
              className="transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <BrandLogo variant="navbarCenter" compact />
            </Link>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line/60 pt-2">
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5">
              {leftLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={pathname === link.href}
                />
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              {!user ? (
                <>
                  <Link
                    href="/connexion"
                    className="rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-light/50"
                  >
                    Connexion
                  </Link>
                  <Link href="/inscription" className="btn-primary px-3 py-2 text-xs">
                    Inscription
                  </Link>
                </>
              ) : (
                <>
                  <span className="max-w-[5rem] truncate text-xs font-medium text-muted">
                    {user.firstname}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md bg-accent-light px-3 py-2 text-xs font-semibold text-accent shadow-card hover:shadow-card-hover"
                  >
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop : nav | logo | compte */}
        <div className="hidden h-[4.25rem] grid-cols-[1fr_auto_1fr] items-center gap-4 md:grid">
          <nav className="flex flex-wrap items-center gap-1 justify-self-start">
            {leftLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={pathname === link.href}
              />
            ))}
          </nav>

          <div className="justify-self-center">
            <Link
              href="/"
              className="transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <BrandLogo variant="navbarCenter" />
            </Link>
          </div>

          <div className="flex items-center justify-end gap-3 justify-self-end">
            {!user ? (
              <>
                <Link
                  href="/connexion"
                  className="rounded-md px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light/50"
                >
                  Connexion
                </Link>
                <Link href="/inscription" className="btn-primary text-sm">
                  Inscription
                </Link>
              </>
            ) : (
              <>
                <span className="hidden text-sm font-medium text-muted lg:inline">
                  {user.firstname} {user.lastname}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md bg-accent-light px-4 py-2 text-sm font-semibold text-accent shadow-card transition hover:shadow-card-hover"
                >
                  Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
