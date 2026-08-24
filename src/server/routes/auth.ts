import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { AUTH_COOKIE, signUser, verifyCredentials } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isAuthorized } from "@/server/auth";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const authRoutes = new Hono();

authRoutes.get("/me", (c) => {
  return c.json({ authed: isAuthorized(c) });
});

authRoutes.post("/login", async (c) => {
  const ip = getClientIp(c.req.raw);
  const limit = rateLimit(`login:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limit.success) {
    return c.json(
      { error: "Te veel pogingen. Probeer het over een minuut opnieuw." },
      429,
    );
  }

  const body = await c.req.json().catch(() => null);
  const user = typeof body?.user === "string" ? body.user : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyCredentials(user, password)) {
    return c.json(
      { error: "Onjuiste gebruikersnaam of wachtwoord" },
      401,
    );
  }

  setCookie(c, AUTH_COOKIE, `${user}.${signUser(user)}`, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30,
  });
  return c.json({ ok: true });
});

authRoutes.post("/logout", (c) => {
  setCookie(c, AUTH_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return c.json({ ok: true });
});
