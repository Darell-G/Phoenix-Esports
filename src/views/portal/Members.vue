<script setup lang="ts">
import { usePagination } from "../../composables/usePagination";
import PortalPagination from "../../components/PortalPagination.vue";
import { computed, onMounted, reactive, ref } from "vue";
import { Plus, Pencil } from "lucide-vue-next";
import { useRecords } from "../../composables/useRecords";
import { requireClient } from "../../lib/client";
import { errorMessage } from "../../lib/format";
import type { Member } from "../../lib/types";
import Modal from "../../components/Modal.vue";
import LoadState from "../../components/LoadState.vue";
const { rows, loading, error, load } = useRecords<Member>("members");
const search = ref(""),
  category = ref(""),
  active = ref("active"),
  editor = ref(false),
  selected = ref<Member>(),
  failure = ref(""),
  busy = ref(false);
const form = reactive({
  name: "",
  position: "",
  category: "player",
  game: "",
  team: "",
  academic_term: "",
  active: true,
  public_visible: false,
});
const filtered = computed(() =>
  rows.value.filter(
    (m) =>
      `${m.name} ${m.team} ${m.position}`
        .toLowerCase()
        .includes(search.value.toLowerCase()) &&
      (!category.value || m.category === category.value) &&
      (active.value === "all" || m.active === (active.value === "active")),
  ),
);
const { page, entries, total, pageSize } = usePagination(filtered, [
  search,
  category,
  active,
]);
onMounted(load);
function edit(member?: Member) {
  selected.value = member;
  failure.value = "";
  Object.assign(
    form,
    member || {
      name: "",
      position: "",
      category: "player",
      game: "",
      team: "",
      academic_term: "",
      active: true,
      public_visible: false,
    },
  );
  editor.value = true;
}
async function save() {
  busy.value = true;
  failure.value = "";
  try {
    const data = {
      name: form.name.trim(),
      position: form.position,
      category: form.category,
      game: form.category === "player" ? form.game : "",
      team: form.category === "player" ? form.team : "",
      academic_term: form.academic_term,
      active: form.active,
      public_visible: form.public_visible,
    };
    const result = selected.value
      ? await requireClient()
          .from("members")
          .update(data)
          .eq("id", selected.value.id)
          .select("id")
          .single()
      : await requireClient()
          .from("members")
          .insert(data)
          .select("id")
          .single();
    if (result.error) throw result.error;
    editor.value = false;
    await load();
  } catch (e) {
    failure.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section>
    <div class="flex flex-wrap justify-between gap-5">
      <div>
        <h1 class="text-2xl sm:text-3xl tracking-tight">
          Organization members
        </h1>
        <p class="mt-3 text-sm text-foreground/55">
          Officers, committees, and players across academic terms.
        </p>
      </div>
      <button class="btn h-fit text-xs" @click="edit()">
        <Plus :size="16" />Add member
      </button>
    </div>
    <div class="my-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
      <label class="min-w-0 flex-1"
        ><span class="sr-only">Search members</span
        ><input
          v-model="search"
          type="search"
          class="field"
          placeholder="Search name, team, or position…" /></label
      ><label
        ><span class="sr-only">Category</span
        ><select v-model="category" class="field">
          <option value="">All categories</option>
          <option value="officer">Officers</option>
          <option value="committee">Committees</option>
          <option value="player">Players</option>
        </select></label
      ><label
        ><span class="sr-only">Membership status</span
        ><select v-model="active" class="field">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All members</option>
        </select></label
      >
    </div>
    <LoadState
      :loading="loading"
      :error="error"
      :empty="!filtered.length"
      message="No members match this view."
      @retry="load"
    />
    <div
      v-if="!loading && !error && filtered.length"
      tabindex="0"
      role="region"
      aria-label="Scrollable records"
      class="max-w-full overflow-x-auto border border-line bg-surface"
    >
      <table class="w-full min-w-[650px] text-left text-sm">
        <thead class="bg-paper text-xs text-foreground/55">
          <tr>
            <th class="p-4">Name / position</th>
            <th class="p-4">Category</th>
            <th class="p-4">Team / game</th>
            <th class="p-4">Term</th>
            <th class="p-4">Visibility</th>
            <th class="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in entries"
            :key="member.id"
            class="border-t border-line"
          >
            <td class="p-4">
              {{ member.name
              }}<span class="mt-1 block text-xs text-foreground/50">{{
                member.position
              }}</span>
            </td>
            <td class="p-4 capitalize">{{ member.category }}</td>
            <td class="p-4">
              {{ member.team || "—"
              }}<span class="mt-1 block text-xs text-foreground/50">{{
                member.game
              }}</span>
            </td>
            <td class="p-4 text-xs">{{ member.academic_term || "—" }}</td>
            <td class="p-4 text-xs">
              {{
                member.active && member.public_visible ? "Public" : "Private"
              }}
            </td>
            <td class="p-4">
              <button
                class="inline-flex min-h-11 items-center gap-2 text-xs"
                @click="edit(member)"
              >
                <Pencil :size="14" />Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <PortalPagination
      v-if="!loading && !error"
      v-model:page="page"
      :total="total"
      :page-size="pageSize"
      label="Members"
    />
    <Modal
      v-if="editor"
      :title="selected ? 'Edit member' : 'Add member'"
      @close="editor = false"
      ><p
        v-if="failure"
        role="alert"
        class="mb-5 text-sm text-red-800 dark:text-red-300"
      >
        {{ failure }}
      </p>
      <form class="space-y-5" @submit.prevent="save">
        <label class="label"
          >Name<input
            v-model="form.name"
            required
            maxlength="160"
            class="field"
        /></label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="label"
            >Category<select v-model="form.category" class="field">
              <option value="officer">Officer</option>
              <option value="committee">Committee</option>
              <option value="player">Player</option>
            </select></label
          ><label class="label"
            >Position<input
              v-model="form.position"
              maxlength="100"
              class="field" /></label
          ><label v-if="form.category === 'player'" class="label"
            >Game<input
              v-model="form.game"
              maxlength="100"
              class="field" /></label
          ><label v-if="form.category === 'player'" class="label"
            >Team<input
              v-model="form.team"
              maxlength="100"
              class="field" /></label
          ><label class="label"
            >Academic term<input
              v-model="form.academic_term"
              maxlength="80"
              placeholder="e.g. 2026–2027"
              class="field"
          /></label>
        </div>
        <label class="flex gap-3 text-sm"
          ><input v-model="form.active" type="checkbox" />Active member</label
        ><label class="flex gap-3 text-sm"
          ><input v-model="form.public_visible" type="checkbox" />Allow this
          member to appear publicly</label
        ><button class="btn" :disabled="busy">
          {{ busy ? "Saving…" : "Save member" }}
        </button>
      </form></Modal
    >
  </section>
</template>
