"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-bold text-white shadow-lg shadow-accent/30 transition group-hover:scale-105">
            CB
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              Cross<span className="text-accent">Bus</span>
            </span>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Réseau RP Arma 3
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === link.href
                  ? "bg-accent/15 text-accent"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="flex gap-1 md:hidden">
          {links.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium",
                pathname === link.href ? "text-accent" : "text-slate-400"
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
