<script setup lang="ts">
import ActionIcon from "./ActionIcon.vue";

import { ref } from "vue";
import { invoke } from "../lib/client";
import { errorMessage, studentEmail } from "../lib/format";
import type { Content } from "../lib/types";
const props = defineProps<{ item: Content }>();
const email = ref(""),
  code = ref(""),
  challenge = ref(""),
  grant = ref(""),
  error = ref(""),
  busy = ref(false),
  reference = ref("");
const name = ref(""),
  studentNumber = ref(""),
  courseYear = ref(""),
  experience = ref(""),
  consent = ref(false);
async function sendCode() {
  if (!studentEmail(email.value)) {
    error.value = "Use your @student.fatima.edu.ph email address.";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    const data = await invoke<{ challenge: string }>("send_code", {
      email: email.value,
      purpose: "application",
      target_id: props.item.id,
    });
    challenge.value = data.challenge;
    grant.value = "";
    code.value = "";
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
async function verify() {
  busy.value = true;
  error.value = "";
  try {
    const data = await invoke<{ grant: string }>("verify_code", {
      challenge: challenge.value,
      email: email.value,
      code: code.value,
    });
    grant.value = data.grant;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
async function submit() {
  busy.value = true;
  error.value = "";
  try {
    const data = await invoke<{ reference: string }>("submit", {
      challenge: challenge.value,
      grant: grant.value,
      payload: {
        name: name.value,
        student_number: studentNumber.value,
        course_year: courseYear.value,
        experience: experience.value,
      },
    });
    reference.value = data.reference;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section class="panel mt-10">
    <h2 class="text-xl">Apply for this opening</h2>
    <p class="mt-3 text-sm leading-6 text-foreground/60">
      For OLFU Quezon City students only. Campus eligibility is reviewed by
      officers and committees. Your student details and contact information
      remain private.
    </p>
    <div
      v-if="reference"
      class="mt-6 border border-teal bg-teal/15 p-6"
      role="status"
    >
      <h3 class="text-lg">Submission received.</h3>
      <p class="mt-3 text-sm">
        Reference: <strong>{{ reference }}</strong>
      </p>
      <p class="mt-3 text-sm leading-6">
        Keep this reference for any questions about your application.
      </p>
    </div>
    <template v-else
      ><p
        v-if="error"
        role="alert"
        class="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {{ error }}
      </p>
      <form
        v-if="!grant"
        class="mt-6 space-y-5"
        @submit.prevent="challenge ? verify() : sendCode()"
      >
        <label class="label"
          >Student email<input
            v-model="email"
            :readonly="!!challenge"
            required
            type="email"
            autocomplete="email"
            placeholder="you@student.fatima.edu.ph"
            class="field" /></label
        ><template v-if="challenge"
          ><label class="label"
            >Verification code<input
              v-model="code"
              required
              inputmode="numeric"
              pattern="[0-9]{6}"
              maxlength="6"
              autocomplete="one-time-code"
              class="field"
          /></label>
          <p class="text-xs text-foreground/60">
            Check your inbox. Codes expire after 10 minutes.
          </p></template
        >
        <div class="flex flex-wrap gap-4">
          <button :disabled="busy" class="btn">
            {{
              busy
                ? "Please wait…"
                : challenge
                  ? "Verify email"
                  : "Send verification code"
            }}</button
          ><button
            v-if="challenge"
            type="button"
            class="btn-outline"
            :disabled="busy"
            @click="sendCode"
          >
            Resend code</button
          ><button
            v-if="challenge"
            type="button"
            class="text-sm underline"
            @click="
              challenge = '';
              code = '';
            "
          >
            Change email
          </button>
        </div>
      </form>
      <form v-else class="mt-6 space-y-5" @submit.prevent="submit">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-[#24635e]">Email verified: {{ email }}</p>
          <button
            type="button"
            class="text-xs underline"
            :disabled="busy"
            @click="
              grant = '';
              challenge = '';
              code = '';
            "
          >
            Verify again
          </button>
        </div>
        <p class="text-xs text-foreground/55">
          If verification expires while you fill out the form, verify again.
          Your entered details will be kept.
        </p>
        <label class="label"
          >Full name<input
            v-model="name"
            required
            maxlength="160"
            class="field"
        /></label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="label"
            >Student number<input
              v-model="studentNumber"
              required
              maxlength="40"
              class="field" /></label
          ><label class="label"
            >Course and year<input
              v-model="courseYear"
              required
              maxlength="120"
              class="field"
          /></label>
        </div>
        <label class="label"
          >Relevant experience / player details<textarea
            v-model="experience"
            maxlength="5000"
            rows="5"
            class="field"
          ></textarea>
        </label>
        ><label class="flex items-start gap-3 text-sm leading-6"
          ><input
            v-model="consent"
            required
            type="checkbox"
            class="mt-1.5"
          /><span
            >I confirm that all participants are OLFU Quezon City students and
            agree to officers and committees reviewing these details for this
            application.</span
          ></label
        ><button :disabled="busy || !consent" class="btn">
          {{ busy ? "Submitting…" : "Submit for review" }}
          <ActionIcon name="send" />
        </button></form
    ></template>
  </section>
</template>
