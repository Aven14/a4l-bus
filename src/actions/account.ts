"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { destroySession, getCurrentUser } from "@/lib/session";

export async function updateMyProfile(data: {
  firstname: string;
  lastname: string;
  email: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Non connecté." };
  }

  const firstname = data.firstname.trim();
  const lastname = data.lastname.trim();
  const email = data.email.trim().toLowerCase();

  if (!firstname || !lastname || !email) {
    return { success: false, error: "Tous les champs sont requis." };
  }

  const taken = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
  });
  if (taken) {
    return { success: false, error: "Cet email est déjà utilisé." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { firstname, lastname, email },
    });

    revalidatePath("/espace-personnel");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de mettre à jour le profil." };
  }
}

export async function updateMyPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Non connecté." };
  }

  const current = data.currentPassword;
  const next = data.newPassword;

  if (!current || !next) {
    return { success: false, error: "Tous les champs sont requis." };
  }

  if (next.length < 8) {
    return { success: false, error: "Nouveau mot de passe : 8 caractères minimum." };
  }

  if (next === current) {
    return { success: false, error: "Le nouveau mot de passe doit être différent de l’actuel." };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(current, dbUser.passwordHash))) {
    return { success: false, error: "Mot de passe actuel incorrect." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next) },
    });

    revalidatePath("/espace-personnel");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de modifier le mot de passe." };
  }
}

export async function deleteMyAccount(password: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Non connecté." };
  }

  if (!password) {
    return { success: false, error: "Mot de passe requis pour confirmer." };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(password, dbUser.passwordHash))) {
    return { success: false, error: "Mot de passe incorrect." };
  }

  try {
    await prisma.user.delete({ where: { id: user.id } });
    await destroySession();
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer le compte." };
  }
}
