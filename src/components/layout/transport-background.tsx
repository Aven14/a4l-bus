"use client";

import { useId, useMemo } from "react";

type LineSpec = {
  top: number;
  widthPct: number;
  leftPct: number;
  opacity: number;
  accent: boolean;
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
    widthPct: 28 + rand() * 45,
    leftPct: rand() * 52,
    opacity: 0.14 + rand() * 0.18,
    accent: rand() > 0.45,
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
          className="route-line"
          style={{
            top: `${line.top}%`,
            left: `${line.leftPct}%`,
            width: `${line.widthPct}%`,
            opacity: line.opacity,
            height: "3px",
            background: line.accent
              ? "linear-gradient(90deg, rgba(220, 38, 38, 0.75) 0%, rgba(220, 38, 38, 0.08) 85%, transparent 100%)"
              : "linear-gradient(90deg, rgba(29, 78, 216, 0.7) 0%, rgba(29, 78, 216, 0.08) 85%, transparent 100%)",
          }}
        />
      ))}
    </div>
  );
}
