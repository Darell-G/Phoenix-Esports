<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Upload, Eye, Trash2 } from "lucide-vue-next";
import Modal from "./Modal.vue";
import { requireClient } from "../lib/client";
import { currentUser } from "../composables/useAuth";
import type { Content, ContentKind } from "../lib/types";
import { errorMessage, toLocal, fromLocal } from "../lib/format";
const props = defineProps<{
  item?: Content;
  kinds: ContentKind[];
  deleteOnOpen?: boolean;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const initialForm = () => ({
  kind: props.item?.kind || props.kinds[0] || "announcement",
  title: props.item?.title || "",
  slug: props.item?.slug || "",
  summary: props.item?.summary || "",
  body: props.item?.body || "",
  category: props.item?.category || "",
  image_url: props.item?.image_url || "",
  status: props.item?.status || "draft",
  featured: props.item?.featured || false,
  starts_at: toLocal(props.item?.starts_at || null),
  ends_at: toLocal(props.item?.ends_at || null),
  deadline: toLocal(props.item?.deadline || null),
  venue: props.item?.venue || "",
  game: props.item?.game || "",
  champion_name: props.item?.champion_name || "",
  price: props.item?.price ?? null,
  variants: props.item?.variants.join(", ") || "",
  availability: props.item?.availability || "Available on inquiry",
  external_url: props.item?.external_url || "",
  roster_size: props.item?.roster_size || 5,
  substitutes: props.item?.substitutes || 0,
  capacity: props.item?.capacity || 16,
});
const form = reactive(initialForm());
watch(
  () => props.item,
  () => Object.assign(form, initialForm()),
);
const availableKinds = computed(() => [
  ...new Set([...props.kinds, ...(props.item ? [props.item.kind] : [])]),
]);
const typeLocked = computed(
  () => !!props.item && ["opening", "tournament"].includes(props.item.kind),
);
const confirmDelete = ref(props.deleteOnOpen || false);
const error = ref(""),
  busy = ref(false),
  preview = ref(false);
const statuses = computed(() =>
  form.kind === "opening"
    ? ["draft", "open", "closed", "archived"]
    : form.kind === "tournament"
      ? ["draft", "published", "ongoing", "completed", "cancelled", "archived"]
      : ["draft", "published", "archived"],
);
async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  busy.value = true;
  error.value = "";
  try {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5242880
    )
      throw new Error("Choose a JPG, PNG, or WebP image under 5 MB.");
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${currentUser.value?.id}/${crypto.randomUUID()}.${ext}`;
    const { error: e } = await requireClient()
      .storage.from("editorial")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (e) throw e;
    form.image_url = requireClient()
      .storage.from("editorial")
      .getPublicUrl(path).data.publicUrl;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
async function save() {
  busy.value = true;
  error.value = "";
  try {
    const data = {
      ...form,
      title: form.title.trim(),
      champion_name:
        form.kind === "tournament" ? form.champion_name.trim() : "",
      image_url: form.image_url || null,
      starts_at: fromLocal(form.starts_at),
      ends_at: form.kind === "tournament" ? fromLocal(form.ends_at) : null,
      deadline: form.kind === "tournament" ? null : fromLocal(form.deadline),
      price:
        form.price === null || String(form.price) === ""
          ? null
          : Number(form.price),
      variants: form.variants
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    const result = await requireClient().rpc("save_content", {
      p_id: (props.item?.id || null) as unknown as string,
      p_data: data,
      p_reason: "",
    });
    if (result.error) throw result.error;
    emit("saved");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
async function remove() {
  if (!props.item) return;
  busy.value = true;
  error.value = "";
  try {
    const { error: failure } = await requireClient().rpc("delete_content", {
      p_id: props.item.id,
    });
    if (failure) throw failure;
    emit("saved");
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <Modal
    :title="item ? 'Edit content' : 'Create content'"
    @close="emit('close')"
    ><p
      v-if="error"
      role="alert"
      class="mb-5 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
    >
      {{ error }}
    </p>
    <form class="space-y-5" @submit.prevent="save">
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="label"
          >Type<select
            v-model="form.kind"
            :disabled="typeLocked"
            class="field"
            @change="form.status = 'draft'"
          >
            <option v-for="kind in availableKinds" :key="kind" :value="kind">
              {{ kind }}
            </option>
          </select></label
        ><label class="label"
          >Status<select v-model="form.status" class="field">
            <option v-for="status in statuses" :key="status">
              {{ status }}
            </option>
          </select></label
        >
      </div>
      <label class="label"
        >Title<input
          v-model="form.title"
          required
          maxlength="180"
          class="field" /></label
      ><label class="label"
        >Category<input
          v-model="form.category"
          maxlength="80"
          class="field" /></label
      ><label v-if="form.kind !== 'tournament'" class="label"
        >Summary<textarea
          v-model="form.summary"
          maxlength="500"
          rows="2"
          class="field"
        ></textarea></label
      ><label class="label"
        >{{
          form.kind === "tournament"
            ? "Rules"
            : form.kind === "opening"
              ? "Requirements and details"
              : "Full details"
        }}<textarea
          v-model="form.body"
          maxlength="30000"
          rows="7"
          class="field"
        ></textarea>
      </label>
      <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label class="label flex-1"
          >Image URL<input
            v-model="form.image_url"
            type="url"
            placeholder="https://…"
            class="field" /></label
        ><label class="btn-outline text-xs"
          ><Upload :size="14" />Upload image<input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="sr-only"
            :disabled="busy"
            @change="upload"
        /></label>
      </div>
      <p class="text-xs text-foreground/50">
        JPG, PNG, or WebP · Maximum 5 MB. Editorial images are publicly
        accessible.
      </p>
      <label class="flex items-center gap-3 text-sm"
        ><input v-model="form.featured" type="checkbox" />Feature on the landing
        page</label
      >
      <div
        v-if="['event', 'tournament', 'opening'].includes(form.kind)"
        class="grid gap-5 sm:grid-cols-2"
      >
        <label class="label"
          >{{
            form.kind === "opening" ? "Activity / start date" : "Start date"
          }}
          · Philippine time<input
            v-model="form.starts_at"
            :required="form.kind === 'tournament' && !!form.ends_at"
            type="datetime-local"
            class="field" /></label
        ><label v-if="form.kind === 'tournament'" class="label"
          >End date / Philippine time<input
            v-model="form.ends_at"
            type="datetime-local"
            :min="form.starts_at || undefined"
            class="field" /></label
        ><label v-if="form.kind === 'opening'" class="label"
          >Submission deadline · Philippine time<input
            v-model="form.deadline"
            type="datetime-local"
            class="field" /></label
        ><label class="label sm:col-span-2"
          >Venue<input v-model="form.venue" maxlength="200" class="field"
        /></label>
      </div>
      <template v-if="form.kind === 'tournament'"
        ><label class="label"
          >Game<input
            v-model="form.game"
            required
            maxlength="100"
            class="field"
        /></label>
        <div>
          <label class="label"
            >Champion team (optional)<input
              v-model="form.champion_name"
              maxlength="180"
              class="field"
              placeholder="Enter the confirmed champion"
          /></label>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-foreground/55">
              Set manually. Save content to apply changes.
            </p>
            <button
              v-if="form.champion_name"
              type="button"
              class="inline-flex items-center gap-2 text-xs underline"
              @click="form.champion_name = ''"
            >
              <Trash2 :size="14" />Remove champion
            </button>
          </div>
        </div> </template
      ><template v-if="form.kind === 'product'"
        ><div class="grid gap-5 sm:grid-cols-2">
          <label class="label"
            >Price · PHP<input
              v-model="form.price"
              type="number"
              min="0"
              step="0.01"
              class="field" /></label
          ><label class="label"
            >Availability<input
              v-model="form.availability"
              required
              maxlength="100"
              class="field"
          /></label>
        </div>
        <label class="label"
          >Variants · comma separated<input
            v-model="form.variants"
            maxlength="500"
            class="field" /></label></template
      ><label class="label"
        >{{
          form.kind === "tournament"
            ? "Third-party bracket URL"
            : form.kind === "opening"
              ? "Application form URL"
              : "Official external link"
        }}<input
          v-model="form.external_url"
          type="url"
          :required="form.kind === 'opening' && form.status === 'open'"
          :pattern="
            form.kind === 'opening' ? '[Hh][Tt][Tt][Pp][Ss]://.*' : undefined
          "
          placeholder="https://…"
          class="field"
      /></label>
      <p
        v-if="form.kind === 'opening'"
        class="text-xs leading-5 text-foreground/55"
      >
        Use an HTTPS link to Google Forms or your official application form.
        Applications are handled on that external site.
      </p>
      <div class="flex flex-wrap gap-3 border-t border-line pt-5">
        <button
          v-if="item"
          type="button"
          class="mr-auto inline-flex items-center gap-2 text-sm"
          :disabled="busy"
          @click="confirmDelete = true"
        >
          <Trash2 :size="16" />Delete
        </button>
        <button class="btn" :disabled="busy">
          {{ busy ? "Saving…" : "Save content" }}</button
        ><button type="button" class="btn-outline" @click="preview = !preview">
          <Eye :size="16" />{{ preview ? "Hide preview" : "Preview" }}</button
        ><button type="button" class="px-4 text-sm" @click="emit('close')">
          Cancel
        </button>
      </div>
      <article v-if="preview" class="border border-line bg-paper p-6">
        <p class="eyebrow">Preview · {{ form.status }}</p>
        <img
          v-if="form.image_url"
          :src="form.image_url"
          alt="Content preview"
          class="mt-5 max-h-64 w-full object-contain"
        />
        <h3 class="mt-5 text-2xl">{{ form.title || "Untitled" }}</h3>
        <p
          v-if="form.kind === 'tournament' && form.champion_name.trim()"
          class="mt-3 text-sm font-medium"
        >
          Champion: {{ form.champion_name.trim() }}
        </p>
        <p
          v-if="form.kind !== 'tournament' && form.summary"
          class="mt-3 text-sm text-foreground/55"
        >
          {{ form.summary }}
        </p>
        <p class="mt-5 whitespace-pre-line text-sm leading-7">
          {{ form.body }}
        </p>
      </article>
    </form></Modal
  >
  <Modal
    v-if="confirmDelete && item"
    title="Delete content"
    @close="confirmDelete = false"
  >
    <p class="text-sm leading-7">
      Delete &quot;{{ item.title }}&quot;? This removes it from the website.
      Items with applications or tournament records cannot be deleted; archive
      them instead.
    </p>
    <p v-if="error" role="alert" class="mt-4 text-sm">{{ error }}</p>
    <div class="mt-6 flex flex-wrap gap-3">
      <button type="button" class="btn" :disabled="busy" @click="remove">
        {{ busy ? "Deleting..." : "Delete content" }}</button
      ><button
        type="button"
        class="btn-outline"
        :disabled="busy"
        @click="confirmDelete = false"
      >
        Cancel
      </button>
    </div>
  </Modal>
</template>
