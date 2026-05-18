"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateMyProfile,
  updateMyPassword,
  deleteMyAccount,
} from "@/actions/account";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type ProfileData = {
  firstname: string;
  lastname: string;
  email: string;
};

export function ProfileSettingsForm({ initial }: { initial: ProfileData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [firstname, setFirstname] = useState(initial.firstname);
  const [lastname, setLastname] = useState(initial.lastname);
  const [email, setEmail] = useState(initial.email);
  const [deletePassword, setDeletePassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const res = await updateMyProfile({ firstname, lastname, email });
      if (res.success) {
        setMessage("Profil mis à jour.");
        router.refresh();
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        "Supprimer définitivement votre compte ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const res = await deleteMyAccount(deletePassword);
      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  };

  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    startTransition(async () => {
      const res = await updateMyPassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setPwdMessage("Mot de passe mis à jour.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        router.refresh();
      } else {
        setPwdError(res.error ?? "Erreur");
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink">Modifier mon profil</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-caps mb-1 block">Prénom RP</label>
            <input
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-caps mb-1 block">Nom RP</label>
            <input
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>
        <div>
          <label className="label-caps mb-1 block">Vrai e-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
        </div>
        {message && <p className="text-sm text-primary">{message}</p>}
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <LoadingSpinner /> : "Enregistrer"}
        </button>
      </form>

      <form onSubmit={handlePassword} className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink">Mot de passe</h2>
        <div>
          <label className="label-caps mb-1 block">Mot de passe actuel</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="label-caps mb-1 block">Nouveau mot de passe</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <p className="mt-1 text-xs text-muted">8 caractères minimum</p>
        </div>
        <div>
          <label className="label-caps mb-1 block">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
        {pwdMessage && <p className="text-sm text-primary">{pwdMessage}</p>}
        {pwdError && <p className="text-sm text-accent">{pwdError}</p>}
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? <LoadingSpinner /> : "Changer le mot de passe"}
        </button>
      </form>

      <section className="panel border-accent/30 p-6">
        <h2 className="text-lg font-bold text-accent">Zone de danger</h2>
        <p className="mt-2 text-sm text-muted">
          La suppression efface votre compte et toutes vos sessions. Saisissez
          votre mot de passe pour confirmer.
        </p>
        <div className="mt-4">
          <label className="label-caps mb-1 block">Mot de passe</label>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            className="input-field max-w-sm"
            placeholder="Confirmer avec votre mot de passe"
          />
        </div>
        <button
          type="button"
          disabled={pending || !deletePassword}
          onClick={handleDelete}
          className="mt-4 rounded-md bg-accent-light px-5 py-2.5 text-sm font-semibold text-accent shadow-card transition hover:shadow-card-hover disabled:opacity-50"
        >
          {pending ? <LoadingSpinner /> : "Supprimer mon compte"}
        </button>
      </section>
    </div>
  );
}
