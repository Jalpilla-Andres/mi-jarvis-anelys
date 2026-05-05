import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { log, logError } from "./logger.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

export interface Memory {
  id: string;
  fact: string;
  category?: string;
  tags: string[];
  related_to?: string;
  pinned: boolean;
  created_at: string;
  recall_count: number;
}

export async function rememberFact(
  fact: string,
  category?: string,
  tags: string[] = [],
  related_to?: string,
  pinned: boolean = false
): Promise<Memory | null> {
  try {
    log(`💾 Recordando: "${fact.substring(0, 50)}..."`);

    const { data, error } = await supabase
      .from("jarvis_memory")
      .insert({
        fact,
        category: category || "general",
        tags: tags.length > 0 ? tags : [],
        related_to: related_to || null,
        pinned,
      })
      .select();

    if (error) {
      logError("Error al guardar memoria", error);
      console.error("Supabase error details:", error);
      return null;
    }

    if (!data || data.length === 0) {
      logError("No data returned from insert");
      return null;
    }

    log(`✅ Memoria guardada: ${data[0].id}`);
    return data[0] as Memory;
  } catch (error) {
    logError("Error en rememberFact", error);
    return null;
  }
}

export async function recallFacts(
  query: string,
  limit: number = 5
): Promise<Memory[]> {
  try {
    log(`🔍 Buscando: "${query}"`);

    // Búsqueda simple por LIKE en lugar de textSearch
    const { data, error } = await supabase
      .from("jarvis_memory")
      .select("*")
      .or(`fact.ilike.%${query}%,category.ilike.%${query}%`)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logError("Error al buscar memoria", error);
      return [];
    }

    log(`✅ Encontradas ${(data || []).length} memorias`);
    return (data || []) as Memory[];
  } catch (error) {
    logError("Error en recallFacts", error);
    return [];
  }
}

export async function getMemoryContext(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("jarvis_memory")
      .select("*")
      .eq("pinned", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error || !data || data.length === 0) {
      return "";
    }

    const facts = (data as Memory[])
      .map((m) => `- ${m.fact}`)
      .join("\n");

    return `[MEMORIA PERSISTENTE]\n${facts}\n`;
  } catch (error) {
    logError("Error en getMemoryContext", error);
    return "";
  }
}
