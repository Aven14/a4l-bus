"use client";

import { useState, useTransition } from "react";
import { banPassenger } from "@/actions/bans";

export function BanPassengerForm() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await banPassenger(firstname, lastname, reason);

      if (result.success) {
        setMessage(`✓ ${firstname.trim()} ${lastname.trim()} banni(e) des bus.`);
        setFirstname("");
        setLastname("");
        setReason("");
      } else {
        setMessage(result.error ?? "Erreur lors du bannissement.");
      }
    });
  };

  return (
    <section className="panel p-6">
      <h2 className="mb-1 text-lg font-bold text-primary">Bannir un passager</h2>
      <p className="mb-4 text-sm text-muted">
        Sans titre de transport valide — saisissez le prénom et le nom du passager.
      </p>

      {message && (
        <div className="mb-4 rounded-md bg-primary-light p-3 text-sm font-medium text-primary">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="text"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          className="input-field"
          placeholder="Prénom"
          required
        />
        <input
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          className="input-field"
          placeholder="Nom"
          required
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input-field sm:col-span-2 lg:col-span-1"
          placeholder="Motif (optionnel)"
        />
        <button type="submit" disabled={pending} className="btn-danger sm:col-span-2 lg:col-span-1 opacity-90 hover:opacity-100">
          {pending ? "..." : "Bannir des bus"}
        </button>
      </form>
    </section>
  );
}
