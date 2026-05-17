import Link from "next/link";
import { TRANSPORT_LINES } from "@/lib/transport-data";

export default function HomePage() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <section className="mb-16 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-3xl font-black text-white shadow-2xl shadow-accent/40">
          CB
        </div>
        <h1 className="mb-4 text-5xl font-black tracking-tight text-white md:text-7xl">
          Cross<span className="text-accent">Bus</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">
          Réseau de transport urbain et interurbain pour votre expérience Arma 3 RP.
          Radio en direct, annonces sonores et gestion des billets.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/driver" className="btn-primary">
            Panneau conducteur
          </Link>
          <Link href="/tickets" className="btn-secondary">
            Émettre un billet
          </Link>
        </div>
      </section>

      <section className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Radio & Annonces",
            desc: "Musique libre de droits et annonces métro avec fondu automatique.",
            href: "/driver",
            icon: "🎵",
          },
          {
            title: "Billets",
            desc: "Trajet unique, pass journée ou semaine — stockés en base Neon.",
            href: "/tickets",
            icon: "🎫",
          },
          {
            title: "Contrôle",
            desc: "Vérification instantanée des titres de transport.",
            href: "/controller",
            icon: "✓",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="glass-card group p-6 transition hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
          >
            <span className="text-3xl">{card.icon}</span>
            <h3 className="mt-3 text-lg font-bold text-white group-hover:text-accent transition">
              {card.title}
            </h3>
            <p className="mt-2 text-sm text-slate-400">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-white">
          Réseau — {TRANSPORT_LINES.length} lignes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRANSPORT_LINES.map((line) => (
            <div
              key={line.number}
              className="glass-card flex items-center gap-4 p-4"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-white"
                style={{ backgroundColor: line.color }}
              >
                {line.number}
              </div>
              <div>
                <p className="font-semibold text-white">{line.name}</p>
                <p className="text-xs text-slate-500">
                  {line.stops.length} arrêts
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}