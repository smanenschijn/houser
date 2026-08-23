import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { processHouse } from "@/lib/process";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  const houses = await prisma.house.findMany({
    orderBy: { createdAt: "desc" },
    include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ houses });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand geüpload" }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Upload een PDF-bestand" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const house = await prisma.house.create({
    data: { sourceFileName: file.name, status: "processing" },
  });

  after(async () => {
    await processHouse(house.id, buffer);
  });

  return NextResponse.json(
    { house: { id: house.id, status: house.status } },
    { status: 201 },
  );
}
