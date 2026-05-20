"use client";

import { useEffect } from "react";

export function RadioHeartbeat() {
  useEffect(() => {
    // Activer la radio au chargement du site
    fetch("/api/radio/heartbeat", { method: "POST" }).catch(() => {});

    // Maintenir la radio "vivante" avec un heartbeat toutes les 30 secondes
    const interval = setInterval(() => {
      fetch("/api/radio/heartbeat", { method: "POST" }).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
