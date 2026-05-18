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

const publicLinks = [{ href: "/", label: "Accueil" }];

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

export function Navbar({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    ...publicLinks,
    ...(user ? linksForRoles(user.roles) : []),
    ...(!user
      ? [
          { href: "/connexion", label: "Connexion" },
          { href: "/inscription", label: "Inscription" },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-line bg-surface/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="transition-opacity hover:opacity-90">
          <BrandLogo compact />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-canvas p-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-muted hover:bg-white hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="hidden text-xs text-muted sm:inline">
                {user.firstname}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-accent hover:bg-accent-light"
              >
                Déco
              </button>
            </>
          )}
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-primary via-primary to-accent" />
    </header>
  );
}
