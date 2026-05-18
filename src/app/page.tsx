import Link from "next/link";
import { getHomeNetworkData } from "@/actions/lines";
import { getCurrentUser } from "@/lib/session";

const services = [
  {
    title: "Radio & annonces",
    desc: "Musique en continu et messages arrêt avec signal sonore.",
    color: "from-primary/10 to-primary/5",
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    title: "Billets",
    desc: "Émission trajet unique, pass journée ou semaine.",
    color: "from-accent-light to-white",
    icon: (
      <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    title: "Contrôle",
    desc: "Risque de vérification des titres de transports.",
    color: "from-primary-light/80 to-white",
    icon: (
      <svg className="h-6 w-6 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  const [user, { lineCount, activeLines }] = await Promise.all([
    getCurrentUser(),
    getHomeNetworkData(),
  ]);
  const espaceHref = user ? "/espace-personnel" : "/connexion";

  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <section className="panel-highlight relative mb-12 overflow-hidden p-8 md:p-12">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Réseau actif · Vice City
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
              Cross Track{" "}
              <span className="text-gradient-brand">Bus</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              Site du CTB avec radio et annonces des lignes
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={espaceHref} className="btn-primary">
                Espace personnel
              </Link>
              <Link href="/inscription" className="btn-secondary">
                Créer un compte
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary p-5 text-white shadow-lg shadow-primary/25">
              <p className="text-4xl font-extrabold">{lineCount}</p>
              <p className="mt-1 text-sm text-white/80">
                ligne{lineCount !== 1 ? "s" : ""} au réseau
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-4xl font-extrabold text-primary">{activeLines.length}</p>
              <p className="mt-1 text-sm text-muted">
                ligne{activeLines.length !== 1 ? "s" : ""} en service
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold text-ink">Services</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className={`panel-soft bg-gradient-to-br p-6 ${s.color}`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface shadow-sm">
                {s.icon}
              </div>
              <h3 className="font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-bold text-ink">Lignes actives</h2>
        {activeLines.length === 0 ? (
          <div className="panel-soft p-8 text-center text-muted">
            Aucune ligne active
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeLines.map((line) => (
              <div
                key={line.id}
                className="panel-soft flex items-center gap-4 p-4"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md"
                  style={{ backgroundColor: line.color }}
                >
                  {line.number}
                </div>
                <div>
                  <p className="font-semibold text-ink">{line.name}</p>
                  <p className="text-sm text-muted">Conducteur : {line.driver}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
