<script setup lang="ts">
import ActionIcon from "./ActionIcon.vue";

defineProps<{
  loading?: boolean;
  error?: string;
  empty?: boolean;
  message?: string;
}>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <div
    v-if="loading || error || empty"
    :class="
      loading || (empty && !error)
        ? 'flex min-h-48 flex-col items-center justify-center px-5 py-12 text-center'
        : 'border border-line p-8 sm:p-12'
    "
    :role="!loading && error ? 'alert' : 'status'"
    :aria-busy="loading || undefined"
  >
    <template v-if="loading">
      <span
        aria-hidden="true"
        class="h-7 w-7 rounded-full border-2 border-foreground/15 border-t-foreground motion-safe:animate-spin"
      ></span>
      <p class="mt-3 text-sm text-foreground/65">Loading…</p>
    </template>
    <template v-else>
      <p class="text-base">
        {{
          error
            ? "We couldn’t load this right now."
            : message || "Nothing published here yet."
        }}
      </p>
      <p class="mt-2 text-sm text-foreground/55">
        {{
          error
            ? "Please try again in a moment."
            : "Check back for updates from the organization."
        }}
      </p>
    </template>
    <button
      v-if="error && !loading"
      class="mt-5 border-b border-phoenix pb-1 text-sm"
      @click="$emit('retry')"
    >
      <ActionIcon name="refresh" :size="16" class="mr-2" />Try again
    </button>
  </div>
</template>
