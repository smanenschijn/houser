import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/server/auth";
import { runSearchProfile, runAllEnabledProfiles } from "@/lib/importFunda";

const profileSchema = z.object({
  name: z.string().min(1),
  cities: z.array(z.string().min(1)).min(1),
  priceMin: z.number().min(0).nullable().optional(),
  priceMax: z.number().min(0).nullable().optional(),
  objectTypes: z.array(z.string()).optional(),
  livingAreaMin: z.number().min(0).nullable().optional(),
  enabled: z.boolean().optional(),
});

export const searchProfilesRoutes = new Hono();

searchProfilesRoutes.use("*", requireAuth);

searchProfilesRoutes.get("/", async (c) => {
  const profiles = await prisma.searchProfile.findMany({
    orderBy: { createdAt: "asc" },
  });
  return c.json({ profiles });
});

searchProfilesRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ongeldige zoekopdracht" }, 400);
  }

  const profile = await prisma.searchProfile.create({
    data: {
      name: parsed.data.name,
      cities: parsed.data.cities,
      priceMin: parsed.data.priceMin ?? null,
      priceMax: parsed.data.priceMax ?? null,
      objectTypes: parsed.data.objectTypes ?? ["house"],
      livingAreaMin: parsed.data.livingAreaMin ?? null,
      enabled: parsed.data.enabled ?? true,
    },
  });

  return c.json({ profile }, 201);
});

searchProfilesRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ongeldige zoekopdracht" }, 400);
  }

  const existing = await prisma.searchProfile.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Zoekopdracht niet gevonden" }, 404);
  }

  const profile = await prisma.searchProfile.update({
    where: { id },
    data: {
      name: parsed.data.name,
      cities: parsed.data.cities,
      priceMin: parsed.data.priceMin ?? null,
      priceMax: parsed.data.priceMax ?? null,
      objectTypes: parsed.data.objectTypes ?? ["house"],
      livingAreaMin: parsed.data.livingAreaMin ?? null,
      enabled: parsed.data.enabled ?? existing.enabled,
    },
  });

  return c.json({ profile });
});

searchProfilesRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.searchProfile.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Zoekopdracht niet gevonden" }, 404);
  }

  await prisma.searchProfile.delete({ where: { id } });
  return c.json({ ok: true });
});

searchProfilesRoutes.post("/run-all", async (c) => {
  runAllEnabledProfiles().catch((err) => {
    console.error(`[search-profiles] run-all:`, err);
  });
  return c.json({ ok: true });
});

searchProfilesRoutes.post("/:id/run", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.searchProfile.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Zoekopdracht niet gevonden" }, 404);
  }

  runSearchProfile(id).catch((err) => {
    console.error(`[search-profiles] run ${id}:`, err);
  });

  return c.json({ ok: true });
});
