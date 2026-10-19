<script setup lang="ts">
import { usePagination } from "../../composables/usePagination";
import PortalPagination from "../../components/PortalPagination.vue";
import { computed, onMounted, ref } from "vue";
import { Plus, Pencil, Eye, Trash2 } from "lucide-vue-next";
import { useRecords } from "../../composables/useRecords";
import type { Content, ContentKind } from "../../lib/types";
import { date, human } from "../../lib/format";
import LoadState from "../../components/LoadState.vue";
import ContentEditor from "../../components/ContentEditor.vue";
const props = defineProps<{ kind?: ContentKind }>();
const { rows, loading, error, load } = useRecords<Content>("content");
const search = ref(""),
  filter = ref(""),
  editor = ref(false),
  deleteOnOpen = ref(false),
  selected = ref<Content>();
const kinds = computed<ContentKind[]>(() =>
  props.kind ? [props.kind] : ["announcement", "event", "product"],
);
const filtered = computed(() =>
  rows.value.filter(
    (i) =>
      kinds.value.includes(i.kind) &&
      (!filter.value || i.status === filter.value) &&
      i.title.toLowerCase().includes(search.value.toLowerCase()),
  ),
);
const paths: Record<string, string> = {
  announcement: "announcements",
  event: "events",
  opening: "recruitment",
  product: "merch",
  tournament: "tournaments",
};
const { page, entries, total, pageSize } = usePagination(filtered, [
  search,
  filter,
  () => props.kind,
]);
onMounted(load);
function edit(item?: Content, remove = false) {
  deleteOnOpen.value = remove;
  selected.value = item;
  editor.value = true;
}
async function saved() {
  editor.value = false;
  await load();
}
</script>
<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 class="text-2xl sm:text-3xl tracking-tight">
          {{
            kind === "opening"
              ? "Recruitment openings"
              : "Content & merchandise"
          }}
        </h1>
        <p class="mt-3 text-sm text-foreground/55">
          Create, preview, and publish updates for the community.
        </p>
      </div>
      <button class="btn text-xs" @click="edit()">
        <Plus :size="16" />Create
        {{ kind === "opening" ? "opening" : "content" }}
      </button>
    </div>
    <div class="my-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
      <label class="min-w-0 flex-1"
        ><span class="sr-only">Search content</span
        ><input
          v-model="search"
          type="search"
          placeholder="Search by title…"
          class="field" /></label
      ><label
        ><span class="sr-only">Status</span
        ><select v-model="filter" class="field">
          <option value="">All statuses</option>
          <option v-for="s in [...new Set(rows.map((r) => r.status))]" :key="s">
            {{ s }}
          </option>
        </select></label
      >
    </div>
    <LoadState
      :loading="loading"
      :error="error"
      :empty="!filtered.length"
      message="No content to show. Create your first entry when ready."
      @retry="load"
    />
    <div
      v-if="!loading && !error && filtered.length"
      tabindex="0"
      role="region"
      aria-label="Scrollable records"
      class="max-w-full overflow-x-auto border border-line bg-surface"
    >
      <table class="w-full min-w-[650px] text-left text-sm">
        <thead class="border-b border-line bg-paper text-xs text-foreground/55">
          <tr>
            <th class="p-4 font-normal">Title</th>
            <th class="p-4 font-normal">Type</th>
            <th class="p-4 font-normal">Status</th>
            <th class="p-4 font-normal">Created</th>
            <th class="p-4 font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in entries"
            :key="item.id"
            class="border-b border-line/70"
          >
            <td class="max-w-xs p-4">
              {{ item.title
              }}<span
                v-if="item.featured"
                class="mt-1 block text-[10px] text-[#427e79] dark:text-teal"
                >Featured</span
              >
            </td>
            <td class="p-4 capitalize">{{ item.kind }}</td>
            <td class="p-4">
              <span class="bg-paper px-2 py-1 text-xs capitalize">{{
                human(item.status)
              }}</span>
            </td>
            <td class="p-4 text-xs text-foreground/55">
              {{ date(item.created_at) }}
            </td>
            <td class="p-4">
              <div class="flex gap-4">
                <button
                  class="inline-flex min-h-11 items-center gap-1 text-xs"
                  @click="edit(item)"
                >
                  <Pencil :size="14" />Edit</button
                ><button
                  class="inline-flex min-h-11 items-center gap-1 text-xs"
                  @click="edit(item, true)"
                >
                  <Trash2 :size="14" />Delete</button
                ><RouterLink
                  v-if="!['draft', 'archived'].includes(item.status)"
                  :to="`/${paths[item.kind]}/${item.slug}`"
                  class="inline-flex min-h-11 items-center gap-1 text-xs"
                  ><Eye :size="14" />View</RouterLink
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <PortalPagination
      v-if="!loading && !error"
      v-model:page="page"
      :total="total"
      :page-size="pageSize"
      label="Content"
    />
    <ContentEditor
      v-if="editor"
      :key="selected?.id || 'create'"
      :item="selected"
      :delete-on-open="deleteOnOpen"
      :kinds="kinds"
      @close="editor = false"
      @saved="saved"
    />
  </section>
</template>
