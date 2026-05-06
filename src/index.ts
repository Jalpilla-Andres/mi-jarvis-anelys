import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { readFileSync } from "fs";
import { askAnelys } from "./brain.js";
import { log, logError } from "./lib/logger.js";
import voiceRouter from "./routes/voice.js";

const app = new Hono();

const OWNER_NAME = "Andres";
const TRIGGER_SECRET = process.env.TRIGGER_SECRET || "dev-secret";

// Servir voice.html
app.get("/", (c) => {
  const html = readFileSync("./public/voice.html", "utf-8");
  return c.html(html);
});

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    name: "Anelys",
  });
});

// Chat endpoint
app.post("/api/chat", async (c) => {
  const auth = c.req.header("Authorization");
  if (auth !== `Bearer ${TRIGGER_SECRET}`) {
    log("Intento de acceso no autorizado", "warn");
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const body = await c.req.json();
    const message = body.message || "";
    if (!message) {
      return c.json({ error: "Message required" }, 400);
    }
    const response = await askAnelys(message, OWNER_NAME);
    return c.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    logError("Error en /api/chat", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Voice routes
app.route("/api", voiceRouter);

const port = 3141;
serve({ fetch: app.fetch, port });

log(`🤖 Anelys corriendo en http://localhost:${port}`);
log(`🎙️ Voice: http://localhost:${port}`);
