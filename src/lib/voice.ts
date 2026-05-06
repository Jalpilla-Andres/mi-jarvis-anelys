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
    writeFileSync(tempFile, audioBuffer);
    
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
    } catch (e) {}
  }
}

export async function synthesizeVoice(text: string): Promise<Buffer> {
  try {
    log(`🔊 Sintetizando voz...`);
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

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
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) throw new Error(`ElevenLabs: ${await response.text()}`);
    const audioBuffer = await response.arrayBuffer();
    log(`✅ Audio: ${audioBuffer.byteLength} bytes`);
    return Buffer.from(audioBuffer);
  } catch (error) {
    logError("Error en synthesizeVoice", error);
    throw error;
  }
}
