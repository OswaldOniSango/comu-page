import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale") || "es";
  const response = NextResponse.redirect(new URL(`/${locale}`, request.url));
  response.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0
  });

  return response;
}
