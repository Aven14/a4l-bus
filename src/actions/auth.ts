"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getLoginRedirect } from "@/lib/roles";
import {
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/session";

export async function registerUser(data: {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}) {
  const email = data.email.trim().toLowerCase();
  const firstname = data.firstname.trim();
  const lastname = data.lastname.trim();
  const password = data.password;

  if (!email || !password || !firstname || !lastname) {
    return { success: false, error: "Tous les champs sont requis." };
  }

  if (password.length < 8) {
    return { success: false, error: "Mot de passe : 8 caractères minimum." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { success: false, error: "Cet email est déjà utilisé." };
  }

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        firstname,
        lastname,
        roles: ["CIVIL"],
      },
    });

    return {
      success: true,
      message:
        "Compte créé avec le rôle Civil. Connectez-vous pour accéder à votre espace personnel.",
    };
  } catch {
    return { success: false, error: "Erreur lors de l'inscription." };
  }
}

export async function loginUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { success: false, error: "Email et mot de passe requis." };
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { success: false, error: "Email ou mot de passe incorrect." };
  }

  await destroySession();
  await createSession(user.id);

  revalidatePath("/");

  return {
    success: true,
    roles: user.roles,
    redirect: getLoginRedirect(user.roles),
  };
}

export async function logoutUser() {
  await destroySession();
  revalidatePath("/");
  return { success: true };
}

export async function getSessionUser() {
  return getCurrentUser();
}
