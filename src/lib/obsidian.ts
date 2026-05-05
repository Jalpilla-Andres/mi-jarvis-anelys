import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { log, logError } from "./logger.js";

const OBSIDIAN_VAULT_PATH =
  "/mnt/c/Users/Jalpi/OneDrive/Documentos/Obsidian Vault";

export interface ObsidianNote {
  path: string;
  title: string;
  content: string;
  excerpt: string;
}

export async function obsidianSearch(
  query: string,
  limit: number = 5
): Promise<ObsidianNote[]> {
  try {
    log(`🔍 Buscando en Obsidian: "${query}"`);

    const results: ObsidianNote[] = [];
    const queryLower = query.toLowerCase();

    function walkDir(dir: string) {
      try {
        const files = readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
          if (results.length >= limit) return;

          const fullPath = join(dir, file.name);

          if (file.isDirectory()) {
            // Evitar carpetas especiales
            if (!file.name.startsWith(".")) {
              walkDir(fullPath);
            }
          } else if (file.name.endsWith(".md")) {
            try {
              const content = readFileSync(fullPath, "utf-8");
              const titleMatch =
                file.name.replace(".md", "") ||
                content.split("\n")[0].replace(/^#+\s/, "");

              if (
                content.toLowerCase().includes(queryLower) ||
                titleMatch.toLowerCase().includes(queryLower)
              ) {
                const lines = content.split("\n");
                const excerpt = lines.slice(0, 3).join(" ").substring(0, 200);

                results.push({
                  path: fullPath.replace(OBSIDIAN_VAULT_PATH, "").substring(1),
                  title: titleMatch,
                  content,
                  excerpt,
                });
              }
            } catch (e) {
              // Skip files that can't be read
            }
          }
        }
      } catch (e) {
        // Skip directories that can't be accessed
      }
    }

    walkDir(OBSIDIAN_VAULT_PATH);

    log(`✅ Encontradas ${results.length} notas en Obsidian`);
    return results;
  } catch (error) {
    logError("Error en obsidianSearch", error);
    return [];
  }
}

export async function obsidianRead(
  relativePath: string
): Promise<string | null> {
  try {
    // Security: prevent directory traversal
    if (relativePath.includes("..")) {
      logError("Intento de acceso no autorizado a Obsidian");
      return null;
    }

    const fullPath = join(OBSIDIAN_VAULT_PATH, relativePath);

    log(`📖 Leyendo: "${relativePath}"`);

    const content = readFileSync(fullPath, "utf-8");

    log(`✅ Nota leída: ${relativePath}`);
    return content;
  } catch (error) {
    logError(`Error al leer Obsidian: ${relativePath}`, error);
    return null;
  }
}
