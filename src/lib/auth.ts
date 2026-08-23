import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "houser_auth";

export function signUser(user: string): string {
  return createHmac("sha256", process.env.APP_PASSWORD ?? "")
    .update(user)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.APP_USER && process.env.APP_PASSWORD);
}

export function isValidAuthToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const separator = token.indexOf(".");
  if (separator === -1) return false;
  const user = token.slice(0, separator);
  const mac = token.slice(separator + 1);
  if (user !== process.env.APP_USER) return false;
  return safeEqual(mac, signUser(user));
}

export function verifyCredentials(user: string, password: string): boolean {
  if (!isAuthConfigured()) return false;
  return (
    safeEqual(user, process.env.APP_USER ?? "") &&
    safeEqual(password, process.env.APP_PASSWORD ?? "")
  );
}

export function isValidBasicHeader(header: string | null): boolean {
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice("Basic ".length), "base64").toString(
      "utf8",
    );
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;
  return verifyCredentials(decoded.slice(0, separator), decoded.slice(separator + 1));
}
