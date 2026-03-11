import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/constants";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase";

function getSecret() {
  return process.env.SESSION_SECRET || "change-me";
}

type SessionPayload = {
  userId: string;
  email: string;
  ts: number;
};

export function createSessionToken(payload: Omit<SessionPayload, "ts">) {
  const encoded = Buffer.from(
    JSON.stringify({
      ...payload,
      ts: Date.now()
    })
  ).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");

  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const store = await cookies();
  const session = verifySessionToken(store.get(SESSION_COOKIE)?.value);

  if (!session) {
    return null;
  }

  const client = createAdminClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("admins")
    .select("user_id, email, is_active")
    .eq("user_id", session.userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return session;
}

export async function requireAdminSession(locale: string) {
  const session = await getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return session;
}
