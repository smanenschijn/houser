import { createApp } from "@/server/app";
import { startScheduler } from "@/lib/scheduler";

const app = createApp();

startScheduler();

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: "0.0.0.0",
  maxRequestBodySize: 25 * 1024 * 1024,
  fetch: app.fetch,
});

console.log(`Houser server listening on http://localhost:${server.port}`);
