"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  if (!(await requireAdminAccess())) {
    return { success: false, error: "Non autorisé." };
  }

  const allowed: UserRole[] = ["PENDING", "DRIVER", "CONTROLLER", "ADMIN"];
  if (!allowed.includes(role)) {
    return { success: false, error: "Rôle invalide." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de modifier le rôle." };
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
