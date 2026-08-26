import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HouseTile from "@/client/components/HouseTile";
import StreetScene from "@/client/components/StreetScene";
import type { HouseDTO } from "@/lib/types";
import { LISTING_STATUSES } from "@/lib/listingStatus";
import { api } from "@/client/lib/api";

type SortKey = "dateAdded" | "score" | "livingArea" | "plotSize";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "dateAdded", label: "Datum toegevoegd" },
  { value: "score", label: "Score" },
  { value: "livingArea", label: "Woonoppervlak" },
  { value: "plotSize", label: "Perceel" },
];

function sortValue(house: HouseDTO, sortKey: SortKey): number | null {
  switch (sortKey) {
    case "score":
      return house.scores[0]?.total ?? null;
    case "livingArea":
      return house.livingArea;
    case "plotSize":
      return house.plotSize;
    case "dateAdded":
      return new Date(house.createdAt).getTime();
  }
}

export function HomePage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("dateAdded");
  const { data, isLoading } = useQuery({
    queryKey: ["houses"],
    queryFn: () => api.get<{ houses: HouseDTO[] }>("/api/houses"),
  });

  const houses = (data?.houses ?? [])
    .filter((h) => statusFilter === "all" || h.listingStatus === statusFilter)
    .sort((a, b) => {
      const valueA = sortValue(a, sortKey);
      const valueB = sortValue(b, sortKey);
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;
      return valueB - valueA;
    });

  const hasListings = houses.length > 0;
  const total = data?.houses.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Huizen vergelijken
        </h1>
        <p className="mt-1 text-sm text-brand-700">
          Vind in één oogopslag jouw droomhuis.
        </p>
      </div>

      {!isLoading && total > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-brand-700">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          >
            <option value="all">Alle</option>
            {LISTING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="text-sm font-medium text-brand-700">
            Sorteren:
          </label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : hasListings ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <HouseTile key={house.id} house={house} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <StreetScene className="w-full max-w-md" />
          <p className="mt-6 font-display text-lg font-medium text-brand-900">
            {total === 0 ? "Nog geen huizen op de kaart" : "Geen huizen met deze status"}
          </p>
          <p className="mt-1 text-sm text-brand-700">
            {total === 0
              ? "Gebruik de uploadknop bovenaan om een PDF-brochure toe te voegen."
              : "Kies een andere status om meer huizen te zien."}
          </p>
        </div>
      )}
    </div>
  );
}
