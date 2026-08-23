import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreHouseAndStore } from "@/lib/score";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return NextResponse.json({ error: "Huis niet gevonden" }, { status: 404 });
  }

  await prisma.house.update({
    where: { id },
    data: { status: "scoring", error: null },
  });

  try {
    const outcome = await scoreHouseAndStore(id);
    await prisma.house.update({
      where: { id },
      data: { status: "ready", error: null },
    });
    if (!outcome) {
      return NextResponse.json(
        { error: "Nog geen criteria ingesteld" },
        { status: 400 },
      );
    }
    return NextResponse.json({ score: outcome.score, result: outcome.result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoren mislukt";
    await prisma.house
      .update({ where: { id }, data: { status: "error", error: message } })
      .catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
