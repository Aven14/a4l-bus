"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

type LineSpec = {
  top: number;
  widthPct: number;
  opacity: number;
  accent: boolean;
  durationSec: number;
  delaySec: number;
};

/** PRNG déterministe (même résultat SSR + client → pas d’erreur d’hydratation) */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function linesFromSeed(seedStr: string): LineSpec[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  if (seed === 0) seed = 1;
  const rand = mulberry32(seed);
  return Array.from({ length: 5 }, () => ({
    top: 8 + rand() * 82,
    widthPct: 20 + rand() * 42,
    opacity: 0.14 + rand() * 0.2,
    accent: rand() > 0.45,
    durationSec: 16 + rand() * 32,
    delaySec: -rand() * 24,
  }));
}

export function TransportBackground() {
  const id = useId();
  const lines = useMemo(() => linesFromSeed(id), [id]);

  return (
    <div className="transport-bg" aria-hidden>
      {lines.map((line, i) => (
        <div
          key={i}
          className="route-line-track"
          style={{ top: `${line.top}%` }}
        >
          <div
            className={cn(
              "route-line-bar",
              line.accent ? "route-line-bar--accent" : "route-line-bar--primary"
            )}
            style={{
              width: `${line.widthPct}vw`,
              minWidth: "120px",
              maxWidth: "55vw",
              opacity: line.opacity,
              animationDuration: `${line.durationSec}s`,
              animationDelay: `${line.delaySec}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
