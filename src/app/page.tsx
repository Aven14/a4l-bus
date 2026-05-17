import Link from "next/link";
import { TRANSPORT_LINES } from "@/lib/transport-data";

const services = [
  {
    num: "01",
    title: "Radio & annonces",
    desc: "Diffusion continue et messages arrêt avec signal sonore.",
    href: "/driver",
  },
  {
    num: "02",
    title: "Billets",
    desc: "Émission trajet unique, journée ou semaine.",
    href: "/tickets",
  },
  {
    num: "03",
    title: "Contrôle",
    desc: "Vérification passager par nom et prénom.",
    href: "/controller",
  },
];

export default function HomePage() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <section className="mb-14 grid gap-8 border-b-2 border-track pb-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="label-caps mb-4">Compagnie de transport · Altis RP</p>
          <h1 className="font-display text-[clamp(2.75rem,8vw,5.5rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-track">
            Cross
            <br />
            Track
            <br />
            Bus
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Interface conducteur et contrôleur pour le réseau bus du serveur.
            Radio, annonces sonores et titres de transport centralisés.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/driver" className="btn-primary">
              Panneau conducteur
            </Link>
            <Link href="/tickets" className="btn-secondary">
              Émettre un billet
            </Link>
          </div>
        </div>

        <div className="panel p-6">
          <p className="label-caps mb-3">État du réseau</p>
          <p className="font-display text-5xl font-extrabold text-track">
            {TRANSPORT_LINES.length}
          </p>
          <p className="text-sm text-muted">lignes en service</p>
          <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Zone</span>
              <span className="font-medium">Altis — RP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Statut</span>
              <span className="font-display text-xs font-bold uppercase tracking-widest text-track">
                Opérationnel
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-track">
            Services
          </h2>
          <span className="label-caps">Accès rapide</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="panel group block p-5 transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-track)]"
            >
              <span className="font-display text-3xl font-extrabold text-line group-hover:text-track">
                {s.num}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold uppercase text-track">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-track">
            Lignes
          </h2>
          <span className="label-caps">{TRANSPORT_LINES.length} circuits</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRANSPORT_LINES.map((line) => (
            <div
              key={line.number}
              className="panel-soft flex items-stretch overflow-hidden"
            >
              <div
                className="flex w-14 shrink-0 items-center justify-center font-display text-2xl font-extrabold text-surface"
                style={{ backgroundColor: line.color }}
              >
                {line.number}
              </div>
              <div className="flex flex-1 flex-col justify-center px-4 py-3">
                <p className="font-display text-sm font-bold uppercase text-track">
                  {line.name}
                </p>
                <p className="text-xs text-muted">{line.stops.length} arrêts</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
