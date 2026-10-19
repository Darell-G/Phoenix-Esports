<script setup lang="ts">
import { onMounted } from "vue";
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import { loadSettings } from "../composables/useContent";
onMounted(loadSettings);
</script>
<template>
  <a
    href="#main"
    class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-4"
    >Skip to content</a
  >
  <Header />
  <main id="main" tabindex="-1"><RouterView /></main>
  <Footer />
</template>
