import { supabase } from "@/lib/supabase";

export interface AskResult {
  answer: string;
  take_ids: string[];
  /** "ai": Claude answered; "basic": no API key yet, a plain summary; "none": no takes matched. */
  mode: "ai" | "basic" | "none";
}

export async function askHotTake(
  question: string,
  location?: { lat: number; lng: number } | null,
): Promise<AskResult> {
  const { data, error } = await supabase.functions.invoke("ask", {
    body: { question, lat: location?.lat ?? null, lng: location?.lng ?? null },
  });
  if (error) {
    let message = "Hot Take AI couldn't answer right now. Try again.";
    try {
      const ctx = (error as { context?: Response }).context;
      const body = ctx ? await ctx.json() : null;
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return data as AskResult;
}
