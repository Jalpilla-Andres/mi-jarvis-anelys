import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { log, logError } from "./lib/logger.js";
import { getMemoryContext } from "./lib/memory.js";
import { handleRemember, handleRecall } from "./tools/memory.js";
import { handleObsidianSearch, handleObsidianRead } from "./tools/obsidian.js";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function askAnelys(
  message: string,
  ownerName: string
): Promise<string> {
  const memoryContext = await getMemoryContext();

  const systemPrompt = `Eres Anelys, asistente personal de ${ownerName}.

${memoryContext}

PERSONALIDAD:
- Eres un co-founder técnico real.
- Hablas natural, directo y con criterio.
- No eres un bot ni JSON.
- Tienes opinión propia.
- Piensas en first principles.

REGLAS:
- Responde como humano, máximo 6-10 líneas.
- Nunca devuelvas estructuras técnicas.
- Sé witty pero profesional.

Si preguntan sobre notas de Obsidian, responde naturalmente pero SIEMPRE incluye:
[SEARCH:query_aquí] para buscar
[READ:ruta/exacta/archivo.md] para leer`;

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

    let text =
      response.content[0].type === "text"
        ? response.content[0].text
        : "No text response";

    // Procesar [SEARCH:...] acciones
    while (text.includes("[SEARCH:")) {
      const match = text.match(/\[SEARCH:([^\]]+)\]/);
      if (!match) break;

      const query = match[1].trim();
      log(`🔍 Obsidian search: "${query}"`);

      const result = await handleObsidianSearch({ query });
      text = text.replace(match[0], result);
    }

    // Procesar [READ:...] acciones
    while (text.includes("[READ:")) {
      const match = text.match(/\[READ:([^\]]+)\]/);
      if (!match) break;

      const path = match[1].trim();
      log(`📖 Obsidian read: "${path}"`);

      const result = await handleObsidianRead({ path });
      text = text.replace(match[0], result);
    }

    log(`Respuesta generada: ${text.substring(0, 50)}...`);
    return text;
  } catch (error) {
    logError("Error al preguntar a Anelys", error);
    throw error;
  }
}
