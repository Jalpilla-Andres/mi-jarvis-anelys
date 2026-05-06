import { Hono } from "hono";
import { transcribeAudio, synthesizeVoice } from "../lib/voice.js";
import { askAnelys } from "../brain.js";
import { log, logError } from "../lib/logger.js";

const app = new Hono();

app.post("/voice/turn", async (c) => {
  const auth = c.req.header("Authorization");
  const TRIGGER_SECRET = process.env.TRIGGER_SECRET || "dev-secret";

  if (auth !== `Bearer ${TRIGGER_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Recibir audio como multipart
    const formData = await c.req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return c.json({ error: "No audio file provided" }, 400);
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Paso 1: Transcribir
    log("🎙️ Iniciando pipeline de voz...");
    const transcript = await transcribeAudio(audioBuffer);

    // Paso 2: Preguntar a Anelys
    const response = await askAnelys(transcript, "Andres");

    // Paso 3: Sintetizar respuesta
    const audioResponse = await synthesizeVoice(response);

    // Retornar como audio
    return new Response(audioResponse, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Transcript": transcript,
        "X-Response": response,
      },
    });
  } catch (error) {
    logError("Error en /voice/turn", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
