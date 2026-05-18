"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ASSIGNABLE_ROLES } from "@/lib/roles";
import { requireAdminAccess } from "@/lib/session";
import type { UserRole } from "@prisma/client";

export async function getAllUsers() {
  if (!(await requireAdminAccess())) return [];

  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      roles: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserRoles(userId: string, roles: UserRole[]) {
  if (!(await requireAdminAccess())) {
    return { success: false, error: "Non autorisé." };
  }

  const cleaned = [...new Set(roles)].filter((r) =>
    ASSIGNABLE_ROLES.includes(r)
  );

  if (cleaned.length === 0) {
    return { success: false, error: "Au moins un rôle est requis." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { roles: cleaned },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de modifier les rôles." };
  }
}

export async function updateUserName(
  userId: string,
  firstname: string,
  lastname: string
) {
  if (!(await requireAdminAccess())) {
    return { success: false, error: "Non autorisé." };
  }

  const fn = firstname.trim();
  const ln = lastname.trim();

  if (!fn || !ln) {
    return { success: false, error: "Prénom et nom requis." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { firstname: fn, lastname: ln },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de modifier le nom." };
  }
}

export async function deleteUser(userId: string) {
  if (!(await requireAdminAccess())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer l'utilisateur." };
  }
}
