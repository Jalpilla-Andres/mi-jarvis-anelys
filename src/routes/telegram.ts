import { Hono } from "hono";
import { askAnelys } from "../brain.js";
import { log, logError } from "../lib/logger.js";

const app = new Hono();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;

async function sendTelegramMessage(message: string): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram error: ${response.statusText}`);
    }
    log(`📤 Mensaje enviado a Telegram`);
  } catch (error) {
    logError("Error enviando a Telegram", error);
  }
}

app.post("/webhook/telegram", async (c) => {
  const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  
  if (secret !== WEBHOOK_SECRET) {
    log("Intento webhook no autorizado", "warn");
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const message = body.message?.text;
    const chatId = body.message?.chat?.id;

    if (!message || chatId.toString() !== CHAT_ID) {
      return c.json({ ok: true });
    }

    log(`📨 Mensaje de Telegram: "${message}"`);

    const response = await askAnelys(message, "Andres");
    await sendTelegramMessage(`<b>Anelys:</b>\n${response}`);

    return c.json({ ok: true });
  } catch (error) {
    logError("Error en webhook Telegram", error);
    return c.json({ ok: false }, 500);
  }
});

export default app;
