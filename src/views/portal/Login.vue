<script setup lang="ts">
import { usePortalPreferences } from "../../composables/usePortalPreferences";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { requireClient } from "../../lib/client";
import {
  currentUser,
  initAuth,
  refreshPortalAccount,
  portalAccount,
} from "../../composables/useAuth";
import { studentEmail, errorMessage } from "../../lib/format";
import logo from "../../assets/images/logo.png";
import { portalDestination } from "../../lib/security";
const { dark } = usePortalPreferences();
const email = ref(""),
  password = ref(""),
  busy = ref(false),
  error = ref(""),
  message = ref(""),
  mode = ref("login");
const route = useRoute(),
  router = useRouter();
async function submit() {
  if (busy.value) return;
  error.value = "";
  message.value = "";
  busy.value = true;
  try {
    if (!studentEmail(email.value))
      throw new Error("Use your @student.fatima.edu.ph email address.");
    const normalized = email.value.trim().toLowerCase();
    if (mode.value === "recover") {
      const { error: e } = await requireClient().auth.resetPasswordForEmail(
        normalized,
        { redirectTo: `${window.location.origin}/portal/reset-password` },
      );
      if (e) throw e;
      message.value =
        "If your account exists, a password reset link will arrive in your inbox.";
    } else {
      await initAuth();
      const { data, error: e } = await requireClient().auth.signInWithPassword({
        email: normalized,
        password: password.value,
      });
      if (e) throw e;
      currentUser.value = data.user;
      await refreshPortalAccount();
      if (!portalAccount.value) {
        await requireClient().auth.signOut();
        throw new Error(
          "Your account does not have active officers and committees access. Contact an administrator.",
        );
      }
      await router.push(
        portalDestination(route.query.next, window.location.origin),
      );
    }
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
    class="portal-theme grid min-h-dvh bg-paper text-foreground lg:grid-cols-[1.1fr_1fr]"
  >
    <section
      class="flex items-center justify-center bg-ink px-8 py-8 lg:min-h-dvh lg:p-16"
      aria-label="Phoenix Esports"
    >
      <img
        :src="logo"
        alt="Phoenix Esports logo"
        class="h-24 w-auto max-w-full object-contain sm:h-32 lg:h-auto lg:w-full lg:max-w-lg"
      />
    </section>
    <section
      class="flex min-w-0 items-center justify-center px-5 py-8 sm:px-10 sm:py-10 lg:py-12"
    >
      <div class="w-full max-w-md">
        <RouterLink
          to="/"
          class="mb-6 inline-flex min-h-11 items-center gap-2 text-xs sm:mb-8"
        >
          <ArrowLeft :size="16" />Return to home
        </RouterLink>
        <h2 class="mt-3 text-2xl sm:text-3xl tracking-tight">
          {{ mode === "login" ? "Welcome back." : "Reset your password." }}
        </h2>
        <p class="mt-4 text-sm leading-6 text-foreground/55">
          {{
            mode === "login"
              ? "Sign in with your student email to manage the organization."
              : "We’ll send a secure link to your student email."
          }}
        </p>
        <p
          v-if="error"
          role="alert"
          class="mt-5 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
        >
          {{ error }}
        </p>
        <p
          v-if="message"
          role="status"
          class="mt-5 border border-teal bg-teal/15 p-4 text-sm"
        >
          {{ message }}
        </p>
        <form class="mt-8 space-y-5" @submit.prevent="submit">
          <label class="label"
            >Student email<input
              v-model="email"
              required
              type="email"
              autocomplete="username"
              placeholder="you@student.fatima.edu.ph"
              class="field" /></label
          ><label v-if="mode === 'login'" class="label"
            >Password<input
              v-model="password"
              required
              type="password"
              autocomplete="current-password"
              class="field" /></label
          ><button class="btn w-full" :disabled="busy">
            {{
              busy
                ? "Signing in…"
                : mode === "login"
                  ? "Sign in"
                  : "Send secure link"
            }}
          </button>
        </form>
        <div class="mt-6 flex flex-wrap justify-between gap-4 text-xs">
          <button
            v-if="mode !== 'login'"
            @click="
              mode = 'login';
              error = '';
              message = '';
            "
          >
            Back to sign in</button
          ><template v-else
            ><button
              @click="
                mode = 'recover';
                error = '';
                message = '';
              "
            >
              Forgot password?
            </button></template
          >
        </div>
      </div>
    </section>
  </main>
</template>
