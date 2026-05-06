import OpenAI from "openai";
import { writeFileSync, unlinkSync, createReadStream } from "fs";
import { log, logError } from "./logger.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const tempFile = `/tmp/audio_${Date.now()}.wav`;

  try {
    log("🎙️ Transcribiendo audio con Whisper...");

    // Guardar buffer a archivo temporal
    writeFileSync(tempFile, audioBuffer);

    // Leer y transcribir
    const fileStream = createReadStream(tempFile);

    const response = await openai.audio.transcriptions.create({
      file: fileStream as any,
      model: "whisper-1",
      language: "es",
    });

    log(`✅ Transcripción: "${response.text}"`);
    return response.text;
  } catch (error) {
    logError("Error en transcribeAudio", error);
    throw error;
  } finally {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // ignore
    }
  }
}

export async function synthesizeVoice(text: string): Promise<Buffer> {
  try {
    log(`🔊 Sintetizando voz para: "${text.substring(0, 50)}..."`);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY not set");
    }

    const voiceId = "21m00Tcm4TlvDq8ikWAM";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs error: ${error}`);
    }

    const audioBuffer = await response.arrayBuffer();
    log(`✅ Audio sintetizado: ${audioBuffer.byteLength} bytes`);

    return Buffer.from(audioBuffer);
  } catch (error) {
    logError("Error en synthesizeVoice", error);
    throw error;
  }
}
