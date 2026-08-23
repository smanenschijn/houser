import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { scoreHouse } from "@/lib/ai";

export async function scoreHouseAndStore(houseId: string) {
  const house = await prisma.house.findUnique({ where: { id: houseId } });
  if (!house) throw new Error("Huis niet gevonden");

  const criteria = await prisma.criteria.findMany({ orderBy: { createdAt: "asc" } });
  if (criteria.length === 0) return null;

  const result = await scoreHouse(house.rawText ?? "", house.description, criteria);

  const score = await prisma.score.create({
    data: {
      houseId,
      total: result.total,
      criteriaSnapshot: result.items as unknown as Prisma.InputJsonValue,
      rationale: result.summary,
    },
  });

  return { score, result };
}
