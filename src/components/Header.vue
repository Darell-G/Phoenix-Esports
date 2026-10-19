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
  <header class="relative z-30 border-b border-line bg-paper">
    <div
      class="page-wrap flex min-h-20 items-center justify-between gap-3 sm:min-h-24 sm:gap-5"
    >
      <RouterLink
        to="/"
        aria-label="Phoenix Esports home"
        class="flex min-w-0 items-center gap-2 sm:gap-2.5"
      >
        <img
          :src="logo"
          alt=""
          class="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-16"
        />
        <span
          class="min-w-0 text-xs font-bold leading-tight tracking-tight sm:text-[15px]"
          >OLFU PHOENIX<span
            class="mt-.5 block max-w-40 text-[8px] font-normal leading-relaxed tracking-[.12em] sm:max-w-none sm:text-[9px] sm:tracking-[.3em]"
            >ESPORTS</span
          ></span
        >
      </RouterLink>
      <nav
        aria-label="Main navigation"
        class="hidden items-center gap-7 text-[13px] lg:flex"
      >
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-foreground/65 transition-colors hover:text-phoenix"
          active-class="!text-phoenix underline underline-offset-8"
          >{{ link.label }}</RouterLink
        >
      </nav>
      <div class="hidden items-center gap-6 lg:flex">
        <RouterLink to="/recruitment" class="btn min-h-11 text-xs"
          >Join Phoenix <ActionIcon name="user-plus"
        /></RouterLink>
      </div>
      <button
        class="flex h-11 w-11 shrink-0 items-center justify-center text-xs lg:hidden"
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
      class="page-wrap flex flex-col gap-1 border-t border-line py-4 text-sm [&>a]:flex [&>a]:min-h-11 [&>a]:items-center lg:hidden"
    >
      <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{
        link.label
      }}</RouterLink
      ><RouterLink to="/recruitment"
        >Join Phoenix <ActionIcon name="user-plus" class="ml-2"
      /></RouterLink>
    </nav>
  </header>
</template>
