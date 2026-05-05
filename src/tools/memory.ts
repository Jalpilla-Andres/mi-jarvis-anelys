import { rememberFact, recallFacts } from "../lib/memory.js";
import { log } from "../lib/logger.js";

export async function handleRemember(params: {
  fact: string;
  category?: string;
  tags?: string[];
  pinned?: boolean;
}): Promise<string> {
  const result = await rememberFact(
    params.fact,
    params.category,
    params.tags || [],
    undefined,
    params.pinned || false
  );

  if (!result) {
    return "Error: No se pudo guardar la memoria";
  }

  return `✅ Memoria guardada: "${params.fact}"`;
}

export async function handleRecall(params: {
  query: string;
  limit?: number;
}): Promise<string> {
  const facts = await recallFacts(params.query, params.limit || 5);

  if (facts.length === 0) {
    return `No encontré memorias sobre: "${params.query}"`;
  }

  const formatted = facts
    .map((f) => `- ${f.fact}${f.pinned ? " 📌" : ""}`)
    .join("\n");

  return `Encontré ${facts.length} memorias:\n${formatted}`;
}
