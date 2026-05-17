"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/actions/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function RegisterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await registerUser({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        firstname: fd.get("firstname") as string,
        lastname: fd.get("lastname") as string,
      });
      if (res.success) {
        setSuccess(res.message ?? "Compte créé.");
        setTimeout(() => router.push("/connexion"), 2000);
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-caps mb-1 block">Prénom</label>
          <input name="firstname" className="input-field" required />
        </div>
        <div>
          <label className="label-caps mb-1 block">Nom</label>
          <input name="lastname" className="input-field" required />
        </div>
      </div>
      <div>
        <label className="label-caps mb-1 block">Email</label>
        <input name="email" type="email" className="input-field" required />
      </div>
      <div>
        <label className="label-caps mb-1 block">Mot de passe</label>
        <input name="password" type="password" className="input-field" minLength={8} required />
        <p className="mt-1 text-xs text-muted">8 caractères minimum</p>
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      {success && <p className="text-sm text-primary">{success}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <LoadingSpinner /> : "Créer mon compte"}
      </button>
    </form>
  );
}
