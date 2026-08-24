import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import path from "node:path";
import { authRoutes } from "@/server/routes/auth";
import { housesRoutes } from "@/server/routes/houses";
import { criteriaRoutes } from "@/server/routes/criteria";
import { searchProfilesRoutes } from "@/server/routes/search-profiles";
import { uploadsRoutes } from "@/server/routes/uploads";
import { requireAuth } from "@/server/auth";

export function createApp() {
  const app = new Hono();

  app.route("/api", authRoutes);

  app.use("/api/*", requireAuth);
  app.route("/api/houses", housesRoutes);
  app.route("/api/criteria", criteriaRoutes);
  app.route("/api/search-profiles", searchProfilesRoutes);

  app.use("/uploads/*", requireAuth);
  app.route("/uploads", uploadsRoutes);

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(import.meta.dir, "../../dist");
    app.use("*", serveStatic({ root: distDir }));
    app.get("*", (c) => {
      if (
        c.req.path.startsWith("/api/") ||
        c.req.path.startsWith("/uploads/")
      ) {
        return c.json({ error: "Not found" }, 404);
      }
      return new Response(Bun.file(path.join(distDir, "index.html")));
    });
  }

  return app;
}
