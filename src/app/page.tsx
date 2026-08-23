import { prisma } from "@/lib/db";
import UploadForm from "@/components/UploadForm";
import HouseTile from "@/components/HouseTile";
import StreetScene from "@/components/StreetScene";
import type { HouseDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const houses = await prisma.house.findMany({
    orderBy: { createdAt: "desc" },
    include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const data: HouseDTO[] = houses.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    energyLabel: h.energyLabel,
    livingArea: h.livingArea,
    plotSize: h.plotSize,
    price: h.price,
    address: h.address,
    imagePath: h.imagePath,
    images: h.images ?? [],
    sourceFileName: h.sourceFileName,
    status: h.status,
    error: h.error,
    progress: h.progress,
    progressLabel: h.progressLabel,
    documentAnalysis: (h.documentAnalysis as HouseDTO["documentAnalysis"]) ?? null,
    createdAt: h.createdAt.toISOString(),
    scores: h.scores.map((s) => ({
      id: s.id,
      total: s.total,
      criteriaSnapshot: (s.criteriaSnapshot as HouseDTO["scores"][number]["criteriaSnapshot"]) ?? [],
      rationale: s.rationale,
      createdAt: s.createdAt.toISOString(),
    })),
  }));

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

      {data.length === 0 ? (
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
          {data.map((house) => (
            <HouseTile key={house.id} house={house} />
          ))}
        </div>
      )}
    </div>
  );
}
