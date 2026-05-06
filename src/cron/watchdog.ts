import { log, logError } from "../lib/logger.js";

const HEALTH_URL = "http://localhost:3141/health";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 min
const MAX_FAILURES = 3;

let failureCount = 0;

export async function startWatchdog(): Promise<void> {
  log("👀 Watchdog iniciado (check cada 5 min)");

  setInterval(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(HEALTH_URL, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        log("✅ Anelys health: OK");
        failureCount = 0;
      } else {
        failureCount++;
        logError(`⚠️ Health check falló (${failureCount}/${MAX_FAILURES})`);

        if (failureCount >= MAX_FAILURES) {
          log("🔴 Anelys no responde. Reiniciando...", "warn");
          process.exit(1);
        }
      }
    } catch (error) {
      failureCount++;
      logError(`⚠️ Watchdog error (${failureCount}/${MAX_FAILURES})`, error);

      if (failureCount >= MAX_FAILURES) {
        log("🔴 Anelys crítico. Reiniciando...", "warn");
        process.exit(1);
      }
    }
  }, CHECK_INTERVAL);
}
