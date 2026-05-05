import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { log, logError } from "./lib/logger.js";
import { getMemoryContext } from "./lib/memory.js";
import { handleRemember, handleRecall } from "./tools/memory.js";

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
- Distingues decisiones tipo 1 (irreversibles) y tipo 2 (reversibles).

REGLAS:
- Responde como humano, máximo 6-10 líneas.
- Nunca devuelvas estructuras técnicas.
- Si el dueño está estresado: empatía primero, táctica después.
- Sé witty pero profesional.
- PUEDES usar estas acciones:
  * Para RECORDAR algo: di "ACCIÓN: remember('hecho importante', category='general', pinned=true)"
  * Para BUSCAR algo que guardaste: di "ACCIÓN: recall('búsqueda aquí')"`;

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

    // Procesar acciones de memoria
    if (text.includes("ACCIÓN: remember")) {
      const rememberMatch = text.match(
        /ACCIÓN: remember\('([^']+)',\s*category='([^']+)',\s*pinned=(\w+)\)/
      );
      if (rememberMatch) {
        const [, fact, category, pinnedStr] = rememberMatch;
        const pinned = pinnedStr === "true";
        await handleRemember({ fact, category, pinned });
        text = text.replace(
          /ACCIÓN: remember\([^)]+\)/,
          `✅ [Guardé: ${fact}]`
        );
      }
    }

    if (text.includes("ACCIÓN: recall")) {
      const recallMatch = text.match(/ACCIÓN: recall\('([^']+)'\)/);
      if (recallMatch) {
        const [, query] = recallMatch;
        const result = await handleRecall({ query });
        text = text.replace(/ACCIÓN: recall\([^)]+\)/, result);
      }
    }

    log(`Respuesta generada: ${text.substring(0, 50)}...`);
    return text;
  } catch (error) {
    logError("Error al preguntar a Anelys", error);
    throw error;
  }
}
