<script setup lang="ts">
withDefaults(defineProps<{ name: keyof typeof paths; size?: number }>(), {
  size: 18,
});
const paths = {
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  x: ["M6 6l12 12", "M18 6 6 18"],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "arrow-left": ["M19 12H5", "m12 5-7 7 7 7"],
  "chevron-right": ["m9 5 7 7-7 7"],
  "user-plus": [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    "M20 6v6",
    "M17 9h6",
  ],
  trophy: [
    "M8 3h8v6a4 4 0 0 1-8 0V3Z",
    "M8 5H5v2a4 4 0 0 0 4 4",
    "M16 5h3v2a4 4 0 0 1-4 4",
    "M12 13v5",
    "M8 21h8",
    "M9 18h6v3H9Z",
  ],
  mail: ["M3 5h18v14H3Z", "m3 5 9 7 9-7"],
  refresh: [
    "M20 7v5h-5",
    "M4 17v-5h5",
    "M6 7a7 7 0 0 1 12-2l2 2",
    "m4 17 2 2a7 7 0 0 0 12-2",
  ],
  send: ["m22 2-7 20-4-9-9-4 20-7Z", "M22 2 11 13"],
  login: ["M15 3h5v18h-5", "M3 12h12", "m10 7 5 5-5 5"],
};
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="inline-block shrink-0 align-middle"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(path, index) in paths[name]" :key="index" :d="path" />
  </svg>
</template>
