import { cookies } from "next/headers";

const ADMIN_COOKIE = "crossbus_admin";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !token) return false;
  return token === hashToken(password);
}

export function hashToken(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `cb_${Math.abs(hash).toString(36)}`;
}

export { ADMIN_COOKIE };
