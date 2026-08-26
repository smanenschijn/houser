import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { HouseDTO } from "@/lib/types";
import { api } from "@/client/lib/api";
import { useAuth } from "@/client/lib/useAuth";

function formatEuro(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ArchivePage() {
  const queryClient = useQueryClient();
  const { authed } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["houses", "archive"],
    queryFn: () => api.get<{ houses: HouseDTO[] }>("/api/houses/archive"),
  });

  const houses = data?.houses ?? [];

  async function handleRestore(house: HouseDTO) {
    await api.post(`/api/houses/${house.id}/restore`);
    queryClient.invalidateQueries({ queryKey: ["houses", "archive"] });
    queryClient.invalidateQueries({ queryKey: ["houses"] });
  }

  async function handlePermanentDelete(house: HouseDTO) {
    if (
      !window.confirm(
        "Weet je zeker dat je dit huis definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.",
      )
    ) {
      return;
    }
    await api.del(`/api/houses/${house.id}/permanent`);
    queryClient.invalidateQueries({ queryKey: ["houses", "archive"] });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Archief
        </h1>
        <p className="mt-1 text-sm text-brand-700">
          Gearchiveerde huizen die je eerder hebt verwijderd. Herstel een huis
          om het terug op je lijst te zetten.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : houses.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="font-display text-lg font-medium text-brand-900">
            Geen gearchiveerde huizen
          </p>
          <p className="mt-1 text-sm text-brand-700">
            Huizen die je archiveert verschijnen hier, zodat je ze later kunt
            herstellen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {houses.map((house) => {
            const title =
              house.title ?? house.address ?? house.sourceFileName ?? "Huis";
            return (
              <div
                key={house.id}
                className="flex items-center gap-4 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm"
              >
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {house.imagePath ? (
                    <img
                      src={house.imagePath}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-brand-300">
                      Geen foto
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/houses/${house.id}`}
                    className="font-semibold text-brand-900 hover:underline"
                  >
                    {title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-brand-700">
                    <span className="font-medium text-brand-900">
                      {formatEuro(house.price)}
                    </span>
                    {house.livingArea != null && (
                      <span>{house.livingArea} m²</span>
                    )}
                    {house.archivedAt && (
                      <span className="text-brand-500">
                        Gearchiveerd op{" "}
                        {new Date(house.archivedAt).toLocaleDateString("nl-NL")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {authed && (
                    <>
                      <button
                        onClick={() => handleRestore(house)}
                        className="rounded-lg bg-leaf-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-leaf-600"
                      >
                        Herstellen
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(house)}
                        className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-200"
                      >
                        Definitief verwijderen
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
