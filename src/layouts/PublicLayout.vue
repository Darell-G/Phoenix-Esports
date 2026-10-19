<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { usePublicMotion } from "../composables/usePublicMotion";
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import { loadSettings } from "../composables/useContent";
onMounted(loadSettings);
const publicRoot = ref<HTMLElement | null>(null);
const route = useRoute();
usePublicMotion(publicRoot);
</script>
<template>
  <div ref="publicRoot" class="public-site">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-4"
      >Skip to content</a
    >
    <Header />
    <main
      id="main"
      tabindex="-1"
      class="scroll-mt-28"
      :class="{ 'pt-24': route.path !== '/' }"
    >
      <RouterView />
    </main>
    <Footer />
  </div>
</template>
