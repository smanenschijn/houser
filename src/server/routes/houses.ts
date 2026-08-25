import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { processHouse } from "@/lib/process";
import { analyzeUploadedDocumentAndStore } from "@/lib/documents";
import { parsePdfText } from "@/lib/pdf";
import { scoreHouseAndStore, rescoreAllHouses } from "@/lib/score";
import { refreshFundaHouse } from "@/lib/importFunda";
import { deleteUploadedImages } from "@/lib/uploads";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { geocodeAddress } from "@/lib/geocode";
import type { DocumentSectionType } from "@/lib/types";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const DOCUMENT_TYPES: DocumentSectionType[] = [
  "energyLabel",
  "questionnaire",
  "itemsList",
];

export const housesRoutes = new Hono();

housesRoutes.get("/", async (c) => {
  const houses = await prisma.house.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return c.json({ houses });
});

housesRoutes.get("/archive", async (c) => {
  const houses = await prisma.house.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
    include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return c.json({ houses });
});

housesRoutes.post("/", async (c) => {
  const limit = rateLimit(`upload:${getClientIp(c.req.raw)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) {
    return c.json(
      { error: "Te veel uploads. Probeer het later opnieuw." },
      429,
    );
  }

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return c.json({ error: "Geen bestand geüpload" }, 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: "Bestand te groot" }, 413);
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return c.json({ error: "Upload een PDF-bestand" }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const header = buffer.subarray(0, 1024).toString("latin1");
  if (!header.includes("%PDF-")) {
    return c.json({ error: "Geen geldig PDF-bestand" }, 400);
  }

  const house = await prisma.house.create({
    data: { sourceFileName: file.name, status: "processing" },
  });

  processHouse(house.id, buffer).catch((err) => {
    console.error(`[upload] processHouse ${house.id}:`, err);
  });

  return c.json({ house: { id: house.id, status: house.status } }, 201);
});

housesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const house = await prisma.house.findUnique({
    where: { id },
    include: { scores: { orderBy: { createdAt: "desc" } } },
  });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }
  return c.json({ house });
});

housesRoutes.post("/:id/seen", async (c) => {
  const id = c.req.param("id");
  const house = await prisma.house.findUnique({
    where: { id },
    select: { id: true, isNew: true },
  });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }
  if (house.isNew) {
    await prisma.house.update({ where: { id }, data: { isNew: false } });
  }
  return c.json({ ok: true });
});

housesRoutes.post("/:id/geocode", async (c) => {
  const id = c.req.param("id");
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }
  if (house.latitude != null && house.longitude != null) {
    return c.json({ latitude: house.latitude, longitude: house.longitude });
  }
  if (!house.address) {
    return c.json({ latitude: null, longitude: null });
  }
  const coords = await geocodeAddress(house.address);
  if (coords) {
    await prisma.house
      .update({
        where: { id: house.id },
        data: { latitude: coords.latitude, longitude: coords.longitude },
      })
      .catch(() => {});
  }
  return c.json(coords ?? { latitude: null, longitude: null });
});

housesRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }

  if (house.archivedAt) {
    return c.json({ ok: true });
  }

  await prisma.house.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  return c.json({ ok: true });
});

housesRoutes.post("/:id/restore", async (c) => {
  const id = c.req.param("id");
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }

  await prisma.house.update({
    where: { id },
    data: { archivedAt: null },
  });

  return c.json({ ok: true });
});

housesRoutes.delete("/:id/permanent", async (c) => {
  const id = c.req.param("id");
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }

  await deleteUploadedImages([house.imagePath, ...house.images]);
  await prisma.house.delete({ where: { id } });

  return c.json({ ok: true });
});

housesRoutes.patch("/:id/image", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const imagePath = typeof body?.imagePath === "string" ? body.imagePath : null;

  if (!imagePath) {
    return c.json({ error: "Geen afbeelding opgegeven" }, 400);
  }

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }

  if (!house.images.includes(imagePath)) {
    return c.json({ error: "Afbeelding hoort niet bij dit huis" }, 400);
  }

  await prisma.house.update({ where: { id }, data: { imagePath } });

  return c.json({ ok: true, imagePath });
});

housesRoutes.delete("/:id/image", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const imagePath = typeof body?.imagePath === "string" ? body.imagePath : null;

  if (!imagePath) {
    return c.json({ error: "Geen afbeelding opgegeven" }, 400);
  }

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }

  if (!house.images.includes(imagePath)) {
    return c.json({ error: "Afbeelding hoort niet bij dit huis" }, 400);
  }

  const images = house.images.filter((img) => img !== imagePath);
  const imagePathUpdate =
    house.imagePath === imagePath ? (images[0] ?? null) : house.imagePath;

  await deleteUploadedImages([imagePath]);
  await prisma.house.update({
    where: { id },
    data: { images, imagePath: imagePathUpdate },
  });

  return c.json({ ok: true, imagePath: imagePathUpdate });
});

housesRoutes.post("/:id/documents/:type", async (c) => {
  const id = c.req.param("id");
  const type = c.req.param("type") as DocumentSectionType;

  if (!DOCUMENT_TYPES.includes(type)) {
    return c.json({ error: "Ongeldig documenttype" }, 400);
  }

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return c.json({ error: "Geen bestand geüpload" }, 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: "Bestand te groot" }, 413);
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return c.json({ error: "Upload een PDF-bestand" }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const header = buffer.subarray(0, 1024).toString("latin1");
  if (!header.includes("%PDF-")) {
    return c.json({ error: "Geen geldig PDF-bestand" }, 400);
  }

  const text = await parsePdfText(buffer);

  const documentAnalysis = await analyzeUploadedDocumentAndStore(id, type, text);

  return c.json({ documentAnalysis });
});

housesRoutes.post("/:id/refresh", async (c) => {
  const id = c.req.param("id");

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
  }

  if (house.source !== "funda" || !house.fundaUrl) {
    return c.json({ error: "Alleen Funda-huizen kunnen worden ververst" }, 400);
  }

  await prisma.house.update({
    where: { id },
    data: { status: "refreshing", error: null },
  });

  refreshFundaHouse(id).catch((err) => {
    const message =
      err instanceof Error ? err.message : "Huis verversen mislukt";
    console.error(`[refresh] ${id}: ${message}`);
    prisma.house
      .update({ where: { id }, data: { status: "error", error: message } })
      .catch(() => {});
  });

  return c.json({ ok: true });
});

housesRoutes.post("/rescore-all", async (c) => {
  const houses = await prisma.house.findMany({
    where: { rawText: { not: null }, archivedAt: null },
    select: { id: true },
  });

  if (houses.length === 0) {
    return c.json({ ok: true, count: 0 });
  }

  const ids = houses.map((h) => h.id);
  await prisma.house.updateMany({
    where: { id: { in: ids } },
    data: { status: "scoring", error: null },
  });

  rescoreAllHouses().catch((err) => {
    console.error(`[rescore-all] ${err}`);
  });

  return c.json({ ok: true, count: ids.length });
});

housesRoutes.post("/:id/score", async (c) => {
  const id = c.req.param("id");

  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) {
    return c.json({ error: "Huis niet gevonden" }, 404);
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
      return c.json({ error: "Nog geen criteria ingesteld" }, 400);
    }
    return c.json({ score: outcome.score, result: outcome.result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoren mislukt";
    await prisma.house
      .update({ where: { id }, data: { status: "error", error: message } })
      .catch(() => {});
    return c.json({ error: message }, 500);
  }
});
