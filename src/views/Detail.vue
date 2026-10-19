<script setup lang="ts">
import ActionIcon from "../components/ActionIcon.vue";

import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { requireClient } from "../lib/client";
import { settings } from "../composables/useContent";
import type {
  Content,
  ContentKind,
  ScoreboardTeam,
  TournamentFixture,
} from "../lib/types";
import { date, peso, safeLink, errorMessage, human } from "../lib/format";
import { openingApplicationUrl } from "../lib/recruitment";
import { loadScoreboard } from "../lib/scoreboard";
import TournamentScoreboard from "../components/TournamentScoreboard.vue";
import { loadFixtures } from "../lib/fixtures";
import TournamentMatches from "../components/TournamentMatches.vue";
import LoadState from "../components/LoadState.vue";
const route = useRoute(),
  item = ref<Content | null>(null),
  loading = ref(true),
  error = ref(""),
  notFound = ref(false);
const teams = ref<ScoreboardTeam[]>([]),
  fixtures = ref<TournamentFixture[]>([]);
const kinds: Record<string, ContentKind> = {
  announcements: "announcement",
  events: "event",
  recruitment: "opening",
  tournaments: "tournament",
  merch: "product",
};
async function load() {
  loading.value = true;
  error.value = "";
  notFound.value = false;
  item.value = null;
  teams.value = [];
  fixtures.value = [];
  try {
    const { data, error: failure } = await requireClient()
      .from("content")
      .select("*")
      .eq("slug", String(route.params.slug))
      .eq("kind", kinds[String(route.params.section)]!)
      .in("status", [
        "published",
        "open",
        "closed",
        "registration_open",
        "registration_closed",
        "ongoing",
        "completed",
        "cancelled",
      ])
      .maybeSingle();
    if (failure) throw failure;
    if (!data) {
      notFound.value = true;
      return;
    }
    item.value = data as Content;
    document.title = `${data.title} | Phoenix Esports`;
    if (data.kind === "tournament") {
      [teams.value, fixtures.value] = await Promise.all([
        loadScoreboard(data.id),
        loadFixtures(data.id),
      ]);
    }
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}
watch(() => route.fullPath, load, { immediate: true });
const applicationUrl = computed(() => openingApplicationUrl(item.value));
</script>
<template>
  <div class="page-wrap min-h-[65vh] pb-12 pt-6 sm:pb-16 sm:pt-8">
    <RouterLink
      :to="`/${route.params.section}`"
      class="text-xs text-foreground/60"
      >← Back to {{ route.params.section }}</RouterLink
    ><LoadState class="mt-7" :loading="loading" :error="error" @retry="load" />
    <div v-if="notFound" class="py-14">
      <h1 class="text-4xl">This page is unavailable.</h1>
      <p class="mt-4 text-foreground/60">
        It may have been removed or is not published.
      </p>
    </div>
    <article v-if="item && !error">
      <div class="mb-6 mt-4 max-w-4xl">
        <p
          class="text-[10px] font-semibold uppercase leading-5 tracking-[.18em] text-foreground/55"
        >
          {{ item.category || item.kind }} / {{ human(item.status) }}
        </p>
        <h1
          class="mt-2 text-[clamp(1.75rem,7vw,3rem)] leading-tight tracking-[-.04em] sm:text-5xl"
        >
          {{ item.title }}
        </h1>
        <div
          v-if="item.kind === 'tournament' && item.champion_name"
          class="mt-2 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 px-5 py-2 text-ink"
          role="status"
        >
          <ActionIcon name="trophy" :size="28" />
          <div class="min-w-0">
            <p class="mt-1 break-words text-lg font-semibold sm:text-xl">
              {{ item.champion_name }}
            </p>
          </div>
        </div>
        <p
          v-if="!['tournament', 'opening'].includes(item.kind) && item.summary"
          class="mt-3 text-sm leading-6 text-foreground/60 sm:text-base"
        >
          {{ item.summary }}
        </p>
      </div>
      <img
        v-if="item.kind !== 'tournament' && item.image_url"
        :src="item.image_url"
        :alt="item.title"
        class="mb-8 max-h-[480px] w-full border border-line object-contain"
        @error="item.image_url = null"
      />
      <section
        v-if="item.kind === 'opening'"
        class="mb-6 max-w-4xl space-y-5"
        aria-label="Opening summary and requirements"
      >
        <div v-if="item.summary">
          <h2 class="text-lg">Summary</h2>
          <p
            class="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/70"
          >
            {{ item.summary }}
          </p>
        </div>
        <div v-if="item.body">
          <h2 class="text-lg">Requirements and details</h2>
          <p
            class="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/70"
          >
            {{ item.body }}
          </p>
        </div>
      </section>
      <div
        class="grid gap-6 sm:gap-8"
        :class="
          item.kind === 'opening'
            ? 'max-w-4xl'
            : 'lg:grid-cols-[minmax(0,1fr)_280px]'
        "
      >
        <div v-if="item.kind !== 'opening'" class="min-w-0">
          <template v-if="item.kind !== 'tournament'">
            <p
              v-if="item.body"
              class="whitespace-pre-line text-sm leading-7 text-foreground/75 sm:text-base"
            >
              {{ item.body }}
            </p>
            <p v-else class="text-sm leading-6 text-foreground/55">
              More details will be shared by the organization.
            </p>
          </template>
          <template v-if="item.kind === 'tournament'">
            <section aria-labelledby="tournament-matches-title">
              <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 id="tournament-matches-title" class="text-xl">Matches</h2>
                <p class="text-xs text-foreground/50">Scroll for more</p>
              </div>
              <TournamentMatches :fixtures="fixtures" :teams="teams" />
            </section>
            <h2 class="mb-3 mt-8 text-xl">Scoreboard</h2>
            <p class="mb-5 text-sm text-foreground/60">
              Standings update automatically when match results are recorded.
            </p>
            <TournamentScoreboard :teams="teams" />
          </template>
        </div>
        <div class="min-w-0 space-y-5">
          <aside class="panel h-fit space-y-5 text-sm">
            <template v-if="item.kind === 'product'"
              ><div>
                <p class="eyebrow">Price</p>
                <p class="mt-2 text-2xl">
                  {{ item.price === null ? "On inquiry" : peso(item.price) }}
                </p>
              </div>
              <div>
                <p class="eyebrow">Availability</p>
                <p class="mt-2">{{ item.availability }}</p>
              </div>
              <div v-if="item.variants.length">
                <p class="eyebrow">Variants</p>
                <p class="mt-2">{{ item.variants.join(" / ") }}</p>
              </div>
              <a
                v-if="
                  safeLink(settings?.inquiry_url) || settings?.contact_email
                "
                :href="
                  safeLink(settings?.inquiry_url) ||
                  `mailto:${settings?.contact_email}?subject=${encodeURIComponent(item.title)}`
                "
                class="btn w-full"
                :target="safeLink(settings?.inquiry_url) ? '_blank' : undefined"
                rel="noopener noreferrer"
                >Inquire to order
                <span v-if="safeLink(settings?.inquiry_url)" aria-hidden="true"
                  >↗</span
                ><ActionIcon name="mail" v-else
              /></a>
              <p v-else class="text-foreground/55">
                Ordering contact will be published soon.
              </p></template
            ><template v-else
              ><div>
                <p class="eyebrow">
                  {{
                    item.starts_at
                      ? item.kind === "tournament"
                        ? "Date"
                        : "Date · Philippine time"
                      : "Published"
                  }}
                </p>
                <p :class="item.kind === 'tournament' ? 'mt-1' : 'mt-2'">
                  {{
                    date(item.starts_at || item.created_at, !!item.starts_at)
                  }}
                </p>
              </div>
              <div v-if="item.kind === 'tournament' && item.ends_at">
                <p class="eyebrow">End date</p>
                <p class="mt-1">{{ date(item.ends_at, true) }}</p>
              </div>
              <div v-if="item.kind === 'opening' && item.deadline">
                <p class="eyebrow">Submission deadline</p>
                <p class="mt-2">{{ date(item.deadline, true) }}</p>
              </div>
              <div v-if="item.venue">
                <p class="eyebrow">Venue</p>
                <p :class="item.kind === 'tournament' ? 'mt-1' : 'mt-2'">
                  {{ item.venue }}
                </p>
              </div>
              <div v-if="item.game">
                <p class="eyebrow">Game</p>
                <p :class="item.kind === 'tournament' ? 'mt-1' : 'mt-2'">
                  {{ item.game }}
                </p>
              </div>
              <p
                v-if="item.kind === 'opening'"
                class="border-t border-line pt-5 text-xs leading-6 text-foreground/60"
              >
                OLFU Quezon City students only. Campus eligibility is reviewed
                by officers and committees. Applications are collected through
                the official external form.
              </p>
              <template v-if="item.kind === 'opening'">
                <a
                  v-if="applicationUrl"
                  :href="applicationUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn w-full"
                  >Apply via external form
                  <span aria-hidden="true">&#8599;</span></a
                >
                <p v-else class="text-sm text-foreground/60">
                  {{
                    item.status !== "open" ||
                    (item.deadline && Date.parse(item.deadline) <= Date.now())
                      ? "Applications are currently closed."
                      : "The application form link will be shared soon."
                  }}
                </p>
              </template>
              <a
                v-else-if="safeLink(item.external_url)"
                :href="safeLink(item.external_url)"
                target="_blank"
                rel="noopener noreferrer"
                class="btn w-full"
                >{{
                  item.kind === "tournament"
                    ? "View external bracket"
                    : "Official link"
                }}
                ↗</a
              ></template
            >
          </aside>
          <section
            v-if="item.kind === 'tournament' && item.body"
            class="panel text-sm"
            aria-labelledby="tournament-rules-title"
          >
            <h2 id="tournament-rules-title" class="text-base font-medium">
              Rules
            </h2>
            <p
              class="mt-3 whitespace-pre-line break-words leading-6 text-foreground/70"
            >
              {{ item.body }}
            </p>
          </section>
        </div>
      </div>
    </article>
  </div>
</template>
