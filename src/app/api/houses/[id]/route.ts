import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteUploadedImages } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return NextResponse.json({ error: "Huis niet gevonden" }, { status: 404 });
  }
  return NextResponse.json({
    house: {
      id: house.id,
      status: house.status,
      error: house.error,
      progress: house.progress,
      progressLabel: house.progressLabel,
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return NextResponse.json({ error: "Huis niet gevonden" }, { status: 404 });
  }

  await deleteUploadedImages([house.imagePath, ...house.images]);
  await prisma.house.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
