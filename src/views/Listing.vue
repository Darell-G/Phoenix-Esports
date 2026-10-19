<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useContent } from "../composables/useContent";
import ContentCard from "../components/ContentCard.vue";
import LoadState from "../components/LoadState.vue";
import type { ContentKind } from "../lib/types";
const props = defineProps<{ section: string }>();
const config: Record<
  string,
  { kind: ContentKind; title: string; description: string }
> = {
  announcements: {
    kind: "announcement",
    title: "From Phoenix",
    description: "The latest news and announcements from the organization.",
  },
  events: {
    kind: "event",
    title: "On the calendar",
    description:
      "Campus moments, community gatherings, and what comes next. All times are Philippine time.",
  },
  recruitment: {
    kind: "opening",
    title: "Find your place",
    description:
      "Opportunities for officers, committees, and players. Open to OLFU Quezon City students",
  },
  tournaments: {
    kind: "tournament",
    title: "Tournaments",
    description:
      "Explore tournament details, follow the external bracket, and view team standings.",
  },
  merch: {
    kind: "product",
    title: "Merchandises",
    description:
      "Official merchandise. Explore availability and contact the organization to order.",
  },
};
const current = computed(() => config[props.section]!);
const { items, loading, error, load } = useContent();
const timing = ref("upcoming"),
  page = ref(1);
watch(
  () => props.section,
  () => {
    page.value = 1;
    void load(current.value.kind);
  },
  { immediate: true },
);
watch(timing, () => {
  page.value = 1;
});
const filtered = computed(() =>
  items.value.filter(
    (i) =>
      props.section !== "events" ||
      timing.value === "all" ||
      (timing.value === "upcoming"
        ? !i.starts_at || new Date(i.starts_at).getTime() >= Date.now()
        : !!i.starts_at && new Date(i.starts_at).getTime() < Date.now()),
  ),
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 9)));
const paginated = computed(() =>
  filtered.value.slice((page.value - 1) * 9, page.value * 9),
);
</script>
<template>
  <div class="page-wrap min-h-[65vh] pb-12 pt-8 sm:pb-20 sm:pt-10">
    <h1 class="text-3xl leading-tight tracking-[-.05em] sm:text-6xl">
      {{ current.title }}
    </h1>
    <p
      class="mt-4 max-w-2xl text-sm leading-7 text-foreground/60 sm:mt-5 sm:text-base"
    >
      {{ current.description }}
    </p>
    <div
      v-if="section === 'events'"
      class="my-9 flex flex-col items-start gap-4 sm:flex-row"
    >
      <label
        ><span class="sr-only">Event dates</span
        ><select v-model="timing" class="field !mt-0">
          <option value="upcoming">Upcoming events</option>
          <option value="past">Past events</option>
          <option value="all">All events</option>
        </select></label
      >
    </div>
    <LoadState
      :class="{ 'mt-9': section !== 'events' }"
      :loading="loading"
      :error="error"
      :empty="!filtered.length"
      :message="
        items.length
          ? section === 'events'
            ? 'No events in this view.'
            : 'No entries in this category.'
          : `No ${section === 'recruitment' ? 'openings' : section} published yet.`
      "
      @retry="load(current.kind)"
    />
    <div
      v-if="!loading && !error"
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      :class="{ 'mt-9': section !== 'events' }"
    >
      <ContentCard v-for="item in paginated" :key="item.id" :item="item" />
    </div>
    <nav
      v-if="pages > 1"
      aria-label="Pagination"
      class="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-6"
    >
      <button class="btn-outline" :disabled="page === 1" @click="page--">
        Previous</button
      ><span class="text-sm">{{ page }} / {{ pages }}</span
      ><button class="btn-outline" :disabled="page === pages" @click="page++">
        Next
      </button>
    </nav>
  </div>
</template>
