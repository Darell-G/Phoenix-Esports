<script setup lang="ts">
import { computed, onMounted } from "vue";
import ActionIcon from "../components/ActionIcon.vue";
import ContentCard from "../components/ContentCard.vue";
import LoadState from "../components/LoadState.vue";
import { settings, useContent } from "../composables/useContent";
import banner from "../assets/images/banner.jpg";
import logo from "../assets/images/logo.png";
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
    label: "Calendar",
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
    src: community,
    alt: "Students gathered at a Phoenix campus community event",
    label: "Our community",
  },
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
      class="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 bg-linear-to-bl from-teal/15 to-transparent"
      aria-hidden="true"
    ></div>
    <div
      class="page-wrap flex min-h-svh max-w-7xl flex-col pb-8 pt-28 sm:pb-10 sm:pt-32 lg:pt-36"
    >
      <div
        class="grid flex-1 items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12"
      >
        <div>
          <p
            class="mb-6 text-[10px] uppercase leading-6 tracking-[.22em] text-teal sm:text-xs"
          >
            Our Lady of Fatima University - Quezon City
          </p>
          <h1
            id="hero-title"
            class="font-clarity text-[clamp(2.6rem,5.6vw,5.5rem)] font-normal leading-[1.02] tracking-[-.045em]"
          >
            <span class="block">Play together.</span>
            <span class="mt-2 block text-teal">Rise as Phoenix.</span>
          </h1>
          <p class="mt-6 max-w-md text-sm leading-7 text-white/70 sm:text-base">
            Find your team, share your passion, and be part of OLFU Quezon
            City's esports community.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink
              to="/tournaments"
              class="inline-flex min-h-12 items-center justify-center gap-3 border border-white bg-white px-5 py-3 text-sm text-ink transition-colors hover:bg-teal hover:border-teal"
            >
              Explore tournaments <ActionIcon name="arrow-right" :size="16" />
            </RouterLink>
          </div>
        </div>
        <div class="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div
            class="absolute inset-4 translate-x-3 -translate-y-3 border border-teal/25 sm:inset-6"
            aria-hidden="true"
          ></div>
          <div
            class="relative flex min-h-56 items-center justify-center border border-teal/30 bg-linear-to-br from-teal/15 via-ink to-ink px-8 py-10 [clip-path:polygon(10%_0,100%_0,100%_90%,90%_100%,0_100%,0_10%)] sm:min-h-72 lg:min-h-96"
          >
            <img
              :src="logo"
              alt="Phoenix Esports emblem"
              width="512"
              height="512"
              fetchpriority="high"
              decoding="async"
              class="h-40 w-full object-contain sm:h-52 lg:h-64"
            />
          </div>
        </div>
      </div>
      <div
        class="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5 lg:mt-12"
      >
        <p class="text-[10px] uppercase tracking-[.18em] text-white/50">
          Rooted in campus. United by the game.
        </p>
        <RouterLink
          v-if="featured && !loading && !error"
          :to="featuredUrl"
          class="group flex min-w-0 max-w-md items-center gap-3 text-xs"
        >
          <span class="min-w-0"
            ><span
              class="mb-1 block text-[9px] uppercase tracking-[.18em] text-teal"
              >Featured / {{ featured.kind }}</span
            >{{ featured.title }}</span
          >
          <ActionIcon
            name="arrow-right"
            :size="16"
            class="shrink-0 transition-transform group-hover:translate-x-1"
          />
        </RouterLink>
        <a
          v-else
          href="#community"
          class="inline-flex min-h-10 items-center gap-3 text-xs text-white/75"
        >
          Get to know Phoenix
          <ActionIcon name="arrow-right" :size="16" class="rotate-90" />
        </a>
      </div>
    </div>
  </section>

  <section
    id="community"
    class="page-wrap max-w-7xl scroll-mt-28 py-12 sm:py-16"
  >
    <div class="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
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
      </div>
    </div>
    <div
      class="mt-8 grid w-full gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
    >
      <figure v-for="moment in moments" :key="moment.src">
        <img
          :src="moment.src"
          :alt="moment.alt"
          loading="lazy"
          decoding="async"
          class="aspect-[16/10] w-full object-cover"
        />
      </figure>
    </div>
    <div class="mt-6 flex justify-center">
      <RouterLink
        to="/recruitment"
        class="inline-flex min-h-11 items-center justify-center gap-4 text-sm no-underline transition-colors hover:text-[#427e79]"
        >Find your place here <ActionIcon name="arrow-right" :size="16"
      /></RouterLink>
    </div>
  </section>

  <section class="page-wrap max-w-7xl mt-6 pb-12 sm:pb-16">
    <div class="relative isolate overflow-hidden bg-ink text-white">
      <img
        :src="banner"
        alt=""
        loading="lazy"
        decoding="async"
        class="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div
        class="absolute inset-0 -z-10 bg-linear-to-r from-ink/90 via-ink/75 to-ink/30"
        aria-hidden="true"
      ></div>
      <div
        class="flex min-h-80 min-w-0 flex-col items-start justify-center p-6 sm:min-h-96 sm:p-10 lg:p-14"
      >
        <p class="text-[11px] uppercase tracking-[.22em] text-teal">
          Your next chapter
        </p>
        <h2
          class="mt-4 font-clarity text-3xl leading-tight tracking-[-.05em] sm:text-5xl"
        >
          There's a place<br />for you here
        </h2>
        <p class="mt-5 max-w-md text-sm leading-7 text-white/75">
          Be part of the people who play, create, and bring our community
          together. Explore recruitment for OLFU Quezon City students.
        </p>
        <RouterLink
          to="/recruitment"
          class="mt-7 inline-flex min-h-12 items-center justify-center gap-4 border border-teal bg-teal px-5 py-3 text-sm text-ink transition-colors hover:border-white hover:bg-white"
          >Join Now
        </RouterLink>
      </div>
    </div>
  </section>

  <section
    class="page-wrap max-w-7xl pb-12 sm:pb-16"
    aria-labelledby="achievements-title"
  >
    <p class="eyebrow">Our teams</p>
    <h2
      id="achievements-title"
      class="mt-1 font-clarity text-3xl tracking-[-.05em] sm:text-5xl"
    >
      Achievements
    </h2>

    <div class="mt-8">
      <figure class="mx-auto w-full max-w-2xl">
        <div class="overflow-hidden bg-white">
          <img
            :src="galleryOne"
            alt="OLFU Phoenix League of Legends team celebrating the 2025 Estudyante Esports national championship"
            width="810"
            height="540"
            loading="lazy"
            decoding="async"
            class="h-auto w-full object-contain"
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
    class="bg-ink py-12 text-white sm:py-16"
    aria-labelledby="moments-title"
  >
    <div class="page-wrap max-w-7xl">
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
      <div class="grid w-full gap-5 md:grid-cols-2">
        <figure v-for="moment in behindTheScenes" :key="moment.src">
          <img
            :src="moment.src"
            :alt="moment.alt"
            loading="lazy"
            decoding="async"
            class="aspect-[16/10] w-full object-cover"
          />
        </figure>
      </div>
    </div>
  </section>

  <div class="page-wrap max-w-7xl">
    <section
      v-for="section in sections"
      :key="section.kind"
      class="py-12 sm:py-16"
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
</template>
