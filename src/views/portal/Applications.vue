<script setup lang="ts">
import { usePagination } from "../../composables/usePagination";
import PortalPagination from "../../components/PortalPagination.vue";
import { computed, onMounted, ref } from "vue";
import { useRecords } from "../../composables/useRecords";
import { invoke } from "../../lib/client";
import { date, human, errorMessage, titleCase } from "../../lib/format";
import type { Application } from "../../lib/types";
import Modal from "../../components/Modal.vue";
import LoadState from "../../components/LoadState.vue";
const { rows, loading, error, load } = useRecords<
  Application & { member_id: string | null }
>("applications");
const search = ref(""),
  filter = ref(""),
  selected = ref<(Application & { member_id: string | null }) | null>(null),
  busy = ref(false),
  failure = ref(""),
  category = ref("player"),
  position = ref(""),
  term = ref("");
const statuses = [
  "submitted",
  "under_review",
  "shortlisted",
  "accepted",
  "rejected",
  "withdrawn",
];
const filtered = computed(() =>
  rows.value.filter(
    (a) =>
      (!filter.value || a.status === filter.value) &&
      `${a.name} ${a.reference} ${a.email}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
);
const { page, entries, total, pageSize } = usePagination(filtered, [
  search,
  filter,
]);
onMounted(load);
function review(row: Application & { member_id: string | null }) {
  selected.value = { ...row };

  failure.value = "";
}
async function save(convert = false) {
  if (!selected.value) return;
  busy.value = true;
  failure.value = "";
  try {
    await invoke(convert ? "convert_member" : "review_application", {
      id: selected.value.id,

      data: convert
        ? {
            category: category.value,
            position: position.value,
            academic_term: term.value,
          }
        : {
            status: selected.value.status,
            campus_verified: selected.value.campus_verified,
            internal_notes: selected.value.internal_notes,
            public_feedback: selected.value.public_feedback,
          },
    });
    selected.value = null;
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
    <h1 class="text-2xl sm:text-3xl tracking-tight">Applications</h1>
    <p class="mt-3 text-sm text-foreground/55">
      Review student applications and verify campus eligibility before
      acceptance.
    </p>
    <div class="my-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
      <label class="min-w-0 flex-1"
        ><span class="sr-only">Search applications</span
        ><input
          v-model="search"
          class="field"
          type="search"
          placeholder="Search name, reference, or email…" /></label
      ><label
        ><span class="sr-only">Application status</span
        ><select v-model="filter" class="field">
          <option value="">All statuses</option>
          <option v-for="status in statuses" :key="status" :value="status">
            {{ human(status) }}
          </option>
        </select></label
      >
    </div>
    <LoadState
      :loading="loading"
      :error="error"
      :empty="!filtered.length"
      message="No applications match this view."
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
            <th class="p-4">Applicant</th>
            <th class="p-4">Reference</th>
            <th class="p-4">Status</th>
            <th class="p-4">Submitted</th>
            <th class="p-4">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="application in entries"
            :key="application.id"
            class="border-t border-line"
          >
            <td class="p-4">
              {{ application.name
              }}<span class="mt-1 block text-xs text-foreground/50">{{
                application.email
              }}</span>
            </td>
            <td class="p-4 text-xs">{{ application.reference }}</td>
            <td class="p-4 capitalize">{{ human(application.status) }}</td>
            <td class="p-4 text-xs">{{ date(application.created_at) }}</td>
            <td class="p-4">
              <button class="text-xs underline" @click="review(application)">
                Review
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
      label="Applications"
    />
    <Modal v-if="selected" :title="selected.name" @close="selected = null"
      ><p
        v-if="failure"
        role="alert"
        class="mb-5 text-sm text-red-800 dark:text-red-300"
      >
        {{ failure }}
      </p>
      <dl class="grid gap-4 border-b border-line pb-5 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs text-foreground/50">Student number</dt>
          <dd class="mt-1">{{ selected.student_number }}</dd>
        </div>
        <div>
          <dt class="text-xs text-foreground/50">Course / year</dt>
          <dd class="mt-1">{{ selected.course_year }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs text-foreground/50">
            Experience / player details
          </dt>
          <dd class="mt-2 whitespace-pre-line leading-6">
            {{ selected.experience || "None provided" }}
          </dd>
        </div>
      </dl>
      <form class="mt-5 space-y-5" @submit.prevent="save()">
        <label class="label"
          >Status<select v-model="selected.status" class="field">
            <option v-for="status in statuses" :key="status" :value="status">
              {{ titleCase(status) }}
            </option>
          </select></label
        ><label class="flex gap-3 text-sm"
          ><input v-model="selected.campus_verified" type="checkbox" />I
          verified OLFU Quezon City enrollment</label
        ><label class="label"
          >Internal notes<textarea
            v-model="selected.internal_notes"
            maxlength="5000"
            rows="3"
            class="field"
          ></textarea></label
        ><label class="label"
          >Feedback visible to the applicant<textarea
            v-model="selected.public_feedback"
            maxlength="5000"
            rows="3"
            class="field"
          ></textarea>
        </label>
        <button :disabled="busy" class="btn">
          {{ busy ? "Saving…" : "Save review" }}
        </button>
        <section
          v-if="selected.status === 'accepted' && !selected.member_id"
          class="border-t border-line pt-5"
        >
          <h3 class="text-base">Convert accepted applicant to member</h3>
          <p class="mt-2 text-xs leading-6 text-foreground/55">
            Save acceptance first. Conversion creates a private member record
            once; it does not grant officers and committees access.
          </p>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <label class="label"
              >Category<select v-model="category" class="field">
                <option value="officer">Officer</option>
                <option value="committee">Committee</option>
                <option value="player">Player</option>
              </select></label
            ><label class="label"
              >Position<input v-model="position" class="field" /></label
            ><label class="label"
              >Academic term<input v-model="term" class="field"
            /></label>
          </div>
          <button
            type="button"
            :disabled="busy"
            class="btn-outline mt-5"
            @click="save(true)"
          >
            Create member record
          </button>
        </section>
      </form></Modal
    >
  </section>
</template>
