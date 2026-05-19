"use client";

import { useEffect, useRef } from "react";

export function TransportBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lines: Array<{
      y: number;
      x: number;
      speed: number;
      length: number;
      color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initLines();
    };

    const initLines = () => {
      lines = [];
      const count = 8;
      const colors = [
        "rgba(29, 78, 216, 0.3)",
        "rgba(220, 38, 38, 0.3)",
        "rgba(29, 78, 216, 0.2)",
      ];

      for (let i = 0; i < count; i++) {
        lines.push({
          y: (canvas.height / (count + 1)) * (i + 1),
          x: Math.random() * canvas.width * -1,
          speed: 1 + Math.random() * 2,
          length: 80 + Math.random() * 120,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const draw = () => {
      // Dessiner le gradient de fond
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#f8fafc");
      gradient.addColorStop(0.5, "#f4f7fc");
      gradient.addColorStop(1, "#eef2ff");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      lines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + line.length, line.y);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();

        // Déplacer la ligne
        line.x += line.speed;

        // Réinitialiser si hors écran
        if (line.x > canvas.width + line.length) {
          line.x = -line.length;
          line.speed = 1 + Math.random() * 2;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
