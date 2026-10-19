<script setup lang="ts">
import { computed } from "vue";
import type { Match, PublicTeam } from "../lib/types";
import { date } from "../lib/format";
const props = defineProps<{ matches: Match[]; teams: PublicTeam[] }>();
const rounds = computed(() =>
  [...new Set(props.matches.map((m) => m.round))].sort((a, b) => a - b),
);
const teamName = (id: string | null) =>
  props.teams.find((t) => t.id === id)?.name || "Awaiting team";
const champion = computed(
  () =>
    props.matches.find((m) => m.round === rounds.value.at(-1) && m.resolved)
      ?.winner_id,
);
const placements = computed(() =>
  props.teams
    .map((t) => {
      const loss = props.matches.find(
        (m) =>
          m.resolved &&
          m.winner_id &&
          m.winner_id !== t.id &&
          (m.team_a === t.id || m.team_b === t.id),
      );
      return {
        name: t.name,
        place:
          t.id === champion.value
            ? "Champion"
            : loss
              ? loss.round === rounds.value.length
                ? "Runner-up"
                : `Joint ${2 ** (rounds.value.length - loss.round) + 1}`
              : "In contention",
        order:
          t.id === champion.value
            ? 0
            : loss
              ? 2 ** (rounds.value.length - loss.round) + 1
              : 999,
      };
    })
    .sort((a, b) => a.order - b.order),
);
</script>
<template>
  <div v-if="matches.length">
    <div
      class="overflow-x-auto pb-5"
      tabindex="0"
      aria-label="Tournament bracket, scroll horizontally"
    >
      <div class="flex min-w-max gap-6">
        <section
          v-for="round in rounds"
          :key="round"
          class="flex w-64 flex-col"
        >
          <h3 class="eyebrow mb-4">
            {{ round === rounds.at(-1) ? "Final" : `Round ${round}` }}
          </h3>
          <div class="flex flex-1 flex-col justify-around gap-5">
            <article
              v-for="match in matches
                .filter((m) => m.round === round)
                .sort((a, b) => a.position - b.position)"
              :key="match.id"
              class="border border-line bg-white"
            >
              <div
                v-for="(id, n) in [match.team_a, match.team_b]"
                :key="n"
                class="flex justify-between gap-3 border-b border-line/70 px-4 py-3 text-sm"
                :class="id && match.winner_id === id ? 'bg-teal/25' : ''"
              >
                <span class="truncate">{{
                  id ? teamName(id) : match.resolved ? "Bye" : "Awaiting team"
                }}</span
                ><span>{{
                  n === 0 ? (match.score_a ?? "—") : (match.score_b ?? "—")
                }}</span>
              </div>
              <p class="px-4 py-2 text-[10px] text-foreground/55">
                {{
                  match.resolved
                    ? "Final result"
                    : match.starts_at
                      ? date(match.starts_at, true)
                      : "Schedule to be announced"
                }}
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
    <section class="mt-6">
      <h3 class="text-lg">
        {{ champion ? "Final placements" : "Tournament progress" }}
      </h3>
      <div
        v-for="team in placements"
        :key="team.name"
        class="mt-3 flex justify-between gap-4 border-b border-line py-3 text-sm"
      >
        <span>{{ team.name }}</span
        ><span class="text-foreground/60">{{ team.place }}</span>
      </div>
    </section>
  </div>
  <p
    v-else
    class="flex min-h-48 items-center justify-center px-5 py-12 text-center text-sm text-foreground/55"
  >
    The bracket will appear after registration closes and officers and
    committees approve the teams.
  </p>
</template>
