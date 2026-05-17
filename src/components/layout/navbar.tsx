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
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-track bg-surface">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-4">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <BrandLogo compact />
        </Link>

        <nav className="hidden items-stretch gap-0 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "label-caps flex items-center border-l border-line px-4 py-2 transition",
                  active
                    ? "bg-track text-surface"
                    : "text-muted hover:bg-canvas hover:text-track"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <nav className="flex border border-track md:hidden">
          {links.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "label-caps px-2 py-1.5 text-[10px]",
                pathname === link.href
                  ? "bg-track text-surface"
                  : "text-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
