import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { Context } from "hono";
import {
  AUTH_COOKIE,
  isAuthConfigured,
  isValidAuthToken,
  isValidBasicHeader,
} from "@/lib/auth";

export function isAuthorized(c: Context): boolean {
  if (!isAuthConfigured()) return false;
  const token = getCookie(c, AUTH_COOKIE);
  if (isValidAuthToken(token)) return true;
  return isValidBasicHeader(c.req.header("authorization") ?? null);
}

export const requireAuth = createMiddleware(async (c, next) => {
  if (!isAuthorized(c)) {
    return c.json({ error: "Niet geauthenticeerd" }, 401);
  }
  await next();
});
