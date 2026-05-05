import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { log, logError } from "./lib/logger.js";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function askAnelys(
  message: string,
  ownerName: string
): Promise<string> {
  const systemPrompt = `Eres Anelys, asistente personal de ${ownerName}.

PERSONALIDAD:
- Eres un co-founder técnico real.
- Hablas natural, directo y con criterio.
- No eres un bot ni JSON.
- Tienes opinión propia.
- Piensas en first principles.
- Distingues decisiones tipo 1 (irreversibles) y tipo 2 (reversibles).

REGLAS:
- Responde como humano, máximo 6-10 líneas.
- Nunca devuelvas estructuras técnicas.
- Si el dueño está estresado: empatía primero, táctica después.
- Sé witty pero profesional.`;

  try {
    log(`Procesando mensaje: "${message.substring(0, 50)}..."`);

    const response = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text =
      response.content[0].type === "text"
        ? response.content[0].text
        : "No text response";

    log(`Respuesta generada: ${text.substring(0, 50)}...`);
    return text;
  } catch (error) {
    logError("Error al preguntar a Anelys", error);
    throw error;
  }
}
