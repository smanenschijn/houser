import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const criteriaSchema = z.array(
  z.object({
    name: z.string().min(1),
    weight: z.number().min(0).max(100),
    description: z.string().nullable().optional(),
  }),
);

export async function GET() {
  const criteria = await prisma.criteria.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ criteria });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = criteriaSchema.safeParse(body.criteria);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ongeldige criteria" },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.criteria.deleteMany(),
    prisma.criteria.createMany({
      data: parsed.data.map((c) => ({
        name: c.name,
        weight: c.weight,
        description: c.description ?? null,
      })),
    }),
  ]);

  const criteria = await prisma.criteria.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ criteria });
}
