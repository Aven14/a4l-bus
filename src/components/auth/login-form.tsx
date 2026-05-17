"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/actions/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await loginUser(email, password);
      if (res.success && res.redirect) {
        router.push(redirectTo || res.redirect);
        router.refresh();
      } else {
        setError(res.error ?? "Erreur de connexion");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 p-6">
      <div>
        <label className="label-caps mb-1 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label-caps mb-1 block">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          required
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-accent-light px-3 py-2 text-sm text-accent">{error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <LoadingSpinner /> : "Se connecter"}
      </button>
    </form>
  );
}
