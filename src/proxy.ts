import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE,
  isAuthConfigured,
  isValidAuthToken,
  isValidBasicHeader,
} from "@/lib/auth";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const PUBLIC_PATHS = new Set(["/login", "/api/login", "/api/logout"]);

function isAuthorized(request: NextRequest): boolean {
  if (!isAuthConfigured()) return false;
  return (
    isValidAuthToken(request.cookies.get(AUTH_COOKIE)?.value) ||
    isValidBasicHeader(request.headers.get("authorization"))
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (isAuthorized(request)) {
    if (pathname === "/api/houses" && method === "POST") {
      const length = Number(request.headers.get("content-length"));
      if (length > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Bestand te groot" }, { status: 413 });
      }
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Niet geauthenticeerd" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
