import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { processHouse } from "@/lib/process";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

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
  const limit = rateLimit(`upload:${getClientIp(req)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Te veel uploads. Probeer het later opnieuw." },
      { status: 429 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand geüpload" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Bestand te groot" }, { status: 413 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Upload een PDF-bestand" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const header = buffer.subarray(0, 1024).toString("latin1");
  if (!header.includes("%PDF-")) {
    return NextResponse.json({ error: "Geen geldig PDF-bestand" }, { status: 400 });
  }
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
