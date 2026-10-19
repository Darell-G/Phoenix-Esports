<script setup lang="ts">
import ActionIcon from "./ActionIcon.vue";

import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import logo from "../assets/images/logo.png";
const open = ref(false);
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    open.value = false;
  },
);
const links = [
  { to: "/announcements", label: "Announcements" },
  { to: "/events", label: "Events" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/merch", label: "Merch" },
];
</script>
<template>
  <header
    class="fixed inset-x-0 top-0 z-40 bg-transparent px-3 py-2 sm:px-4 lg:px-6"
    @keydown.esc="open = false"
  >
    <div
      class="mx-auto w-full max-w-8xl rounded-lg border border-white/20 bg-ink/80 text-white shadow-[0_8px_32px_-16px_rgba(20,20,20,0.4)] backdrop-blur-2xl backdrop-saturate-150"
    >
      <div
        class="flex min-h-14 items-center justify-between gap-3 px-3 sm:min-h-15 sm:gap-4 sm:px-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-6"
      >
        <RouterLink
          to="/"
          aria-label="Phoenix Esports home"
          class="flex min-w-0 items-center gap-2 sm:gap-2.5 lg:justify-self-start"
        >
          <img
            :src="logo"
            alt=""
            class="h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-10"
          />
          <span
            class="min-w-0 text-xs font-bold leading-tight tracking-tight sm:text-sm"
            >OLFU PHOENIX<span
              class="mt-.5 block max-w-40 text-[8px] font-normal leading-relaxed tracking-[.12em] sm:max-w-none sm:text-[9px] sm:tracking-[.3em]"
              >ESPORTS</span
            ></span
          >
        </RouterLink>
        <nav
          aria-label="Main navigation"
          class="hidden items-center gap-6 text-[13px] lg:flex"
        >
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="inline-flex min-h-11 items-center text-white/90 transition-colors hover:text-teal"
            active-class="!text-teal"
            >{{ link.label }}</RouterLink
          >
        </nav>
        <div class="hidden items-center lg:-mr-2 lg:flex lg:justify-self-end">
          <RouterLink
            to="/recruitment"
            class="inline-flex min-h-11 items-center justify-center gap-3 rounded-sm bg-white px-4 py-2 text-xs text-ink transition-colors"
            >Join Now <ActionIcon name="arrow-right" :size="16"
          /></RouterLink>
        </div>
        <button
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs text-white transition-colors hover:bg-white/10 lg:hidden"
          :aria-label="open ? 'Close navigation' : 'Open navigation'"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          @click="open = !open"
        >
          <ActionIcon :name="open ? 'x' : 'menu'" :size="16" />
        </button>
      </div>
      <nav
        v-if="open"
        id="mobile-nav"
        aria-label="Mobile navigation"
        class="mx-3 mb-3 flex max-h-[calc(100dvh-7rem)] flex-col gap-1 overflow-y-auto border-t border-white/15 pt-3 text-sm text-white/90 sm:mx-5 [&>a]:flex [&>a]:min-h-11 [&>a]:items-center [&>a]:px-3 [&>a]:transition-colors [&>a:hover]:text-teal lg:hidden"
      >
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          active-class="!text-teal"
          >{{ link.label }}</RouterLink
        ><RouterLink to="/recruitment" active-class="!text-teal"
          >Join Now <ActionIcon name="arrow-right" :size="16" class="ml-2"
        /></RouterLink>
      </nav>
    </div>
  </header>
</template>
