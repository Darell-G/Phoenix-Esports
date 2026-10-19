<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { X } from "lucide-vue-next";
defineProps<{ title: string }>();
defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
onMounted(() => {
  dialog.value?.showModal();
});
onBeforeUnmount(() => {
  dialog.value?.close();
});
</script>
<template>
  <dialog
    ref="dialog"
    class="m-auto max-h-[calc(100dvh_-_1rem)] w-[calc(100%_-_1rem)] min-w-0 max-w-3xl overflow-y-auto overscroll-contain border border-line bg-dialog p-0 text-foreground shadow-2xl backdrop:bg-black/65 sm:max-h-[90dvh] sm:w-[calc(100%_-_2rem)]"
    @close="$emit('close')"
  >
    <div
      class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-dialog px-4 py-3 sm:px-6 sm:py-5"
    >
      <h2 class="min-w-0 text-lg sm:text-xl">{{ title }}</h2>
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center"
        aria-label="Close dialog"
        @click="$emit('close')"
      >
        <X :size="20" />
      </button>
    </div>
    <div class="min-w-0 p-4 sm:p-6"><slot /></div>
  </dialog>
</template>
