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
      empty && !loading && !error
        ? 'flex min-h-48 flex-col items-center justify-center px-5 py-12 text-center'
        : 'border border-line p-8 sm:p-12'
    "
    :role="error ? 'alert' : 'status'"
  >
    <p class="text-base">
      {{
        loading
          ? "Getting the latest from Phoenix…"
          : error
            ? "We couldn’t load this right now."
            : message || "Nothing published here yet."
      }}
    </p>
    <p class="mt-2 text-sm text-foreground/55">
      {{
        error
          ? "Please try again in a moment."
          : loading
            ? "Just a moment."
            : "Check back for updates from the organization."
      }}
    </p>
    <button
      v-if="error"
      class="mt-5 border-b border-phoenix pb-1 text-sm"
      @click="$emit('retry')"
    >
      <ActionIcon name="refresh" :size="16" class="mr-2" />Try again
    </button>
  </div>
</template>
