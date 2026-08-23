import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteUploadedImages } from "@/lib/uploads";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const imagePath =
    typeof body?.imagePath === "string" ? body.imagePath : null;

  if (!imagePath) {
    return NextResponse.json(
      { error: "Geen afbeelding opgegeven" },
      { status: 400 },
    );
  }

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return NextResponse.json({ error: "Huis niet gevonden" }, { status: 404 });
  }

  if (!house.images.includes(imagePath)) {
    return NextResponse.json(
      { error: "Afbeelding hoort niet bij dit huis" },
      { status: 400 },
    );
  }

  await prisma.house.update({ where: { id }, data: { imagePath } });

  return NextResponse.json({ ok: true, imagePath });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const imagePath =
    typeof body?.imagePath === "string" ? body.imagePath : null;

  if (!imagePath) {
    return NextResponse.json(
      { error: "Geen afbeelding opgegeven" },
      { status: 400 },
    );
  }

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return NextResponse.json({ error: "Huis niet gevonden" }, { status: 404 });
  }

  if (!house.images.includes(imagePath)) {
    return NextResponse.json(
      { error: "Afbeelding hoort niet bij dit huis" },
      { status: 400 },
    );
  }

  const images = house.images.filter((img) => img !== imagePath);
  const imagePathUpdate =
    house.imagePath === imagePath ? (images[0] ?? null) : house.imagePath;

  await deleteUploadedImages([imagePath]);
  await prisma.house.update({
    where: { id },
    data: { images, imagePath: imagePathUpdate },
  });

  return NextResponse.json({ ok: true, imagePath: imagePathUpdate });
}
