import { obsidianSearch, obsidianRead } from "../lib/obsidian.js";

export async function handleObsidianSearch(params: {
  query: string;
  limit?: number;
}): Promise<string> {
  const notes = await obsidianSearch(params.query, params.limit || 5);

  if (notes.length === 0) {
    return `No encontré notas sobre: "${params.query}"`;
  }

  const formatted = notes
    .map(
      (n, i) =>
        `${i + 1}. **${n.title}**\n   ${n.excerpt}...\n   📁 ${n.path}`
    )
    .join("\n\n");

  return `Encontré ${notes.length} notas en Obsidian:\n\n${formatted}`;
}

export async function handleObsidianRead(params: {
  path: string;
}): Promise<string> {
  const content = await obsidianRead(params.path);

  if (!content) {
    return `Error: no se pudo leer ${params.path}`;
  }

  // Limitar a 1000 caracteres para respuestas
  const excerpt = content.substring(0, 1000);
  return `📖 **${params.path}**:\n\n${excerpt}${content.length > 1000 ? "\n\n[... contenido truncado]" : ""}`;
}
