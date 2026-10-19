<script setup lang="ts">
import ActionIcon from "./ActionIcon.vue";

import type { Content } from "../lib/types";
import { date, peso, human } from "../lib/format";
import logo from "../assets/images/logo.png";
defineProps<{ item: Content }>();
const paths: Record<string, string> = {
  announcement: "announcements",
  event: "events",
  opening: "recruitment",
  tournament: "tournaments",
  product: "merch",
};
function imageFallback(event: Event) {
  const el = event.target as HTMLImageElement;
  el.onerror = null;
  el.src = logo;
}
</script>
<template>
  <RouterLink
    :to="`/${paths[item.kind]}/${item.slug}`"
    class="group flex h-full min-w-0 flex-col border border-line bg-white transition-colors hover:border-phoenix/50"
  >
    <div
      class="flex aspect-[16/10] items-center justify-center overflow-hidden bg-teal/20"
    >
      <img
        :src="item.image_url || logo"
        :alt="item.image_url ? item.title : ''"
        loading="lazy"
        :class="
          item.image_url ? 'h-full w-full object-cover' : 'w-3/5 object-contain'
        "
        @error="imageFallback"
      />
    </div>
    <div class="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
      <div class="flex justify-between gap-3">
        <span class="eyebrow">{{ item.category || human(item.kind) }}</span
        ><ActionIcon
          name="chevron-right"
          class="transition-transform group-hover:translate-x-1"
        />
      </div>
      <h3 class="mt-4 text-lg leading-snug sm:mt-5 sm:text-xl">
        {{ item.title }}
      </h3>
      <p
        v-if="item.kind !== 'tournament' && item.summary"
        class="mt-3 line-clamp-3 text-sm leading-6 text-foreground/60"
      >
        {{ item.summary }}
      </p>
      <p class="mt-auto pt-6 text-xs text-foreground/60">
        {{
          item.kind === "product"
            ? item.price === null
              ? "Price on inquiry"
              : peso(item.price)
            : date(item.starts_at || item.deadline || item.created_at)
        }}
      </p>
    </div>
  </RouterLink>
</template>
