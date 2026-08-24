import { Navigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api } from "@/client/lib/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ authed: boolean }>("/api/me"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-24">
        <svg
          className="h-6 w-6 animate-spin text-brand-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (!data?.authed) {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
}
