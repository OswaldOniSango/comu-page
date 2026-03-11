import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";
import { defaultLocale, isLocale } from "@/lib/i18n";

const PUBLIC_FILE = /\.[^/]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];

  if (!locale || !isLocale(locale)) {
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  const subPath = `/${segments.slice(1).join("/")}`;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (subPath.startsWith("/admin") && !subPath.startsWith("/admin/login") && !hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
  }

  if (subPath.startsWith("/admin/login") && hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
