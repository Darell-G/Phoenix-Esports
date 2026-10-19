<script setup lang="ts">
import { usePagination } from "../../composables/usePagination";
import PortalPagination from "../../components/PortalPagination.vue";
import { computed, onMounted, reactive, ref } from "vue";
import { requireClient, invoke } from "../../lib/client";
import { errorMessage, studentEmail } from "../../lib/format";
import type { PortalAccount, Module } from "../../lib/types";
import Modal from "../../components/Modal.vue";
import { currentUser, portalAccount } from "../../composables/useAuth";
const invite = reactive({
  email: "",
  name: "",
  is_admin: false,
  organization_role: "officer" as PortalAccount["organization_role"],
  modules: [] as Module[],
});
const portalAccounts = ref<PortalAccount[]>([]),
  invitations = ref<
    Array<{
      email: string;
      active: boolean;
      is_admin: boolean;
      organization_role: string;
    }>
  >([]),
  editing = ref<PortalAccount | null>(null),
  error = ref(""),
  message = ref(""),
  busy = ref(false);
const pendingInvitations = computed(() =>
  invitations.value.filter(
    (invite) =>
      !portalAccounts.value.some((person) => person.email === invite.email),
  ),
);
const {
  page: accountPage,
  entries: accountEntries,
  total: accountTotal,
  pageSize,
} = usePagination(portalAccounts);
const {
  page: invitationPage,
  entries: invitationEntries,
  total: invitationTotal,
} = usePagination(pendingInvitations);
const modules: Module[] = ["members", "recruitment", "content", "tournaments"];
async function load() {
  error.value = "";
  try {
    const [s, i] = await Promise.all([
      requireClient()
        .from("officers_and_committees")
        .select("*")
        .order("created_at"),
      requireClient()
        .from("officer_committee_invitations")
        .select("email,active,is_admin,organization_role")
        .order("created_at"),
    ]);
    if (s.error || i.error) throw s.error || i.error;
    portalAccounts.value = s.data as PortalAccount[];
    invitations.value = i.data || [];
  } catch (e) {
    error.value = errorMessage(e);
  }
}
onMounted(load);
async function invitePortalAccount() {
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    if (!studentEmail(invite.email))
      throw new Error("Use a @student.fatima.edu.ph email address.");
    const result = await invoke<{ delivery: boolean }>(
      "invite_portal_account",
      { ...invite },
    );
    message.value = result.delivery
      ? "Invitation email sent. The recipient can use the setup link in their inbox."
      : "Invitation saved, but the email could not be sent. Check Auth email delivery and retry from these administrator settings.";
    if (result.delivery) {
      invite.email = "";
      invite.name = "";
    }

    await load();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
async function savePortalAccount() {
  if (!editing.value || busy.value) return;
  const target = editing.value;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    const { data, error: failure } = await requireClient()
      .rpc("save_portal_access", {
        p_id: target.user_id,
        p_data: {
          name: target.name.trim(),
          organization_role: target.organization_role,
          is_admin: target.is_admin,
          active: target.active,
          modules: [...target.modules],
        },
      })
      .abortSignal(controller.signal);
    if (failure) throw failure;
    const updated = data as unknown as PortalAccount;
    if (!updated || updated.user_id !== target.user_id)
      throw new Error(
        "The update could not be confirmed. Refresh the account list before trying again.",
      );
    portalAccounts.value = portalAccounts.value.map((person) =>
      person.user_id === updated.user_id ? updated : person,
    );
    if (currentUser.value?.id === updated.user_id)
      portalAccount.value = updated;
    if (editing.value?.user_id === target.user_id) editing.value = null;
    message.value = "Portal access updated.";
  } catch (e) {
    error.value = controller.signal.aborted
      ? "Saving took too long. Refresh and check this account before trying again."
      : errorMessage(e);
  } finally {
    clearTimeout(timer);
    busy.value = false;
  }
}
</script>
<template>
  <section>
    <h1 class="text-2xl sm:text-3xl tracking-tight">Officers & committees</h1>
    <p class="mt-3 text-sm text-foreground/55">
      Manage portal accounts, invitations, and module permissions.
    </p>
    <p
      v-if="error"
      role="alert"
      class="mt-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
    >
      {{ error }}
    </p>
    <p
      v-if="message"
      role="status"
      class="mt-6 border border-teal bg-teal/15 p-4 text-sm"
    >
      {{ message }}
    </p>

    <section class="mt-7" :class="portalAccounts.length ? 'panel' : ''">
      <h2 class="text-xl">Portal accounts</h2>
      <div
        v-for="person in accountEntries"
        :key="person.user_id"
        class="mt-5 flex flex-wrap items-center justify-between gap-5 border-b border-line pb-5"
      >
        <div>
          <p class="text-sm">{{ person.name || person.email }}</p>
          <p class="mt-1 text-xs text-foreground/50">
            {{ person.email }} ({{
              person.organization_role === "committee"
                ? "Committee member"
                : "Officer"
            }}) ·
            {{
              person.active
                ? person.is_admin
                  ? "Administrator"
                  : person.modules.join(", ") || "No modules assigned"
                : "Inactive"
            }}
          </p>
        </div>
        <button
          class="text-xs underline"
          :disabled="busy"
          @click="
            editing = { ...person, modules: [...person.modules] };

            error = '';
          "
        >
          Manage access
        </button>
      </div>
      <p
        v-if="!portalAccounts.length"
        class="flex min-h-48 items-center justify-center px-5 py-12 text-center text-sm text-foreground/55"
      >
        No portal accounts provisioned yet.
      </p>
      <PortalPagination
        v-model:page="accountPage"
        :total="accountTotal"
        :page-size="pageSize"
        label="Accounts"
      />
      <h3 class="mt-8 text-sm">Pending invitations</h3>
      <p
        v-for="person in invitationEntries"
        :key="person.email"
        class="mt-3 text-xs text-foreground/55"
      >
        {{ person.email }} ({{
          person.organization_role === "committee"
            ? "Committee member"
            : "Officer"
        }}) ·
        {{ person.active ? "Active invitation" : "Disabled" }}
      </p>
      <PortalPagination
        v-model:page="invitationPage"
        :total="invitationTotal"
        :page-size="pageSize"
        label="Invitations"
      />
    </section>
    <form class="panel mt-7 space-y-5" @submit.prevent="invitePortalAccount">
      <h2 class="text-xl">Invite an officer or committee member</h2>
      <label class="label"
        >Name<input
          v-model="invite.name"
          required
          maxlength="160"
          class="field" /></label
      ><label class="label"
        >Organization role<select
          v-model="invite.organization_role"
          class="field"
        >
          <option value="officer">Officer</option>
          <option value="committee">Committee member</option>
        </select></label
      ><label class="label"
        >Student email<input
          v-model="invite.email"
          required
          type="email"
          class="field" /></label
      ><label class="flex gap-3 text-sm"
        ><input v-model="invite.is_admin" type="checkbox" />Administrator
        access</label
      >
      <fieldset>
        <legend class="mb-3 text-sm">Assigned modules</legend>
        <div class="flex flex-wrap gap-5">
          <label
            v-for="module in modules"
            :key="module"
            class="flex gap-2 text-sm capitalize"
            ><input
              v-model="invite.modules"
              :value="module"
              type="checkbox"
            />{{ module }}</label
          >
        </div>
      </fieldset>
      <button :disabled="busy" class="btn text-xs">Send Invitation</button>
    </form>
    <Modal v-if="editing" title="Manage portal access" @close="editing = null"
      ><p
        v-if="error"
        role="alert"
        class="mb-5 text-sm text-red-800 dark:text-red-300"
      >
        {{ error }}
      </p>
      <form class="space-y-5" @submit.prevent="savePortalAccount">
        <fieldset :disabled="busy" class="space-y-5">
          <p class="text-sm text-foreground/60">{{ editing.email }}</p>
          <label class="label"
            >Name<input
              v-model="editing.name"
              required
              maxlength="160"
              class="field" /></label
          ><label class="label"
            >Organization role<select
              v-model="editing.organization_role"
              class="field"
            >
              <option value="officer">Officer</option>
              <option value="committee">Committee member</option>
            </select></label
          ><label class="flex gap-3 text-sm"
            ><input
              v-model="editing.is_admin"
              type="checkbox"
            />Administrator</label
          ><label class="flex gap-3 text-sm"
            ><input v-model="editing.active" type="checkbox" />Active portal
            access</label
          >
          <fieldset>
            <legend class="mb-3 text-sm">Modules</legend>
            <div class="flex flex-wrap gap-5">
              <label
                v-for="module in modules"
                :key="module"
                class="flex gap-2 text-sm capitalize"
                ><input
                  v-model="editing.modules"
                  :value="module"
                  type="checkbox"
                />{{ module }}</label
              >
            </div>
          </fieldset>
          <button :disabled="busy" class="btn">
            {{ busy ? "Saving…" : "Save access" }}
          </button>
        </fieldset>
      </form></Modal
    >
  </section>
</template>
