<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import Modal from "./Modal.vue";
import { requireClient } from "../lib/client";
import { toLocal, fromLocal, errorMessage } from "../lib/format";
import type { ScoreboardTeam, TournamentFixture } from "../lib/types";
const props = defineProps<{
  tournamentId: string;
  teams: ScoreboardTeam[];
  fixture?: TournamentFixture;
  startsAt?: string | null;
  endsAt?: string | null;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const form = reactive({
  team_a_id: props.fixture?.team_a_id || "",
  team_b_id: props.fixture?.team_b_id || "",
  winner_id: props.fixture?.winner_id || "",
  starts_at: toLocal(props.fixture?.starts_at || null),
  round_label: props.fixture?.round_label || "",
  status: props.fixture?.status || "scheduled",
});
const participants = computed(() =>
  props.teams.filter((team) =>
    [form.team_a_id, form.team_b_id].includes(team.id),
  ),
);
const loser = computed(() =>
  form.winner_id
    ? participants.value.find((team) => team.id !== form.winner_id)
        ?.team_name || "Select both teams"
    : "Not decided",
);
watch(
  () => [form.team_a_id, form.team_b_id],
  () => {
    if (![form.team_a_id, form.team_b_id].includes(form.winner_id))
      form.winner_id = "";
  },
);
watch(
  () => form.status,
  (status) => {
    if (status !== "completed") form.winner_id = "";
  },
);
function selectWinner() {
  if (form.winner_id) form.status = "completed";
}
const busy = ref(false),
  error = ref("");
async function save() {
  busy.value = true;
  error.value = "";
  try {
    const data = {
      team_a_id: form.team_a_id,
      team_b_id: form.team_b_id,
      starts_at: fromLocal(form.starts_at),
      round_label: form.round_label.trim(),
      status: form.status,
      winner_id: form.status === "completed" ? form.winner_id || null : null,
    };
    const result = props.fixture
      ? await requireClient()
          .from("tournament_fixtures")
          .update({ ...data, version: props.fixture.version + 1 })
          .eq("id", props.fixture.id)
          .eq("version", props.fixture.version)
          .select("id")
          .single()
      : await requireClient()
          .from("tournament_fixtures")
          .insert({ ...data, tournament_id: props.tournamentId })
          .select("id")
          .single();
    if (result.error)
      throw new Error(
        result.error.code === "PGRST116"
          ? "This match changed or was removed. Refresh and try again."
          : errorMessage(result.error),
      );
    emit("saved");
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <Modal :title="fixture ? 'Edit match' : 'Add match'" @close="emit('close')">
    <p v-if="error" role="alert" class="mb-5 text-sm">{{ error }}</p>
    <form class="space-y-5" @submit.prevent="save">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="label"
          >First team<select v-model="form.team_a_id" required class="field">
            <option disabled value="">Select team</option>
            <option
              v-for="team in teams"
              :key="team.id"
              :value="team.id"
              :disabled="team.id === form.team_b_id"
            >
              {{ team.team_name }}
            </option>
          </select></label
        ><label class="label"
          >Second team<select v-model="form.team_b_id" required class="field">
            <option disabled value="">Select team</option>
            <option
              v-for="team in teams"
              :key="team.id"
              :value="team.id"
              :disabled="team.id === form.team_a_id"
            >
              {{ team.team_name }}
            </option>
          </select></label
        >
      </div>
      <label class="label"
        >Schedule / Philippine time<input
          v-model="form.starts_at"
          type="datetime-local"
          :min="startsAt ? toLocal(startsAt) : undefined"
          :max="endsAt ? toLocal(endsAt) : undefined"
          class="field"
      /></label>
      <p class="text-xs text-foreground/55">
        Leave the schedule blank if the time is still to be announced.
      </p>
      <label class="label"
        >Round / label<input
          v-model="form.round_label"
          maxlength="100"
          class="field"
          placeholder="e.g. Semifinal"
      /></label>
      <label class="label"
        >Status<select v-model="form.status" class="field">
          <option value="scheduled">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select></label
      >
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="label"
          >Winner<select
            v-model="form.winner_id"
            :required="form.status === 'completed'"
            :disabled="participants.length < 2"
            class="field"
            @change="selectWinner"
          >
            <option value="">Not decided</option>
            <option
              v-for="team in participants"
              :key="team.id"
              :value="team.id"
            >
              {{ team.team_name }}
            </option>
          </select></label
        ><label class="label"
          >Loser<input :value="loser" class="field" readonly
        /></label>
      </div>
      <p class="text-xs leading-6 text-foreground/55">
        Choosing a winner completes the match and updates wins and losses
        automatically. Changing a result adjusts the previous totals.
      </p>
      <button class="btn" :disabled="busy">
        {{ busy ? "Saving..." : "Save match" }}
      </button>
    </form>
  </Modal>
</template>
