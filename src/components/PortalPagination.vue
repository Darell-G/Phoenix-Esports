<script setup lang="ts">
import { computed } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
const props = withDefaults(
  defineProps<{
    page: number;
    total: number;
    pageSize?: number;
    label?: string;
  }>(),
  { pageSize: 10, label: "Records" },
);
const emit = defineEmits<{ "update:page": [value: number] }>();
const pages = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize)),
);
const current = computed(() => Math.min(Math.max(props.page, 1), pages.value));
const numbers = computed(() => {
  const start = Math.max(1, Math.min(current.value - 2, pages.value - 4));
  return Array.from({ length: Math.min(5, pages.value) }, (_, i) => start + i);
});
</script>
<template>
  <nav
    v-if="total > 4"
    class="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs"
    :aria-label="`${label} pagination`"
  >
    <p class="text-foreground/60" aria-live="polite">
      {{ (current - 1) * pageSize + 1 }}&ndash;{{
        Math.min(current * pageSize, total)
      }}
      of {{ total }} {{ label.toLowerCase() }}
    </p>
    <div class="flex max-w-full items-center gap-1">
      <button
        type="button"
        class="flex min-h-11 min-w-11 items-center justify-center gap-1 px-2 hover:bg-foreground/10 sm:px-3"
        aria-label="Previous page"
        :disabled="current === 1"
        @click="emit('update:page', current - 1)"
      >
        <ChevronLeft :size="16" /><span class="hidden sm:inline">Previous</span>
      </button>
      <button
        v-for="number in numbers"
        :key="number"
        type="button"
        class="min-h-11 min-w-8 px-2 sm:min-w-10"
        :class="[
          Math.abs(number - current) > 1 ? 'hidden sm:block' : '',
          number === current
            ? 'bg-foreground text-surface'
            : 'hover:bg-foreground/10',
        ]"
        :aria-current="number === current ? 'page' : undefined"
        :aria-label="`Page ${number}`"
        @click="emit('update:page', number)"
      >
        {{ number }}
      </button>
      <button
        type="button"
        class="flex min-h-11 min-w-11 items-center justify-center gap-1 px-2 hover:bg-foreground/10 sm:px-3"
        aria-label="Next page"
        :disabled="current === pages"
        @click="emit('update:page', current + 1)"
      >
        <span class="hidden sm:inline">Next</span><ChevronRight :size="16" />
      </button>
    </div>
  </nav>
</template>
