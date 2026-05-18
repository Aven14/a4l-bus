"use client";

import { useEffect, useState } from "react";

type LineSpec = {
  top: number;
  widthPct: number;
  leftPct: number;
  opacity: number;
  accent: boolean;
};

function generateLines(): LineSpec[] {
  return Array.from({ length: 5 }, () => ({
    top: 6 + Math.random() * 86,
    widthPct: 22 + Math.random() * 48,
    leftPct: Math.random() * 48,
    opacity: 0.07 + Math.random() * 0.14,
    accent: Math.random() > 0.42,
  }));
}

export function TransportBackground() {
  const [lines, setLines] = useState<LineSpec[]>([]);

  useEffect(() => {
    setLines(generateLines());
  }, []);

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
            background: line.accent
              ? "linear-gradient(90deg, rgba(220, 38, 38, 0.55) 0%, rgba(220, 38, 38, 0) 100%)"
              : "linear-gradient(90deg, rgba(29, 78, 216, 0.5) 0%, rgba(29, 78, 216, 0) 100%)",
          }}
        />
      ))}
    </div>
  );
}
