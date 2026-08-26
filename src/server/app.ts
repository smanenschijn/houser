import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { serveStatic } from "hono/bun";
import path from "node:path";
import { authRoutes } from "@/server/routes/auth";
import { housesRoutes } from "@/server/routes/houses";
import { criteriaRoutes } from "@/server/routes/criteria";
import { schoolsRoutes } from "@/server/routes/schools";
import { searchProfilesRoutes } from "@/server/routes/search-profiles";
import { uploadsRoutes } from "@/server/routes/uploads";
import { injectPreviewTags } from "@/server/preview";

export function createApp() {
  const app = new Hono();

  app.route("/api", authRoutes);
  app.route("/api/houses", housesRoutes);
  app.route("/api/criteria", criteriaRoutes);
  app.route("/api/schools", schoolsRoutes);
  app.route("/api/search-profiles", searchProfilesRoutes);
  app.route("/uploads", uploadsRoutes);

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status);
    }
    console.error(`[server] ${c.req.method} ${c.req.path}:`, err);
    const message =
      err instanceof Error ? err.message : "Interne serverfout";
    return c.json({ error: message }, 500);
  });

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(import.meta.dir, "../../dist");
    app.use("*", serveStatic({ root: distDir }));
    app.get("*", async (c) => {
      if (
        c.req.path.startsWith("/api/") ||
        c.req.path.startsWith("/uploads/")
      ) {
        return c.json({ error: "Not found" }, 404);
      }
      const html = await Bun.file(path.join(distDir, "index.html")).text();
      return c.html(await injectPreviewTags(c, html));
    });
  }

  return app;
}
