import { Hono } from "hono";
import path from "node:path";
import fs from "node:fs";
import { getUploadDir } from "@/lib/uploads";

export const uploadsRoutes = new Hono();

uploadsRoutes.get("/*", (c) => {
  const rel = c.req.path.slice("/uploads/".length);
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, rel);
  const resolved = path.resolve(filePath);
  const base = path.resolve(uploadDir);

  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    return c.text("Not found", 404);
  }

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === ".png" ? "image/png" : "image/jpeg";
    return new Response(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return c.text("Not found", 404);
  }
});
