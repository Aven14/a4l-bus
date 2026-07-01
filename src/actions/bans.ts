"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type BanRow = {
  id: string;
  firstname: string;
  lastname: string;
  reason: string | null;
  createdAt: Date;
  bannedBy: {
    firstname: string;
    lastname: string;
  };
};

export async function banPassenger(
  firstname: string,
  lastname: string,
  reason?: string
) {
  const auth = await requireUser(["CONTROLLER", "ADMIN"]);
  if ("error" in auth) return { success: false, error: auth.error };

  const fn = firstname.trim();
  const ln = lastname.trim();

  if (!fn || !ln) {
    return { success: false, error: "Prénom et nom requis." };
  }

  try {
    const ban = await prisma.busBan.create({
      data: {
        firstname: fn,
        lastname: ln,
        reason: reason?.trim() || null,
        bannedById: auth.user.id,
      },
    });

    const { createLog } = await import("@/actions/logs");
    await createLog({
      action: "BAN_PASSENGER",
      entity: "BusBan",
      entityId: ban.id,
      details: `${fn} ${ln}${reason?.trim() ? ` — ${reason.trim()}` : ""}`,
    });

    revalidatePath("/controleur");
    revalidatePath("/chauffeur/bannis");

    return { success: true, ban };
  } catch {
    return { success: false, error: "Impossible d'enregistrer le bannissement." };
  }
}

export async function getActiveBans(query = ""): Promise<BanRow[]> {
  const auth = await requireUser(["DRIVER", "ADMIN"]);
  if ("error" in auth) return [];

  const q = query.trim();

  return prisma.busBan.findMany({
    where: {
      liftedAt: null,
      ...(q
        ? {
            OR: [
              { firstname: { contains: q, mode: "insensitive" } },
              { lastname: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      bannedBy: {
        select: { firstname: true, lastname: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function liftBan(banId: string) {
  const auth = await requireUser(["CONTROLLER", "ADMIN"]);
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    await prisma.busBan.update({
      where: { id: banId },
      data: { liftedAt: new Date() },
    });

    revalidatePath("/controleur");
    revalidatePath("/chauffeur/bannis");

    return { success: true };
  } catch {
    return { success: false, error: "Impossible de lever le bannissement." };
  }
}
