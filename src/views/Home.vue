<script setup lang="ts">
import { computed, onMounted } from "vue";
import ActionIcon from "../components/ActionIcon.vue";
import ContentCard from "../components/ContentCard.vue";
import LoadState from "../components/LoadState.vue";
import { settings, useContent } from "../composables/useContent";
import banner from "../assets/images/banner.jpg";
import galleryOne from "../assets/images/gallery-1.jpg";
import campus from "../assets/images/more-1.jpg";
import competition from "../assets/images/more-2.jpg";
import gathering from "../assets/images/more-3.jpg";
import community from "../assets/images/more-4.jpg";
import organizers from "../assets/images/more-5.jpg";
import production from "../assets/images/more-6.jpg";
const { items, loading, error, load } = useContent();
onMounted(() => load());
const featured = computed(() =>
  items.value.find(
    (item) =>
      item.featured &&
      ["announcement", "event", "tournament"].includes(item.kind),
  ),
);
const featuredUrl = computed(() => {
  const item = featured.value;
  if (!item) return "/announcements";
  const section =
    item.kind === "event"
      ? "events"
      : item.kind === "tournament"
        ? "tournaments"
        : "announcements";
  return `/${section}/${item.slug}`;
});
const sections = [
  {
    kind: "event",
    label: "On the calendar",
    title: "Next on campus",
    link: "/events",
    action: "All events",
    empty: "No upcoming events published yet.",
    description: "Keep up with what's happening in the Phoenix community.",
  },
];
const visible = (kind: string) =>
  items.value
    .filter(
      (item) =>
        item.kind === kind &&
        item.starts_at &&
        new Date(item.starts_at).getTime() >= Date.now(),
    )
    .slice(0, 3);
const moments = [
  {
    src: campus,
    alt: "Phoenix community members together in a campus computer classroom",
    label: "On campus",
  },
  {
    src: competition,
    alt: "A student playing a mobile esports game",
    label: "In the game",
  },
  {
    src: gathering,
    alt: "A speaker addressing the Phoenix community at a campus gathering",
    label: "Beyond the screen",
  },
];
const behindTheScenes = [
  {
    src: organizers,
    alt: "Phoenix organization members together at their campus booth",
    label: "The people behind Phoenix",
  },
  {
    src: production,
    alt: "Phoenix production team working with microphones behind the scenes",
    label: "Behind the scenes",
  },
];
</script>
<template>
  <section
    class="relative isolate overflow-hidden bg-ink text-white"
    aria-labelledby="hero-title"
  >
    <div
      class="absolute inset-0 -z-10 bg-cover bg-center"
      :style="{ backgroundImage: `url(${banner})` }"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-0 -z-10 bg-linear-to-r from-ink/95 via-ink/80 to-ink/35"
      aria-hidden="true"
    ></div>
    <div
      class="page-wrap relative flex min-h-[540px] flex-col justify-between py-6 sm:min-h-[730px] sm:py-8 lg:min-h-[760px] lg:py-10"
    >
      <div class="py-10 sm:py-20">
        <p class="mb-5 text-[11px] uppercase tracking-[.3em] text-teal">
          Our Lady of Fatima University - Quezon City
        </p>
        <h1
          id="hero-title"
          class="max-w-4xl font-clarity text-[clamp(2.8rem,9vw,8.5rem)] leading-[.92] tracking-[-.06em]"
        >
          TOGETHER<br /><span class="text-teal">WE RISE</span>
        </h1>
        <p
          class="mt-6 max-w-md text-sm leading-7 text-white/80 sm:mt-7 sm:text-base"
        >
          The campus, the competition, the community<br />
          A shared passion for the game. A place to rise together.
        </p>
        <div class="mt-9 flex flex-wrap gap-3">
          <RouterLink
            to="/tournaments"
            class="inline-flex min-h-12 max-w-full items-center justify-center gap-3 border border-white/50 px-4 py-3 text-sm transition-colors hover:bg-white hover:text-ink sm:gap-6 sm:px-6"
            >Explore tournaments <ActionIcon name="arrow-right"
          /></RouterLink>
        </div>
      </div>
      <div
        class="flex flex-col justify-between gap-5 border-t border-white/25 pt-5 sm:flex-row sm:items-end"
      >
        <p
          class="text-[10px] uppercase leading-6 tracking-[.2em] text-white/65"
        >
          Rooted in campus<br />United by the game
        </p>
        <RouterLink
          v-if="featured && !loading && !error"
          :to="featuredUrl"
          class="group flex min-w-0 max-w-md items-center gap-3 text-sm sm:gap-6"
        >
          <span
            ><span
              class="mb-1 block text-[9px] uppercase tracking-[.2em] text-white bg-ink px-2 py-1"
              >Featured / {{ featured.kind }}</span
            >{{ featured.title }}</span
          >
          <ActionIcon
            name="arrow-right"
            class="transition-transform group-hover:translate-x-1"
          />
        </RouterLink>
        <a
          v-else
          href="#community"
          class="inline-flex items-center gap-3 text-xs text-white/80"
          >Get to know Phoenix
          <ActionIcon name="arrow-right" :size="16" class="rotate-90"
        /></a>
      </div>
    </div>
  </section>

  <section id="community" class="page-wrap scroll-mt-6 py-16 sm:py-24">
    <div
      class="grid gap-8 border-b border-line pb-10 lg:grid-cols-[1fr_1fr] lg:gap-20"
    >
      <div>
        <p class="eyebrow">This is Phoenix</p>
        <h2
          class="mt-1 font-clarity text-3xl leading-[1.06] tracking-[-.05em] sm:text-6xl"
        >
          <span class="text-[#427e79]">Our community</span>
        </h2>
      </div>
      <div class="self-end">
        <p
          class="max-w-xl whitespace-pre-line text-sm leading-7 text-foreground/65 sm:text-base sm:leading-8"
        >
          {{
            settings?.about ||
            "OLFU Phoenix Esports brings together players, officers, and committees at Our Lady of Fatima University, Quezon City. From the people in the game to the people behind every gathering, this is our campus community."
          }}
        </p>
        <RouterLink
          to="/recruitment"
          class="mt-6 inline-flex items-center gap-6 border-b border-ink/30 pb-2 text-sm"
          >Find your place here <ActionIcon name="arrow-right" :size="16"
        /></RouterLink>
      </div>
    </div>
    <div class="mt-10 grid gap-6 md:grid-cols-3">
      <figure v-for="moment in moments" :key="moment.src">
        <img
          :src="moment.src"
          :alt="moment.alt"
          loading="lazy"
          decoding="async"
          class="aspect-[4/3] w-full object-cover"
        />
      </figure>
    </div>
  </section>

  <section
    class="page-wrap pb-16 sm:pb-24"
    aria-labelledby="achievements-title"
  >
    <p class="eyebrow">Our teams</p>
    <h2
      id="achievements-title"
      class="mt-1 font-clarity text-3xl tracking-[-.05em] sm:text-5xl"
    >
      Achievements
    </h2>

    <div class="mt-4 grid items-start gap-6 md:grid-cols-2 md:gap-10">
      <figure>
        <div class="overflow-hidden bg-white">
          <img
            :src="galleryOne"
            alt="OLFU Phoenix League of Legends team celebrating the 2025 Estudyante Esports national championship"
            width="810"
            height="540"
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full object-contain"
          />
        </div>
        <figcaption
          class="mt-4 flex justify-between gap-4 text-[10px] uppercase tracking-[.15em] text-foreground/55"
        >
          <span>LEAGUE OF LEGENDS TEAM</span>
        </figcaption>
      </figure>
    </div>
  </section>

  <section
    class="bg-ink py-14 text-white sm:py-20"
    aria-labelledby="moments-title"
  >
    <div class="page-wrap">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="text-[10px] uppercase tracking-[.22em] text-teal">
            Officers & committees
          </p>
          <h2
            id="moments-title"
            class="mt-4 font-clarity text-3xl leading-tight tracking-[-.05em] sm:text-5xl"
          >
            Together, beyond the screen
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-white/70">
            Meet the organization members who bring Phoenix together, on campus
            and behind the scenes.
          </p>
        </div>
        <RouterLink
          to="/events"
          class="inline-flex items-center gap-5 border-b border-white/30 pb-2 text-xs"
          >Explore events <ActionIcon name="arrow-right" :size="16"
        /></RouterLink>
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        <figure v-for="moment in behindTheScenes" :key="moment.src">
          <img
            :src="moment.src"
            :alt="moment.alt"
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full object-cover"
          />
        </figure>
      </div>
    </div>
  </section>

  <div class="page-wrap py-6 sm:py-10">
    <section
      v-for="section in sections"
      :key="section.kind"
      class="border-b border-line py-12 sm:py-16"
    >
      <div class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p class="eyebrow">{{ section.label }}</p>
          <h2 class="mt-3 font-clarity text-3xl tracking-[-.05em] sm:text-5xl">
            {{ section.title }}
          </h2>
        </div>
        <RouterLink
          :to="section.link"
          class="inline-flex items-center gap-6 border-b border-ink/30 pb-2 text-xs"
          >{{ section.action }} <ActionIcon name="arrow-right" :size="16"
        /></RouterLink>
      </div>
      <p class="mb-6 max-w-xl text-sm leading-6 text-foreground/60">
        {{ section.description }}
      </p>
      <LoadState
        :loading="loading"
        :error="error"
        :empty="!visible(section.kind).length"
        :message="section.empty"
        @retry="load()"
      />
      <div
        v-if="!loading && !error && visible(section.kind).length"
        class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <ContentCard
          v-for="item in visible(section.kind)"
          :key="item.id"
          :item="item"
        />
      </div>
    </section>
  </div>

  <section class="page-wrap pb-16 pt-6 sm:pb-24">
    <div class="grid overflow-hidden bg-teal/25 lg:grid-cols-2">
      <img
        :src="community"
        alt="Students gathered at a Phoenix campus community event"
        width="2048"
        height="1152"
        loading="lazy"
        decoding="async"
        class="aspect-[16/10] w-full object-cover lg:aspect-auto lg:h-full"
      />
      <div
        class="flex min-w-0 flex-col items-start justify-center p-5 sm:p-12 lg:p-14"
      >
        <p class="eyebrow">Your next chapter</p>
        <h2
          class="mt-4 font-clarity text-3xl leading-tight tracking-[-.05em] sm:text-5xl"
        >
          There's a place<br />for you here
        </h2>
        <p class="mt-5 max-w-md text-sm leading-7 text-foreground/65">
          Be part of the people who play, create, and bring our community
          together. Explore recruitment for OLFU Quezon City students.
        </p>
        <RouterLink to="/recruitment" class="btn mt-7"
          >Join Phoenix <ActionIcon name="user-plus"
        /></RouterLink>
      </div>
    </div>
  </section>
</template>
