<script setup lang="ts">
import { computed } from "vue";
import type { ScoreboardTeam, TournamentFixture } from "../lib/types";
import { sortFixtures } from "../lib/fixtures";
import { date } from "../lib/format";
const props = defineProps<{
  fixtures: TournamentFixture[];
  teams: ScoreboardTeam[];
}>();
const ordered = computed(() => sortFixtures(props.fixtures));
const name = (id: string) =>
  props.teams.find((team) => team.id === id)?.team_name || "Team unavailable";
const statusText = {
  scheduled: "Upcoming",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};
</script>
<template>
  <div
    v-if="ordered.length"
    tabindex="0"
    role="region"
    aria-label="Tournament matches; scroll horizontally for more"
    class="relative flex min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-3"
  >
    <article
      v-for="fixture in ordered"
      :key="fixture.id"
      class="relative w-[min(15rem,80vw)] shrink-0 snap-start border border-line bg-white p-4"
    >
      <div
        class="flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider"
      >
        <span
          :class="
            fixture.status === 'live'
              ? 'font-semibold text-phoenix'
              : 'text-foreground/55'
          "
          >{{ statusText[fixture.status] }}</span
        ><span v-if="fixture.round_label" class="truncate text-foreground/50">{{
          fixture.round_label
        }}</span>
      </div>
      <h3 class="mt-3 flex flex-col gap-1 text-xs font-medium leading-5">
        <span
          class="break-words"
          :class="
            fixture.winner_id === fixture.team_a_id
              ? 'bg-green-700 px-2 py-1 text-white'
              : ''
          "
          ><span v-if="fixture.winner_id === fixture.team_a_id" class="sr-only"
            >Winner: </span
          >{{ name(fixture.team_a_id) }}</span
        ><span
          class="text-[10px] font-normal uppercase tracking-widest text-foreground/40"
          >vs</span
        ><span
          class="break-words"
          :class="
            fixture.winner_id === fixture.team_b_id
              ? 'bg-green-700 px-2 py-1 text-white'
              : ''
          "
          ><span v-if="fixture.winner_id === fixture.team_b_id" class="sr-only"
            >Winner: </span
          >{{ name(fixture.team_b_id) }}</span
        >
      </h3>
      <p
        class="mt-3 border-t border-line pt-2 text-[11px] leading-5 text-foreground/60"
      >
        {{
          fixture.starts_at
            ? date(fixture.starts_at, true)
            : "Schedule to be announced"
        }}
      </p>
    </article>
  </div>
  <p
    v-else
    class="flex min-h-36 items-center justify-center py-8 text-center text-sm text-foreground/55"
  >
    Match schedules will be announced soon.
  </p>
</template>
