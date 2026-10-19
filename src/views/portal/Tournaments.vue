<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-vue-next";
import { useRecords } from "../../composables/useRecords";
import { usePagination } from "../../composables/usePagination";
import { requireClient } from "../../lib/client";
import { sortScoreboard, loadScoreboard } from "../../lib/scoreboard";
import { sortTournaments } from "../../lib/tournaments";
import { date, human, errorMessage, safeLink } from "../../lib/format";
import type {
  Content,
  ScoreboardTeam,
  TournamentFixture,
} from "../../lib/types";
import LoadState from "../../components/LoadState.vue";
import ContentEditor from "../../components/ContentEditor.vue";
import PortalPagination from "../../components/PortalPagination.vue";
import { loadFixtures, sortFixtures } from "../../lib/fixtures";
import TournamentMatchEditor from "../../components/TournamentMatchEditor.vue";
import Modal from "../../components/Modal.vue";
const { rows, loading, error, load } = useRecords<Content>("content");
const tournaments = computed(() =>
  sortTournaments(rows.value.filter((item) => item.kind === "tournament")),
);
const { page, entries, total, pageSize } = usePagination(tournaments);
const tournamentStrip = ref<HTMLDivElement>();
watch(
  page,
  () => {
    tournamentStrip.value?.scrollTo({ left: 0 });
  },
  { flush: "post" },
);
const editor = ref(false),
  editing = ref<Content>(),
  selected = ref<Content | null>(null);
const fixtures = ref<TournamentFixture[]>([]);
const teams = ref<ScoreboardTeam[]>([]),
  scoreboardLoading = ref(false),
  scoreboardError = ref("");
const sortedTeams = computed(() => sortScoreboard(teams.value));
const {
  page: teamPage,
  entries: teamEntries,
  total: teamTotal,
} = usePagination(sortedTeams, [() => selected.value?.id]);
const teamEditor = ref(false),
  currentTeam = ref<ScoreboardTeam>(),
  deleting = ref<ScoreboardTeam>();
const busy = ref(false),
  failure = ref("");
const form = reactive({ team_name: "" });
const matchEditor = ref(false),
  currentMatch = ref<TournamentFixture>(),
  deletingMatch = ref<TournamentFixture>();
const orderedFixtures = computed(() => sortFixtures(fixtures.value));
const {
  page: matchPage,
  entries: matchEntries,
  total: matchTotal,
} = usePagination(orderedFixtures, [() => selected.value?.id]);
const teamName = (id: string) =>
  teams.value.find((team) => team.id === id)?.team_name || "Team unavailable";
function editMatch(fixture?: TournamentFixture) {
  currentMatch.value = fixture;
  matchEditor.value = true;
}
async function matchSaved() {
  matchEditor.value = false;
  if (selected.value) await manage(selected.value);
}
async function removeMatch() {
  if (!deletingMatch.value || !selected.value) return;
  busy.value = true;
  failure.value = "";
  try {
    const { error } = await requireClient()
      .from("tournament_fixtures")
      .delete()
      .eq("id", deletingMatch.value.id)
      .eq("version", deletingMatch.value.version)
      .select("id")
      .single();
    if (error)
      throw new Error(
        error.code === "PGRST116"
          ? "This match changed or was removed. Refresh and try again."
          : errorMessage(error),
      );
    deletingMatch.value = undefined;
    await manage(selected.value);
  } catch (error) {
    failure.value = errorMessage(error);
  } finally {
    busy.value = false;
  }
}
let requestVersion = 0;
onMounted(load);
function edit(item?: Content) {
  editing.value = item;
  editor.value = true;
}
async function saved() {
  editor.value = false;
  await load();
  if (selected.value)
    selected.value =
      rows.value.find((item) => item.id === selected.value?.id) || null;
}
async function manage(item: Content) {
  const request = ++requestVersion;
  selected.value = item;
  teams.value = [];
  fixtures.value = [];
  scoreboardLoading.value = true;
  scoreboardError.value = "";
  try {
    const [collected, schedule] = await Promise.all([
      loadScoreboard(item.id),
      loadFixtures(item.id),
    ]);
    if (request === requestVersion) {
      teams.value = collected;
      fixtures.value = schedule;
    }
  } catch (error) {
    if (request === requestVersion) scoreboardError.value = errorMessage(error);
  } finally {
    if (request === requestVersion) scoreboardLoading.value = false;
  }
}
function editTeam(team?: ScoreboardTeam) {
  currentTeam.value = team;
  Object.assign(form, { team_name: team?.team_name || "" });
  failure.value = "";
  teamEditor.value = true;
}
function mutationError(error: { code?: string; message: string }) {
  return error.code === "23505"
    ? "This team is already listed in this tournament."
    : error.code === "PGRST116"
      ? "This team changed or was removed. Refresh the scoreboard and try again."
      : error.code === "23503"
        ? "This team has matches. Remove or update those matches before removing the team."
        : errorMessage(error);
}
async function saveTeam() {
  if (!selected.value) return;
  busy.value = true;
  failure.value = "";
  try {
    const data = {
      team_name: form.team_name.trim(),
    };
    const result = currentTeam.value
      ? await requireClient()
          .from("tournament_scoreboard")
          .update({ ...data, version: currentTeam.value.version + 1 })
          .eq("id", currentTeam.value.id)
          .eq("version", currentTeam.value.version)
          .select("id")
          .single()
      : await requireClient()
          .from("tournament_scoreboard")
          .insert({ ...data, tournament_id: selected.value.id })
          .select("id")
          .single();
    if (result.error) throw new Error(mutationError(result.error));
    teamEditor.value = false;
    await manage(selected.value);
  } catch (error) {
    failure.value = errorMessage(error);
  } finally {
    busy.value = false;
  }
}
async function removeTeam() {
  if (!deleting.value || !selected.value) return;
  busy.value = true;
  failure.value = "";
  try {
    const { error } = await requireClient()
      .from("tournament_scoreboard")
      .delete()
      .eq("id", deleting.value.id)
      .eq("version", deleting.value.version)
      .select("id")
      .single();
    if (error) throw new Error(mutationError(error));
    deleting.value = undefined;
    await manage(selected.value);
  } catch (error) {
    failure.value = errorMessage(error);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section>
    <div class="flex flex-wrap justify-between gap-5">
      <div>
        <h1 class="text-2xl sm:text-3xl tracking-tight">Tournaments</h1>
        <p class="mt-3 text-sm text-foreground/55">
          Publish tournament details, link an external bracket, and update team
          standings.
        </p>
      </div>
      <button class="btn h-fit text-xs" @click="edit()">
        <Plus :size="16" />Create tournament
      </button>
    </div>
    <LoadState
      class="mt-7"
      :loading="loading"
      :error="error"
      :empty="!tournaments.length"
      message="No tournaments created yet."
      @retry="load"
    />
    <div
      v-if="!loading && !error && entries.length"
      ref="tournamentStrip"
      role="region"
      aria-label="Tournaments, scroll horizontally to view more"
      tabindex="0"
      class="mt-6 flex min-w-0 snap-x snap-proximity gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]"
    >
      <article
        v-for="item in entries"
        :key="item.id"
        class="panel flex w-[85%] shrink-0 snap-start flex-col sm:w-[26rem]"
      >
        <h2 class="text-xl">{{ item.title }}</h2>
        <p v-if="item.champion_name" class="mt-3 text-sm font-medium">
          Champion: {{ item.champion_name }}
        </p>
        <p class="mt-3 text-xs capitalize text-foreground/60">
          {{ item.game }} / {{ human(item.status) }}
        </p>
        <p class="mt-3 text-xs text-foreground/50">
          {{ date(item.starts_at, true)
          }}<span v-if="item.ends_at" class="mt-1 block"
            >Ends {{ date(item.ends_at, true) }}</span
          >
        </p>
        <div class="mt-auto flex flex-wrap gap-4 pt-6">
          <button class="btn-outline min-h-10 text-xs" @click="edit(item)">
            <Pencil :size="14" />Edit details</button
          ><button class="btn min-h-10 text-xs" @click="manage(item)">
            Teams & matches</button
          ><a
            v-if="safeLink(item.external_url)"
            :href="safeLink(item.external_url)"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-xs"
            >External bracket<ExternalLink :size="14"
          /></a>
        </div>
      </article>
    </div>
    <PortalPagination
      v-if="!loading && !error"
      v-model:page="page"
      :total="total"
      :page-size="pageSize"
      label="Tournaments"
    />
    <section v-if="selected" class="mt-10 border-t border-line pt-8">
      <div class="mb-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h2 class="text-xl">Matches / {{ selected.title }}</h2>
          <button
            class="btn text-xs"
            :disabled="scoreboardLoading || teams.length < 2"
            @click="editMatch()"
          >
            <Plus :size="16" />Add match
          </button>
        </div>
        <p class="mt-3 text-sm text-foreground/55">
          Choose two scoreboard teams and set their schedule.
          {{
            teams.length < 2
              ? "Add at least two teams below to schedule a match."
              : ""
          }}
        </p>
        <LoadState
          class="mt-5"
          :loading="scoreboardLoading"
          :error="scoreboardError"
          :empty="!fixtures.length"
          message="No matches have been scheduled yet."
          @retry="manage(selected)"
        />
        <div
          v-if="!scoreboardLoading && !scoreboardError && fixtures.length"
          tabindex="0"
          role="region"
          aria-label="Scrollable matches"
          class="mt-5 max-w-full overflow-x-auto border border-line"
        >
          <table class="w-full min-w-[600px] text-left text-sm">
            <thead class="text-xs text-foreground/55">
              <tr>
                <th class="p-4">Match</th>
                <th class="p-4">Schedule / PHT</th>
                <th class="p-4">Status</th>
                <th class="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fixture in matchEntries"
                :key="fixture.id"
                class="border-t border-line"
              >
                <td class="p-4">
                  {{ teamName(fixture.team_a_id) }} vs
                  {{ teamName(fixture.team_b_id)
                  }}<span
                    v-if="fixture.winner_id"
                    class="mt-1 block text-xs text-foreground/55"
                    >Winner: {{ teamName(fixture.winner_id) }}</span
                  ><span
                    v-if="fixture.round_label"
                    class="mt-1 block text-xs text-foreground/55"
                    >{{ fixture.round_label }}</span
                  >
                </td>
                <td class="p-4 text-xs">{{ date(fixture.starts_at, true) }}</td>
                <td class="p-4 text-xs capitalize">
                  {{
                    fixture.status === "scheduled" ? "Upcoming" : fixture.status
                  }}
                </td>
                <td class="p-4">
                  <div class="flex gap-4">
                    <button
                      class="inline-flex min-h-11 items-center gap-1 text-xs"
                      @click="editMatch(fixture)"
                    >
                      <Pencil :size="14" />Edit</button
                    ><button
                      class="inline-flex min-h-11 items-center gap-1 text-xs"
                      @click="
                        deletingMatch = fixture;
                        failure = '';
                      "
                    >
                      <Trash2 :size="14" />Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <PortalPagination
          v-if="!scoreboardLoading && !scoreboardError"
          v-model:page="matchPage"
          :total="matchTotal"
          :page-size="pageSize"
          label="Matches"
        />
      </div>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="eyebrow">Team scoreboard</p>
          <h2 class="mt-3 text-2xl">{{ selected.title }}</h2>
          <p class="mt-3 text-sm text-foreground/55">
            Add teams registered through your external service. Wins and losses
            come from completed matches.
          </p>
        </div>
        <button
          class="btn text-xs"
          :disabled="scoreboardLoading"
          @click="editTeam()"
        >
          <Plus :size="16" />Add team
        </button>
      </div>
      <LoadState
        class="mt-6"
        :loading="scoreboardLoading"
        :error="scoreboardError"
        :empty="!teams.length"
        message="No teams have been added yet."
        @retry="manage(selected)"
      />
      <div
        v-if="!scoreboardLoading && !scoreboardError && teams.length"
        tabindex="0"
        role="region"
        aria-label="Scrollable teams"
        class="mt-6 max-w-full overflow-x-auto border border-line"
      >
        <table class="w-full min-w-[600px] text-left text-sm">
          <thead class="bg-paper text-xs text-foreground/55">
            <tr>
              <th class="p-4">Rank</th>
              <th class="p-4">Team</th>
              <th class="p-4">Wins</th>
              <th class="p-4">Losses</th>
              <th class="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(team, index) in teamEntries"
              :key="team.id"
              class="border-t border-line"
            >
              <td class="p-4">{{ (teamPage - 1) * pageSize + index + 1 }}</td>
              <td class="p-4">{{ team.team_name }}</td>
              <td class="p-4">{{ team.wins }}</td>
              <td class="p-4">{{ team.losses }}</td>
              <td class="p-4">
                <div class="flex gap-4">
                  <button
                    class="inline-flex min-h-11 items-center gap-1 text-xs"
                    @click="editTeam(team)"
                  >
                    <Pencil :size="14" />Edit</button
                  ><button
                    class="inline-flex min-h-11 items-center gap-1 text-xs"
                    @click="
                      deleting = team;
                      failure = '';
                    "
                  >
                    <Trash2 :size="14" />Remove
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PortalPagination
        v-if="!scoreboardLoading && !scoreboardError"
        v-model:page="teamPage"
        :total="teamTotal"
        :page-size="pageSize"
        label="Teams"
      />
    </section>
    <TournamentMatchEditor
      v-if="matchEditor && selected"
      :key="currentMatch?.id || 'new-match'"
      :tournament-id="selected.id"
      :teams="teams"
      :fixture="currentMatch"
      :starts-at="selected.starts_at"
      :ends-at="selected.ends_at"
      @close="matchEditor = false"
      @saved="matchSaved"
    />
    <Modal
      v-if="deletingMatch"
      title="Remove match"
      @close="deletingMatch = undefined"
      ><p class="text-sm">
        Remove {{ teamName(deletingMatch.team_a_id) }} vs
        {{ teamName(deletingMatch.team_b_id) }} from the match schedule?
      </p>
      <p v-if="failure" role="alert" class="mt-4 text-sm">{{ failure }}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <button class="btn" :disabled="busy" @click="removeMatch">
          Remove match</button
        ><button
          class="btn-outline"
          :disabled="busy"
          @click="deletingMatch = undefined"
        >
          Cancel
        </button>
      </div></Modal
    >
    <ContentEditor
      v-if="editor"
      :key="editing?.id || 'create'"
      :item="editing"
      :kinds="['tournament']"
      @close="editor = false"
      @saved="saved"
    />
    <Modal
      v-if="teamEditor"
      :title="currentTeam ? 'Edit scoreboard team' : 'Add scoreboard team'"
      @close="teamEditor = false"
    >
      <p v-if="failure" role="alert" class="mb-5 text-sm">{{ failure }}</p>
      <form class="space-y-5" @submit.prevent="saveTeam">
        <label class="label"
          >Team name<input
            v-model="form.team_name"
            required
            maxlength="100"
            class="field"
        /></label>
        <p class="text-xs text-foreground/55">
          Wins and losses are updated automatically from completed matches.
        </p>
        <button class="btn" :disabled="busy">
          {{ busy ? "Saving..." : "Save team" }}
        </button>
      </form>
    </Modal>
    <Modal
      v-if="deleting"
      title="Remove scoreboard team"
      @close="deleting = undefined"
      ><p class="text-sm">
        Remove {{ deleting.team_name }} and its recorded standings?
      </p>
      <p v-if="failure" role="alert" class="mt-4 text-sm">{{ failure }}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <button class="btn" :disabled="busy" @click="removeTeam">
          Remove team</button
        ><button
          class="btn-outline"
          :disabled="busy"
          @click="deleting = undefined"
        >
          Cancel
        </button>
      </div></Modal
    >
  </section>
</template>
