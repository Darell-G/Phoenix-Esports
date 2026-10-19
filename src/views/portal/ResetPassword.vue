<script setup lang="ts">
import { usePortalPreferences } from "../../composables/usePortalPreferences";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { requireClient } from "../../lib/client";
import { errorMessage } from "../../lib/format";
const { dark } = usePortalPreferences();
const password = ref(""),
  confirm = ref(""),
  busy = ref(false),
  ready = ref(false),
  error = ref(""),
  router = useRouter();
onMounted(async () => {
  const client = requireClient();
  const url = new URL(window.location.href),
    code = url.searchParams.get("code");
  if (code) {
    const { error: e } = await client.auth.exchangeCodeForSession(code);
    if (e) error.value = e.message;
    window.history.replaceState({}, "", "/portal/reset-password");
  }
  const { data } = await client.auth.getSession();
  ready.value = !!data.session;
  if (!ready.value)
    error.value ||=
      "This link is invalid or has expired. Request a new link from the sign-in page.";
});
async function save() {
  busy.value = true;
  error.value = "";
  try {
    if (password.value !== confirm.value)
      throw new Error("Passwords do not match.");
    const { error: e } = await requireClient().auth.updateUser({
      password: password.value,
    });
    if (e) throw e;
    await requireClient().auth.signOut();
    await router.push("/portal/login");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main
    :class="{ dark }"
    class="portal-theme text-foreground flex min-h-screen items-center justify-center bg-paper p-5"
  >
    <section class="panel w-full max-w-md">
      <p class="eyebrow">Phoenix officers and committees portal</p>
      <h1 class="mt-4 text-2xl sm:text-3xl">Set your password.</h1>
      <p
        v-if="error"
        role="alert"
        class="mt-5 text-sm text-red-800 dark:text-red-300"
      >
        {{ error }}
      </p>
      <form v-if="ready" class="mt-7 space-y-5" @submit.prevent="save">
        <label class="label"
          >New password<input
            v-model="password"
            required
            minlength="12"
            type="password"
            autocomplete="new-password"
            class="field" /></label
        ><label class="label"
          >Confirm password<input
            v-model="confirm"
            required
            minlength="12"
            type="password"
            autocomplete="new-password"
            class="field"
        /></label>
        <p class="text-xs text-foreground/60">Use at least 12 characters.</p>
        <button :disabled="busy" class="btn w-full">
          {{ busy ? "Saving…" : "Save password" }}
        </button>
      </form>
      <RouterLink to="/portal/login" class="mt-6 inline-block text-xs underline"
        >Back to sign in</RouterLink
      >
    </section>
  </main>
</template>
