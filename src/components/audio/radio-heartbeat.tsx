"use client";

import { useEffect } from "react";

export function RadioHeartbeat() {
  useEffect(() => {
    // Just check if radio is running, don't initialize it
    fetch("/api/radio/heartbeat").catch(() => {});
  }, []);

  return null;
}
