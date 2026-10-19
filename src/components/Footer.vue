<script setup lang="ts">
import { settings } from "../composables/useContent";
import { safeLink } from "../lib/format";
import logo from "../assets/images/logo.png";
</script>
<template>
  <footer class="border-t border-line bg-ink text-white">
    <div
      class="page-wrap grid items-start gap-6 py-7 sm:py-9 md:grid-cols-2 md:gap-8 lg:gap-12"
    >
      <div class="min-w-0">
        <RouterLink
          to="/"
          class="inline-flex max-w-full items-center gap-3 text-base tracking-tight sm:text-xl"
          ><img
            :src="logo"
            alt=""
            class="h-9 w-11 shrink-0 object-contain sm:h-11 sm:w-14"
          /><span>OLFU PHOENIX ESPORTS</span></RouterLink
        >
        <p
          class="mt-3 text-xs leading-5 text-white/55 sm:mt-4 sm:text-sm sm:leading-6"
        >
          Our Lady of Fatima University<br />Quezon City, Philippines
        </p>
      </div>
      <div
        class="grid min-w-0 grid-cols-2 items-start gap-x-5 sm:gap-x-10 lg:gap-x-16"
      >
        <nav
          aria-label="Footer explore"
          class="flex min-w-0 flex-col items-start text-[13px] text-white/75 [&>a]:flex [&>a]:min-h-11 [&>a]:items-center [&>a]:transition-colors [&>a:hover]:text-teal sm:text-sm"
        >
          <span
            class="mb-1 text-[10px] font-medium uppercase leading-5 tracking-[.12em] text-teal"
            >Explore</span
          ><RouterLink to="/announcements">Announcements</RouterLink
          ><RouterLink to="/events">Events</RouterLink
          ><RouterLink to="/tournaments">Tournaments</RouterLink>
        </nav>
        <nav
          aria-label="Footer organization"
          class="flex min-w-0 flex-col items-start text-[13px] text-white/75 [&>a]:flex [&>a]:min-h-11 [&>a]:items-center [&>a]:transition-colors [&>a:hover]:text-teal sm:text-sm"
        >
          <span
            class="mb-1 text-[10px] font-medium uppercase leading-5 tracking-[.12em] text-teal"
            >Be part of Phoenix</span
          ><RouterLink to="/recruitment">Recruitment</RouterLink
          ><RouterLink to="/merch">Merchandise</RouterLink
          ><a
            v-if="safeLink(settings?.social_url)"
            :href="safeLink(settings?.social_url)"
            target="_blank"
            rel="noopener noreferrer"
            >Our community ↗</a
          >
        </nav>
      </div>
    </div>
    <div
      class="page-wrap border-t border-white/15 py-3 text-[10px] leading-5 text-white/50 sm:py-4 sm:text-[11px]"
    >
      <span class="text-center"
        >© {{ new Date().getFullYear() }} OLFU Phoenix Esports</span
      >
    </div>
  </footer>
</template>
