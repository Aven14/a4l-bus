import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User, UserRole } from "@prisma/client";
import { ADMIN_COOKIE, hashToken, isAdminAuthenticated } from "@/lib/auth";
import { randomBytes } from "crypto";

export const SESSION_COOKIE = "ctb_session";
const SESSION_DAYS = 14;

export type SessionUser = Pick<
  User,
  "id" | "email" | "firstname" | "lastname" | "role"
>;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          role: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function hasAdminAccess(): Promise<boolean> {
  if (await isAdminAuthenticated()) return true;
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function requireUser(
  roles?: UserRole[]
): Promise<{ user: SessionUser } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non connecté." };
  if (roles && !roles.includes(user.role)) {
    return { error: "Accès refusé." };
  }
  return { user };
}

export async function requireAdminAccess(): Promise<boolean> {
  return hasAdminAccess();
}

/** Crée le compte admin initial si ADMIN_EMAIL + ADMIN_PASSWORD sont définis */
export async function ensureBootstrapAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN" },
      });
    }
    return;
  }

  const { hashPassword } = await import("@/lib/password");
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstname: "Admin",
      lastname: "Cross Track Bus",
      role: "ADMIN",
    },
  });
}

export { ADMIN_COOKIE, hashToken };
