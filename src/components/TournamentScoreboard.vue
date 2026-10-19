<script setup lang="ts">
import { computed } from "vue";
import type { ScoreboardTeam } from "../lib/types";
import { sortScoreboard } from "../lib/scoreboard";
const props = defineProps<{ teams: ScoreboardTeam[] }>();
const standings = computed(() => sortScoreboard(props.teams));
</script>
<template>
  <div
    v-if="standings.length"
    tabindex="0"
    role="region"
    aria-label="Tournament standings"
    class="relative max-w-full overflow-x-auto border border-gray-200 bg-white text-ink"
  >
    <table class="w-full text-left text-xs sm:text-sm">
      <caption class="sr-only">
        Tournament team standings, ordered by wins and losses
      </caption>
      <thead
        class="border-b border-gray-200 bg-gray-100 text-xs text-gray-600 [&_th]:font-medium"
      >
        <tr>
          <th class="p-2 sm:p-4">Rank</th>
          <th class="p-2 sm:p-4">Team</th>
          <th class="p-2 text-right sm:p-4">Wins</th>
          <th class="p-2 text-right sm:p-4">Losses</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(team, index) in standings"
          :key="team.id"
          class="border-b border-gray-200 bg-white even:bg-gray-50 last:border-0 hover:bg-gray-100"
        >
          <td class="p-2 tabular-nums text-gray-500 sm:p-4">{{ index + 1 }}</td>
          <th
            scope="row"
            class="max-w-40 break-words p-2 font-medium [overflow-wrap:anywhere] sm:p-4"
          >
            {{ team.team_name }}
          </th>
          <td class="p-2 text-right font-medium tabular-nums sm:p-4">
            {{ team.wins }}
          </td>
          <td class="p-2 text-right tabular-nums text-gray-500 sm:p-4">
            {{ team.losses }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p
    v-else
    class="flex min-h-48 items-center justify-center px-5 py-12 text-center text-sm text-foreground/55"
  >
    No teams have been added to the scoreboard yet.
  </p>
</template>
