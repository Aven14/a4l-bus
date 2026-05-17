"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
    expiresAt: Date;
  };
};

export async function createTicket(
  firstname: string,
  lastname: string,
  ticketType: string
): Promise<TicketResult> {
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
    const ticket = await prisma.ticket.create({
      data: {
        firstname: fn,
        lastname: ln,
        ticketType: ticketType as TicketType,
        expiresAt: getExpirationDate(ticketType as TicketType),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/controller");

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
  try {
    await prisma.ticket.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer le billet." };
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
      prisma.ticket.count({ where: { expiresAt: { gt: now } } }),
      prisma.ticket.count({ where: { expiresAt: { lte: now } } }),
    ]);
    return { total, active, expired };
  } catch {
    return { total: 0, active: 0, expired: 0 };
  }
}
