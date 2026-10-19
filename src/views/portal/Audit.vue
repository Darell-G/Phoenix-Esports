<script setup lang="ts">
import { usePagination } from "../../composables/usePagination";
import PortalPagination from "../../components/PortalPagination.vue";
import { computed, onMounted, ref } from "vue";
import { useRecords } from "../../composables/useRecords";
import { requireClient } from "../../lib/client";
import { date, human } from "../../lib/format";
import LoadState from "../../components/LoadState.vue";
const { rows, loading, error, load } = useRecords<{
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  record_id: string;
  record_label: string;
  reason: string;
  created_at: string;
}>("audit_log");
const search = ref(""),
  actors = ref<Record<string, string>>({});
const entityLabel = (entity: string) =>
  human(
    entity === "staff"
      ? "officers_and_committees"
      : entity === "staff_invitations"
        ? "officer_committee_invitations"
        : entity,
  );
const filtered = computed(() =>
  rows.value.filter((r) =>
    `${r.entity} ${r.action} ${r.reason} ${r.record_label} ${r.record_id}`
      .toLowerCase()
      .includes(search.value.toLowerCase()),
  ),
);
const { page, entries, total, pageSize } = usePagination(filtered, [search]);
onMounted(async () => {
  await load();
  const { data } = await requireClient()
    .from("officers_and_committees")
    .select("user_id,name,email");
  for (const person of data || [])
    actors.value[person.user_id] = person.name || person.email;
});
</script>
<template>
  <section>
    <h1 class="text-2xl sm:text-3xl tracking-tight">Activity log</h1>
    <p class="mt-3 text-sm text-foreground/55">
      Officers and committees actions, publication changes, and workflow
      decisions.
    </p>
    <label class="my-6 block"
      ><span class="sr-only">Search activity</span
      ><input
        v-model="search"
        type="search"
        placeholder="Search activity or records…"
        class="field"
        @input="page = 1" /></label
    ><LoadState
      :loading="loading"
      :error="error"
      :empty="!filtered.length"
      message="No activity matches this view."
      @retry="load"
    />
    <div
      v-if="!loading && !error && filtered.length"
      tabindex="0"
      role="region"
      aria-label="Scrollable records"
      class="max-w-full overflow-x-auto border border-line bg-surface"
    >
      <table class="w-full min-w-[850px] text-left text-xs">
        <thead class="bg-paper text-foreground/55">
          <tr>
            <th class="p-4">Time · PHT</th>
            <th class="p-4">Action</th>
            <th class="p-4">Record</th>
            <th class="p-4">Officers and committees member</th>
            <th class="p-4">Activity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in entries" :key="row.id" class="border-t border-line">
            <td class="p-4">{{ date(row.created_at, true) }}</td>
            <td class="p-4 capitalize">
              {{ row.action }} {{ entityLabel(row.entity) }}
            </td>
            <td class="max-w-44 break-all p-4 text-foreground/55">
              {{ row.record_label || row.record_id.slice(0, 8) }}
            </td>
            <td class="max-w-40 break-all p-4 text-foreground/55">
              {{
                row.actor_id
                  ? actors[row.actor_id] || "Former officers and committees"
                  : "System / initial setup"
              }}
            </td>
            <td class="max-w-64 p-4">{{ row.reason || "Routine edit" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <PortalPagination
      v-if="!loading && !error"
      v-model:page="page"
      :total="total"
      :page-size="pageSize"
      label="Audit"
    />
  </section>
</template>
