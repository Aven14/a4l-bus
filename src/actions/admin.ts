"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, hashToken, isAdminAuthenticated } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/session";

async function adminGuard() {
  return hasAdminAccess();
}

export async function loginAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return { success: false, error: "Mot de passe incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, hashToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return { success: true };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  return { success: true };
}

export async function addLine(number: number, name: string, color: string) {
  if (!(await adminGuard())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.transportLine.create({
      data: { number, name, color },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible d'ajouter la ligne." };
  }
}

export async function updateLine(
  id: string,
  data: { number?: number; name?: string; color?: string }
) {
  if (!(await adminGuard())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.transportLine.update({ where: { id }, data });
    revalidatePath("/admin");
    revalidatePath("/chauffeur");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de modifier la ligne." };
  }
}

export async function updateStop(
  id: string,
  data: { name?: string; slug?: string; audioUrl?: string; order?: number }
) {
  if (!(await adminGuard())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.stop.update({ where: { id }, data });
    revalidatePath("/admin");
    revalidatePath("/chauffeur");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de modifier l'arrêt." };
  }
}

export async function deleteLine(id: string) {
  if (!(await adminGuard())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.transportLine.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer la ligne." };
  }
}

export async function addStop(
  lineId: string,
  name: string,
  slug: string,
  audioUrl: string,
  order: number
) {
  if (!(await adminGuard())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.stop.create({
      data: { lineId, name, slug, audioUrl, order },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible d'ajouter l'arrêt." };
  }
}

export async function deleteStop(id: string) {
  if (!(await adminGuard())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.stop.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer l'arrêt." };
  }
}

export async function getAdminLines() {
  if (!(await adminGuard())) return [];

  try {
    return await prisma.transportLine.findMany({
      include: { stops: { orderBy: { order: "asc" } } },
      orderBy: { number: "asc" },
    });
  } catch {
    return [];
  }
}

export async function seedTransportLines() {
  if (!(await adminGuard())) {
    return { success: false, error: "Non autorisé." };
  }

  const { TRANSPORT_LINES } = await import("@/lib/transport-data");

  try {
    for (const line of TRANSPORT_LINES) {
      const dbLine = await prisma.transportLine.upsert({
        where: { number: line.number },
        update: { name: line.name, color: line.color },
        create: { number: line.number, name: line.name, color: line.color },
      });

      for (let i = 0; i < line.stops.length; i++) {
        const stop = line.stops[i];
        await prisma.stop.upsert({
          where: {
            lineId_slug: { lineId: dbLine.id, slug: stop.slug },
          },
          update: {
            name: stop.name,
            audioUrl: stop.audioPath,
            order: i,
          },
          create: {
            lineId: dbLine.id,
            name: stop.name,
            slug: stop.slug,
            audioUrl: stop.audioPath,
            order: i,
          },
        });
      }
    }

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'import des lignes." };
  }
}
