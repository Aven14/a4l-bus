"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  getExpirationDate,
  type TicketType,
  TICKET_TYPES,
} from "@/lib/transport-data";

export type TicketResult = {
  success: boolean;
  error?: string;
  ticket?: {
    id: string;
    firstname: string;
    lastname: string;
    ticketType: string;
    createdAt: Date;
    expiresAt: Date | null;
  };
};

export async function createTicket(
  firstname: string,
  lastname: string,
  ticketType: string
): Promise<TicketResult> {
  const auth = await requireUser(["DRIVER", "ADMIN"]);
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const fn = firstname.trim();
  const ln = lastname.trim();

  if (!fn || !ln) {
    return { success: false, error: "Prénom et nom requis." };
  }

  const valid = TICKET_TYPES.find((t) => t.value === ticketType);
  if (!valid) {
    return { success: false, error: "Type de billet invalide." };
  }

  try {
    const expiresAt = getExpirationDate(ticketType as TicketType);
    
    const ticket = await prisma.ticket.create({
      data: {
        firstname: fn,
        lastname: ln,
        ticketType: ticketType as TicketType,
        expiresAt: expiresAt || undefined,
        issuedById: auth.user.id,
      },
    });

    // Logger la création
    const { createLog } = await import("@/actions/logs");
    await createLog({
      action: "CREATE_TICKET",
      entity: "Ticket",
      entityId: ticket.id,
      details: `Type: ${ticketType}, Passager: ${fn} ${ln}`,
    });

    revalidatePath("/admin");
    revalidatePath("/controleur");
    revalidatePath("/chauffeur");

    return { success: true, ticket };
  } catch {
    return { success: false, error: "Erreur lors de la création du billet." };
  }
}

export type SearchResult = {
  status: "valid" | "expired" | "not_found";
  ticket?: {
    id: string;
    firstname: string;
    lastname: string;
    ticketType: string;
    createdAt: Date;
    expiresAt: Date;
  };
};

export async function searchTicket(
  firstname: string,
  lastname: string
): Promise<SearchResult> {
  const fn = firstname.trim();
  const ln = lastname.trim();

  if (!fn || !ln) {
    return { status: "not_found" };
  }

  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        firstname: { equals: fn, mode: "insensitive" },
        lastname: { equals: ln, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!ticket) return { status: "not_found" };

    const isExpired = new Date(ticket.expiresAt) < new Date();
    return {
      status: isExpired ? "expired" : "valid",
      ticket,
    };
  } catch {
    return { status: "not_found" };
  }
}

export async function deleteTicket(id: string) {
  const { hasAdminAccess } = await import("@/lib/session");
  if (!(await hasAdminAccess())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.ticket.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer le billet." };
  }
}

export async function getAllTickets(search?: string) {
  const auth = await requireUser(["CONTROLLER", "ADMIN"]);
  if ("error" in auth) return [];

  const q = search?.trim();

  try {
    return await prisma.ticket.findMany({
      where: q
        ? {
            OR: [
              { firstname: { contains: q, mode: "insensitive" } },
              { lastname: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getActiveTickets() {
  try {
    return await prisma.ticket.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getTicketStats() {
  try {
    const now = new Date();
    const [total, active, expired] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { expiresAt: { gt: now }, cancelled: false } }),
      prisma.ticket.count({ where: { expiresAt: { lte: now }, cancelled: false } }),
    ]);
    return { total, active, expired };
  } catch {
    return { total: 0, active: 0, expired: 0 };
  }
}

export async function cancelTicket(id: string) {
  const { hasAdminAccess } = await import("@/lib/session");
  if (!(await hasAdminAccess())) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    await prisma.ticket.update({
      where: { id },
      data: {
        cancelled: true,
        cancelledAt: new Date(),
      },
    });

    // Logger l'annulation
    const { createLog } = await import("@/actions/logs");
    await createLog({
      action: "CANCEL_TICKET",
      entity: "Ticket",
      entityId: id,
      details: "Billet annulé par un admin",
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible d'annuler le billet." };
  }
}

export async function cleanupExpiredTickets() {
  const { hasAdminAccess } = await import("@/lib/session");
  if (!(await hasAdminAccess())) {
    return { success: false, error: "Non autorisé.", count: 0 };
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { count } = await prisma.ticket.deleteMany({
      where: {
        expiresAt: { lt: sevenDaysAgo },
        cancelled: false,
      },
    });

    // Logger le nettoyage
    const { createLog } = await import("@/actions/logs");
    await createLog({
      action: "CLEANUP_EXPIRED_TICKETS",
      entity: "Ticket",
      details: `${count} billets expirés supprimés`,
    });

    revalidatePath("/admin");
    return { success: true, count };
  } catch {
    return { success: false, error: "Erreur lors du nettoyage.", count: 0 };
  }
}

export async function getUserTickets(userId: string) {
  try {
    return await prisma.ticket.findMany({
      where: { issuedById: userId },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

