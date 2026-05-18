"use client";

import { useState, useTransition } from "react";
import {
  updateUserRoles,
  updateUserName,
  deleteUser,
} from "@/actions/users";
import type { UserRole } from "@prisma/client";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/roles";
import { formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type UserRow = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  roles: UserRole[];
  createdAt: Date;
};

export function UsersPanel({ users }: { users: UserRow[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="panel p-6">
      <h2 className="mb-1 text-lg font-bold text-ink">Comptes référencés</h2>
      <p className="mb-4 text-sm text-muted">
        Tous les comptes inscrits — modifiez les noms RP et attribuez plusieurs rôles.
      </p>
      {message && <p className="mb-3 text-sm text-primary">{message}</p>}
      {users.length === 0 ? (
        <p className="text-muted">Aucun compte inscrit.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="pb-2 pr-4">Prénom RP</th>
                <th className="pb-2 pr-4">Nom RP</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Rôles</th>
                <th className="pb-2 pr-4">Inscrit</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRowEditor
                  key={u.id}
                  user={u}
                  pending={pending}
                  onMessage={setMessage}
                  startTransition={startTransition}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UserRowEditor({
  user,
  pending,
  onMessage,
  startTransition,
}: {
  user: UserRow;
  pending: boolean;
  onMessage: (msg: string | null) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [firstname, setFirstname] = useState(user.firstname);
  const [lastname, setLastname] = useState(user.lastname);
  const [roles, setRoles] = useState<UserRole[]>(user.roles);

  const toggleRole = (role: UserRole) => {
    setRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const saveName = () => {
    if (firstname === user.firstname && lastname === user.lastname) return;
    startTransition(async () => {
      const res = await updateUserName(user.id, firstname, lastname);
      onMessage(res.success ? "Nom mis à jour." : res.error ?? "Erreur");
      if (res.success) window.location.reload();
    });
  };

  const saveRoles = () => {
    const same =
      roles.length === user.roles.length &&
      roles.every((r) => user.roles.includes(r));
    if (same) return;
    startTransition(async () => {
      const res = await updateUserRoles(user.id, roles);
      onMessage(res.success ? "Rôles mis à jour." : res.error ?? "Erreur");
      if (res.success) window.location.reload();
    });
  };

  return (
    <tr className="border-b border-line align-top">
      <td className="py-3 pr-3">
        <input
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          onBlur={saveName}
          disabled={pending}
          className="input-field py-1.5 text-xs"
        />
      </td>
      <td className="py-3 pr-3">
        <input
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          onBlur={saveName}
          disabled={pending}
          className="input-field py-1.5 text-xs"
        />
      </td>
      <td className="py-3 pr-4 text-muted">{user.email}</td>
      <td className="py-3 pr-4">
        <div className="flex flex-col gap-1.5">
          {ASSIGNABLE_ROLES.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-2 text-xs"
            >
              <input
                type="checkbox"
                checked={roles.includes(role)}
                disabled={pending}
                onChange={() => toggleRole(role)}
                className="rounded border-line text-primary"
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={saveRoles}
            className="mt-1 text-left text-xs font-medium text-primary hover:underline"
          >
            {pending ? <LoadingSpinner /> : "Enregistrer rôles"}
          </button>
        </div>
      </td>
      <td className="py-3 pr-4 text-muted whitespace-nowrap">
        {formatDate(user.createdAt)}
      </td>
      <td className="py-3 text-right">
        <button
          type="button"
          disabled={pending}
          className="text-xs text-accent hover:underline"
          onClick={() =>
            startTransition(async () => {
              if (confirm("Supprimer ce compte ?")) {
                await deleteUser(user.id);
                window.location.reload();
              }
            })
          }
        >
          Supprimer
        </button>
      </td>
    </tr>
  );
}
