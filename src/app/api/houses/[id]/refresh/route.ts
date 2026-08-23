import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractHouseFromText } from "@/lib/ai";
import { analyzeDocumentsAndStore } from "@/lib/documents";

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

  if (!house.rawText) {
    return NextResponse.json(
      { error: "Geen brochuretekst beschikbaar" },
      { status: 400 },
    );
  }

  await prisma.house.update({
    where: { id },
    data: { status: "refreshing", error: null },
  });

  try {
    const extracted = await extractHouseFromText(house.rawText);

    await prisma.house.update({
      where: { id },
      data: {
        title: extracted.title,
        description: extracted.description,
        energyLabel: extracted.energyLabel,
        livingArea: extracted.livingArea,
        plotSize: extracted.plotSize,
        price: extracted.price,
        address: extracted.address,
      },
    });

    let documentAnalysis = null;
    try {
      documentAnalysis = await analyzeDocumentsAndStore(id, house.rawText);
    } catch (err) {
      console.error(`[refresh] document analysis ${id}: ${err}`);
    }

    await prisma.house.update({
      where: { id },
      data: { status: "ready", error: null },
    });

    return NextResponse.json({ house: { ...extracted, documentAnalysis } });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Tekstgegevens verversen mislukt";
    await prisma.house
      .update({ where: { id }, data: { status: "error", error: message } })
      .catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
