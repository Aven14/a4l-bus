"use client";

import { useTransition } from "react";
import { updateUserRole, deleteUser } from "@/actions/users";
import type { UserRole } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  createdAt: Date;
};

const ROLES: UserRole[] = ["PENDING", "DRIVER", "CONTROLLER", "ADMIN"];

const roleLabels: Record<UserRole, string> = {
  PENDING: "En attente",
  DRIVER: "Chauffeur",
  CONTROLLER: "Contrôleur",
  ADMIN: "Admin",
};

export function UsersPanel({ users }: { users: UserRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="panel p-6">
      <h2 className="mb-4 text-lg font-bold text-ink">Comptes utilisateurs</h2>
      {users.length === 0 ? (
        <p className="text-muted">Aucun compte inscrit.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="pb-2 pr-4">Nom</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Rôle</th>
                <th className="pb-2 pr-4">Inscrit</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line">
                  <td className="py-3 pr-4 font-medium">
                    {u.firstname} {u.lastname}
                  </td>
                  <td className="py-3 pr-4 text-muted">{u.email}</td>
                  <td className="py-3 pr-4">
                    <select
                      value={u.role}
                      disabled={pending}
                      onChange={(e) =>
                        startTransition(async () => {
                          await updateUserRole(u.id, e.target.value as UserRole);
                          window.location.reload();
                        })
                      }
                      className="input-field py-1.5 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabels[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      disabled={pending}
                      className="text-xs text-accent hover:underline"
                      onClick={() =>
                        startTransition(async () => {
                          if (confirm("Supprimer ce compte ?")) {
                            await deleteUser(u.id);
                            window.location.reload();
                          }
                        })
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
