import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/server/auth";

const schoolsSchema = z.array(
  z.object({
    name: z.string().min(1),
    address: z.string().min(1),
  }),
);

export const schoolsRoutes = new Hono();

schoolsRoutes.use("*", requireAuth);

schoolsRoutes.get("/", async (c) => {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "asc" },
  });
  return c.json({ schools });
});

schoolsRoutes.put("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = schoolsSchema.safeParse(body.schools);

  if (!parsed.success) {
    return c.json({ error: "Ongeldige scholen" }, 400);
  }

  await prisma.$transaction([
    prisma.school.deleteMany(),
    prisma.school.createMany({
      data: parsed.data.map((s) => ({
        name: s.name,
        address: s.address,
      })),
    }),
  ]);

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "asc" },
  });
  return c.json({ schools });
});
