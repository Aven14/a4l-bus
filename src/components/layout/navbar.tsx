"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/driver", label: "Conducteur" },
  { href: "/tickets", label: "Billets" },
  { href: "/controller", label: "Contrôle" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const pathname = usePathname();

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

        <nav className="flex gap-1 md:hidden">
          {links.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                pathname === link.href
                  ? "bg-primary text-white"
                  : "text-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="h-1 bg-gradient-to-r from-primary via-primary to-accent" />
    </header>
  );
}
