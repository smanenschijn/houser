import Link from "next/link";
import { prisma } from "@/lib/db";
import CriteriaForm from "@/components/CriteriaForm";
import type { CriteriaDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CriteriaPage() {
  const criteria = await prisma.criteria.findMany({ orderBy: { createdAt: "asc" } });
  const dto: CriteriaDTO[] = criteria.map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.weight,
    description: c.description,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Scorecriteria
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          ← Terug naar huizen
        </Link>
      </div>
      <p className="mb-6 text-sm text-brand-700">
        Bepaal wat voor jou belangrijk is. Met de knop &quot;Scoren&quot; op elk huis
        beoordeel je het aan de hand van deze criteria op een schaal van 0–10.
      </p>
      <CriteriaForm initial={dto} />
    </div>
  );
}
