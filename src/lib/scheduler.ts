import { Cron } from "croner";
import { runAllEnabledProfiles } from "@/lib/importFunda";

const DEFAULT_CRON = "0 7,12,17,21 * * *";
const TIMEZONE = "Europe/Amsterdam";

export function startScheduler(): Cron {
  const expr = process.env.FUNDA_CRON || DEFAULT_CRON;

  const job = new Cron(
    expr,
    { timezone: TIMEZONE, protect: true },
    () => {
      runAllEnabledProfiles().catch((err) => {
        console.error("[scheduler] Funda run failed:", err);
      });
    },
  );

  console.log(`[scheduler] Funda scraper scheduled at "${expr}" (${TIMEZONE})`);
  return job;
}
