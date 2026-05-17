import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chauffeur", "/controleur", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) return NextResponse.next();

  const session = request.cookies.get("ctb_session")?.value;
  const adminLegacy = request.cookies.get("crossbus_admin")?.value;

  if (!session && !adminLegacy) {
    const login = new URL("/connexion", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chauffeur/:path*", "/controleur/:path*", "/admin/:path*"],
};
