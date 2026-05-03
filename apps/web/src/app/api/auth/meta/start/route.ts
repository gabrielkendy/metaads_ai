import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { requireAdmin } from "@/lib/auth/helpers";
import { getOAuthUrl } from "@/lib/meta/client";
import { publicEnv } from "@/lib/env";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");
  if (!clientId) {
    return NextResponse.json({ error: "client_id é obrigatório" }, { status: 400 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth_state", `${state}|${clientId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = `${publicEnv.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;

  try {
    const authUrl = getOAuthUrl({ state, redirectUri });
    return NextResponse.redirect(authUrl);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Meta OAuth não configurado" },
      { status: 500 },
    );
  }
}
