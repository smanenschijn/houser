import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { scoreHouse } from "@/lib/ai";

export async function scoreHouseAndStore(houseId: string) {
  const house = await prisma.house.findUnique({ where: { id: houseId } });
  if (!house) throw new Error("Huis niet gevonden");

  const criteria = await prisma.criteria.findMany({ orderBy: { createdAt: "asc" } });
  if (criteria.length === 0) return null;

  const schools = await prisma.school.findMany({ orderBy: { createdAt: "asc" } });

  const result = await scoreHouse(
    house.rawText ?? "",
    house.description,
    criteria,
    house.address,
    house.price,
    schools.map((s) => ({ name: s.name, address: s.address })),
  );

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

export async function rescoreAllHouses() {
  const houses = await prisma.house.findMany({
    where: { rawText: { not: null } },
    select: { id: true },
  });

  let scored = 0;
  for (const house of houses) {
    try {
      await scoreHouseAndStore(house.id);
      await prisma.house.update({
        where: { id: house.id },
        data: { status: "ready", error: null },
      });
      scored++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Scoren mislukt";
      console.error(`[rescoreAllHouses] ${house.id}: ${err}`);
      await prisma.house
        .update({ where: { id: house.id }, data: { status: "error", error: message } })
        .catch(() => {});
    }
  }

  return { count: scored };
}
