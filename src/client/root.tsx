import { useState } from "react";
import { Link, Outlet } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Logo from "@/client/components/Logo";
import LogoutButton from "@/client/components/LogoutButton";
import UploadForm from "@/client/components/UploadForm";
import { api } from "@/client/lib/api";

export function RootLayout() {
  const queryClient = useQueryClient();
  const [scraping, setScraping] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ authed: boolean }>("/api/me"),
  });
  const authed = Boolean(data?.authed);

  async function handleScrapeNow() {
    setScraping(true);
    try {
      await api.post("/api/search-profiles/run-all");
      queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
    } catch {
      // best-effort; errors are surfaced on the Zoekopdrachten page
    } finally {
      setScraping(false);
    }
  }

  const linkClass =
    "rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-cream-200 bg-cream-50/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo size={38} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/" className={linkClass}>
              Huizen
            </Link>
            <Link to="/archive" className={linkClass}>
              Archief
            </Link>
            {authed && (
              <>
                <Link to="/criteria" className={linkClass}>
                  Scorecriteria
                </Link>
                <Link to="/search-profiles" className={linkClass}>
                  Zoekopdrachten
                </Link>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="stroke-current"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Upload
                </button>
                <button
                  onClick={handleScrapeNow}
                  disabled={scraping}
                  className="ml-2 flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {scraping && (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {scraping ? "Scrapen…" : "Nu scrapen"}
                </button>
                <LogoutButton />
              </>
            )}
            {!authed && (
              <Link
                to="/login"
                className="ml-2 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
              >
                Inloggen
              </Link>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
            aria-expanded={menuOpen}
            className="flex items-center justify-center rounded-full p-2 text-brand-700 hover:bg-brand-100 md:hidden"
          >
            {menuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="stroke-current"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="stroke-current"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-cream-200 bg-cream-50 px-4 py-3 md:hidden">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              Huizen
            </Link>
            <Link
              to="/archive"
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              Archief
            </Link>
            {authed && (
              <>
                <Link
                  to="/criteria"
                  onClick={() => setMenuOpen(false)}
                  className={linkClass}
                >
                  Scorecriteria
                </Link>
                <Link
                  to="/search-profiles"
                  onClick={() => setMenuOpen(false)}
                  className={linkClass}
                >
                  Zoekopdrachten
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowUpload(true);
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="stroke-current"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Upload
                </button>
                <button
                  onClick={handleScrapeNow}
                  disabled={scraping}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {scraping && (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {scraping ? "Scrapen…" : "Nu scrapen"}
                </button>
                <LogoutButton />
              </>
            )}
            {!authed && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center rounded-full bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
              >
                Inloggen
              </Link>
            )}
          </nav>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>

      {authed && showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 p-4 backdrop-blur-sm"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-brand-900">
                PDF-brochure uploaden
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                aria-label="Sluiten"
                className="rounded-full p-1 text-brand-500 hover:bg-brand-100"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="stroke-current"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <UploadForm onSuccess={() => setShowUpload(false)} />
          </div>
        </div>
      )}
    </>
  );
}
