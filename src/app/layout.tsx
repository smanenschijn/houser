import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";
import { AUTH_COOKIE, isValidAuthToken } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Houser — Huizen vergelijken",
  description: "Vergelijk huizen op basis van PDF-brochures",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const authed = isValidAuthToken(cookieStore.get(AUTH_COOKIE)?.value);

  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {authed && (
          <header className="sticky top-0 z-20 border-b border-cream-200 bg-cream-50/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="transition-opacity hover:opacity-80">
                <Logo size={38} />
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                  Huizen
                </Link>
                <Link
                  href="/criteria"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                  Scorecriteria
                </Link>
                <LogoutButton />
              </nav>
            </div>
          </header>
        )}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
