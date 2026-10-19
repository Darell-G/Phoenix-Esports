import { ref } from "vue";
import { requireClient } from "../lib/client";
import { errorMessage } from "../lib/format";
import type { Content, ContentKind, Settings } from "../lib/types";
export function useContent() {
  const items = ref<Content[]>([]);
  const loading = ref(true);
  const error = ref("");
  async function load(kind?: ContentKind) {
    loading.value = true;
    error.value = "";
    try {
      let query = requireClient()
        .from("content")
        .select("*")
        .in("status", [
          "published",
          "open",
          "closed",
          "registration_open",
          "registration_closed",
          "ongoing",
          "completed",
          "cancelled",
        ])
        .order("created_at", { ascending: false });
      if (kind) query = query.eq("kind", kind);
      const result = await query;
      if (result.error) throw result.error;
      items.value = result.data as Content[];
    } catch (e) {
      error.value = errorMessage(e);
    } finally {
      loading.value = false;
    }
  }
  return { items, loading, error, load };
}
export const settings = ref<Settings | null>(null);
export async function loadSettings() {
  try {
    const { data } = await requireClient()
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();
    settings.value = data;
  } catch {
    settings.value = null;
  }
}
