import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import CriteriaForm from "@/client/components/CriteriaForm";
import type { CriteriaDTO } from "@/lib/types";
import { api } from "@/client/lib/api";

export function CriteriaPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["criteria"],
    queryFn: () => api.get<{ criteria: CriteriaDTO[] }>("/api/criteria"),
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Scorecriteria
        </h1>
        <Link
          to="/"
          className="text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          ← Terug naar huizen
        </Link>
      </div>
      <p className="mb-6 text-sm text-brand-700">
        Bepaal wat voor jou belangrijk is. Met de knop &quot;Scoren&quot; op elk huis
        beoordeel je het aan de hand van deze criteria op een schaal van 0–10.
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <CriteriaForm initial={data?.criteria ?? []} />
      )}
    </div>
  );
}
