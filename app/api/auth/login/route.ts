import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";
import { createSessionToken } from "@/lib/session";
import { createAdminClient, createPublicClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const locale = new URL(request.url).searchParams.get("locale") || "es";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login?error=setup`, request.url));
  }

  const publicClient = createPublicClient();
  const adminClient = createAdminClient();

  if (!publicClient || !adminClient) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login?error=setup`, request.url));
  }

  const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login?error=invalid`, request.url));
  }

  const { data: adminRecord, error: adminError } = await adminClient
    .from("admins")
    .select("user_id, email, is_active")
    .eq("user_id", authData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !adminRecord) {
    await publicClient.auth.signOut();
    return NextResponse.redirect(
      new URL(`/${locale}/admin/login?error=unauthorized`, request.url)
    );
  }

  const token = createSessionToken({
    userId: authData.user.id,
    email: authData.user.email || email
  });
  const response = NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
