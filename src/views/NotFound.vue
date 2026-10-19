<script setup lang="ts">
import ActionIcon from "../components/ActionIcon.vue";
</script>
<template>
  <main
    class="page-wrap flex min-h-screen flex-col items-start justify-center py-16"
  >
    <p class="eyebrow">404 / Out of bounds</p>
    <h1 class="mt-5 text-5xl tracking-tight">This page isn’t here.</h1>
    <p class="mt-5 text-foreground/60">
      The link may have changed, or the page is no longer available.
    </p>
    <RouterLink to="/" class="btn mt-8"
      ><ActionIcon name="arrow-left" />Return to home</RouterLink
    >
  </main>
</template>
