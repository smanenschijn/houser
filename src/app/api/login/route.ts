import { NextResponse } from "next/server";
import { AUTH_COOKIE, signUser, verifyCredentials } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`login:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Te veel pogingen. Probeer het over een minuut opnieuw." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const user = typeof body?.user === "string" ? body.user : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyCredentials(user, password)) {
    return NextResponse.json(
      { error: "Onjuiste gebruikersnaam of wachtwoord" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, `${user}.${signUser(user)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
