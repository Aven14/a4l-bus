"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { logoutUser } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { hasRole } from "@/lib/roles";
import type { UserRole } from "@prisma/client";
import { useMemo } from "react";

type NavUser = {
  firstname: string;
  lastname: string;
  roles: UserRole[];
};

type NavItem = {
  href: string;
  label: string;
  matchPrefix?: string;
};

function linksForRoles(roles: UserRole[]): NavItem[] {
  const links: NavItem[] = [];

  if (hasRole(roles, "DRIVER") || hasRole(roles, "ADMIN")) {
    links.push(
      { href: "/chauffeur", label: "Mon service" },
      { href: "/chauffeur/annonces", label: "Annonces" },
      { href: "/chauffeur/bannis", label: "Personnes bannies" }
    );
  }
  if (hasRole(roles, "CONTROLLER") || hasRole(roles, "ADMIN")) {
    links.push({ href: "/controleur", label: "Contrôle" });
  }
  if (hasRole(roles, "ADMIN")) {
    links.push({ href: "/admin", label: "Admin" });
  }

  return links;
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
      prefetch={true}
      className={cn(
        "block rounded-md px-3 py-2.5 text-sm font-medium transition",
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

  const mainLinks = useMemo<NavItem[]>(() => {
    return [
      { href: "/", label: "Accueil" },
      { href: "/lignes", label: "Lignes", matchPrefix: "/lignes" },
      ...(user ? linksForRoles(user.roles) : []),
    ];
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-line/70 bg-surface/85 shadow-elevated backdrop-blur-md">
      <div className="border-b border-line/70 px-4 py-4">
        <Link
          href="/"
          prefetch={true}
          className="block transition-opacity hover:opacity-90"
        >
          <BrandLogo compact />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainLinks.map((link) => (
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

      <div className="space-y-2 border-t border-line/70 px-3 py-4">
        {!user ? (
          <>
            <Link
              href="/connexion"
              prefetch={true}
              className="block rounded-md px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary-light/50"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              prefetch={true}
              className="btn-primary block px-3 py-2.5 text-center text-sm"
            >
              Inscription
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/espace-personnel"
              prefetch={true}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm font-medium transition",
                pathname === "/espace-personnel"
                  ? "bg-primary text-white shadow-card"
                  : "text-muted hover:bg-primary-light/40 hover:text-primary"
              )}
            >
              Mon espace
            </Link>
            <p className="truncate px-3 text-xs text-muted">
              {user.firstname} {user.lastname}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-md bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-red-700"
            >
              Déconnexion
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
