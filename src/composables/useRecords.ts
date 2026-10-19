import { ref, shallowRef } from "vue";
import type { Database } from "../lib/database.types";
import { requireClient } from "../lib/client";
import { errorMessage } from "../lib/format";
export function useRecords<T>(
  table: keyof Database["public"]["Tables"],
  order = "created_at",
) {
  const rows = shallowRef<T[]>([]),
    loading = ref(true),
    error = ref("");
  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const collected: T[] = [];
      const batchSize = 500;
      for (let start = 0; ; start += batchSize) {
        const { data, error: failure } = await requireClient()
          .from(table)
          .select("*")
          .order(order, { ascending: false })
          .order("id", { ascending: false })
          .range(start, start + batchSize - 1);
        if (failure) throw failure;
        collected.push(...(data as unknown as T[]));
        if (data.length < batchSize) break;
      }
      rows.value = collected;
    } catch (e) {
      error.value = errorMessage(e);
    } finally {
      loading.value = false;
    }
  }
  return { rows, loading, error, load };
}
