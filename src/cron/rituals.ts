import cron from "node-cron";
import { log } from "../lib/logger.js";
import { askAnelys } from "../brain.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

async function sendTelegramMessage(message: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    log("Error enviando ritual a Telegram", "error");
  }
}

export function startRituals(): void {
  // Briefing matutino (Lun-Vie 9am)
  cron.schedule("0 9 * * 1-5", async () => {
    log("📋 Briefing matutino iniciado");
    const briefing = await askAnelys(
      "Dame un briefing: qué tengo que hacer hoy, qué eventos, qué tareas pendientes",
      "Andres"
    );
    await sendTelegramMessage(`<b>📋 Briefing Matutino</b>\n\n${briefing}`);
  });

  // Nudge tarde (Lun-Vie 4pm)
  cron.schedule("0 16 * * 1-5", async () => {
    log("⏰ Nudge tarde");
    const nudge = await askAnelys(
      "¿Cómo va el día? ¿Qué falta por hacer?",
      "Andres"
    );
    await sendTelegramMessage(`<b>⏰ Reminder Tarde</b>\n\n${nudge}`);
  });

  log("✅ Rituals iniciados");
}
