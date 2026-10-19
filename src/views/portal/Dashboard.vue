<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  ChevronRight,
  ClipboardList,
  Users,
  CalendarDays,
  Trophy,
} from "lucide-vue-next";
import { requireClient } from "../../lib/client";
import { portalAccount, can } from "../../composables/useAuth";
import { errorMessage } from "../../lib/format";
import LoadState from "../../components/LoadState.vue";
const loading = ref(true),
  error = ref(""),
  counts = ref<Record<string, number>>({});
const cards = [
  {
    key: "applications",
    title: "Pending applications",
    icon: ClipboardList,
    path: "/portal/applications",
    module: "recruitment" as const,
  },
  {
    key: "members",
    title: "Officers & members",
    icon: Users,
    path: "/portal/members",
    module: "members" as const,
  },
  {
    key: "events",
    title: "Upcoming events",
    icon: CalendarDays,
    path: "/portal/content",
    module: "content" as const,
  },
  {
    key: "tournaments",
    title: "Active tournaments",
    icon: Trophy,
    path: "/portal/tournaments",
    module: "tournaments" as const,
  },
];
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const db = requireClient();
    const tasks = [
      can("recruitment")
        ? db
            .from("applications")
            .select("id", { count: "exact", head: true })
            .in("status", ["submitted", "under_review", "shortlisted"])
        : null,
      can("members")
        ? db
            .from("members")
            .select("id", { count: "exact", head: true })
            .eq("active", true)
        : null,
      db
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("kind", "event")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString()),
      can("tournaments")
        ? db
            .from("content")
            .select("id", { count: "exact", head: true })
            .eq("kind", "tournament")
            .in("status", ["published", "ongoing"])
        : null,
    ];
    const results = await Promise.all(tasks);
    results.forEach((r, i) => {
      if (r?.error) throw r.error;
      counts.value[cards[i]!.key] = r?.count ?? 0;
    });
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>
<template>
  <div>
    <p class="eyebrow">Overview</p>
    <h1 class="mt-3 text-2xl sm:text-3xl tracking-tight">
      Welcome, {{ portalAccount?.name || "Phoenix officers and committees" }}
    </h1>
    <LoadState
      v-if="loading || error"
      class="mt-8"
      :loading="loading"
      :error="error"
      @retry="load"
    />
    <div v-else class="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <RouterLink
        v-for="card in cards.filter((c) => can(c.module))"
        :key="card.key"
        :to="card.path"
        class="panel"
        ><div class="flex justify-between text-foreground/50">
          <component :is="card.icon" :size="20" /><ChevronRight :size="16" />
        </div>
        <p class="mt-7 text-4xl">{{ counts[card.key] }}</p>
        <p class="mt-2 text-xs text-foreground/55">
          {{ card.title }}
        </p></RouterLink
      >
    </div>
  </div>
</template>
