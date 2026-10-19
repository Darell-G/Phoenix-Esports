import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
const rawUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
export const supabaseUrl = rawUrl
  ? (rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`).replace(
      /\/$/,
      "",
    )
  : "";
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";
export const supabase =
  supabaseUrl && key ? createClient<Database>(supabaseUrl, key) : null;
export function requireClient() {
  if (!supabase)
    throw new Error(
      "This service is currently unavailable. Please try again later.",
    );
  return supabase;
}
export async function invoke<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await requireClient().functions.invoke(
    "phoenix-api",
    { body: { ...payload, action }, timeout: 20000 },
  );
  if (error) {
    let message = "The request could not be completed. Please try again.";
    try {
      message = (await error.context.json()).error || message;
    } catch {
      /* Network failures have no JSON response. */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
