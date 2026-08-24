import { useQuery } from "@tanstack/react-query";
import UploadForm from "@/client/components/UploadForm";
import HouseTile from "@/client/components/HouseTile";
import StreetScene from "@/client/components/StreetScene";
import type { HouseDTO } from "@/lib/types";
import { api } from "@/client/lib/api";

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["houses"],
    queryFn: () => api.get<{ houses: HouseDTO[] }>("/api/houses"),
  });

  const houses = data?.houses ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Huizen vergelijken
        </h1>
        <p className="mt-1 text-sm text-brand-700">
          Upload je brochures en vind in één oogopslag jouw droomhuis.
        </p>
      </div>

      <div className="mb-8">
        <UploadForm />
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
          <StreetScene className="w-full max-w-md" />
          <p className="mt-6 font-display text-lg font-medium text-brand-900">
            Nog geen huizen op de kaart
          </p>
          <p className="mt-1 text-sm text-brand-700">
            Upload een PDF-brochure om te beginnen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <HouseTile key={house.id} house={house} />
          ))}
        </div>
      )}
    </div>
  );
}
