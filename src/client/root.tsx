import { Link, Outlet } from "react-router";
import { useQuery } from "@tanstack/react-query";
import Logo from "@/client/components/Logo";
import LogoutButton from "@/client/components/LogoutButton";
import { api } from "@/client/lib/api";

export function RootLayout() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ authed: boolean }>("/api/me"),
  });
  const authed = Boolean(data?.authed);

  return (
    <>
      {authed && (
        <header className="sticky top-0 z-20 border-b border-cream-200 bg-cream-50/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <Logo size={38} />
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                Huizen
              </Link>
              <Link
                to="/criteria"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                Scorecriteria
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </header>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </>
  );
}
