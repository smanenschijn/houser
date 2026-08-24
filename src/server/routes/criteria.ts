import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@/lib/db";

const criteriaSchema = z.array(
  z.object({
    name: z.string().min(1),
    weight: z.number().min(0).max(100),
    description: z.string().nullable().optional(),
  }),
);

export const criteriaRoutes = new Hono();

criteriaRoutes.get("/", async (c) => {
  const criteria = await prisma.criteria.findMany({
    orderBy: { createdAt: "asc" },
  });
  return c.json({ criteria });
});

criteriaRoutes.put("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = criteriaSchema.safeParse(body.criteria);

  if (!parsed.success) {
    return c.json({ error: "Ongeldige criteria" }, 400);
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

  const criteria = await prisma.criteria.findMany({
    orderBy: { createdAt: "asc" },
  });
  return c.json({ criteria });
});
