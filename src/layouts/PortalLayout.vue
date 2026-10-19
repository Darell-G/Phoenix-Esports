<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Trophy,
  Settings,
  LogOut,
  History,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  User,
} from "lucide-vue-next";
import { portalAccount, can, signOut } from "../composables/useAuth";
import { usePortalPreferences } from "../composables/usePortalPreferences";
import { errorMessage } from "../lib/format";
import logo from "../assets/images/logo.png";
const route = useRoute(),
  router = useRouter();
const { dark, collapsed, toggleTheme, toggleSidebar } = usePortalPreferences();
const media = window.matchMedia("(max-width: 1023px)");
const mobile = ref(media.matches),
  mobileExpanded = ref(false),
  error = ref("");
const compact = computed(() =>
  mobile.value ? !mobileExpanded.value : collapsed.value,
);
const accountName = computed(
  () =>
    portalAccount.value?.name.trim() ||
    (portalAccount.value?.is_admin
      ? "Administrator"
      : "Officer or committee member"),
);
const links = computed(() =>
  [
    { to: "/portal", label: "Dashboard", icon: LayoutDashboard, visible: true },
    {
      to: "/portal/members",
      label: "Members",
      icon: Users,
      visible: can("members"),
    },
    {
      to: "/portal/applications",
      label: "Applications",
      icon: ClipboardList,
      visible: can("recruitment"),
    },
    {
      to: "/portal/openings",
      label: "Openings",
      icon: Briefcase,
      visible: can("recruitment"),
    },
    {
      to: "/portal/content",
      label: "Content & Merch",
      icon: FileText,
      visible: can("content"),
    },
    {
      to: "/portal/tournaments",
      label: "Tournaments",
      icon: Trophy,
      visible: can("tournaments"),
    },
    {
      to: "/portal/settings",
      label: "Settings",
      icon: Settings,
      visible: !!portalAccount.value?.is_admin,
    },
    {
      to: "/portal/audit",
      label: "Activity log",
      icon: History,
      visible: !!portalAccount.value?.is_admin,
    },
  ].filter((link) => link.visible),
);
function resize() {
  mobile.value = media.matches;
  mobileExpanded.value = false;
}
function toggleNavigation() {
  if (mobile.value) mobileExpanded.value = !mobileExpanded.value;
  else toggleSidebar();
}
watch(
  () => route.fullPath,
  () => {
    mobileExpanded.value = false;
  },
);
onMounted(() => {
  media.addEventListener("change", resize);
});
onBeforeUnmount(() => {
  media.removeEventListener("change", resize);
});
async function logout() {
  try {
    await signOut();
    await router.push("/portal/login");
  } catch (e) {
    error.value = errorMessage(e);
  }
}
</script>
<template>
  <div
    class="portal-theme min-h-screen bg-canvas font-inter text-foreground"
    :class="{ dark }"
    @keydown.esc="mobileExpanded = false"
  >
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-[width] duration-200"
      :class="compact ? 'w-16' : 'w-64'"
      :data-collapsed="compact"
    >
      <div
        class="flex h-20 shrink-0 items-center border-b border-line"
        :class="compact ? 'justify-center' : 'px-3'"
      >
        <RouterLink
          v-if="!compact"
          to="/portal"
          aria-label="Phoenix organization portal"
          class="flex min-w-0 flex-1 items-center gap-2"
        >
          <img :src="logo" alt="" class="h-10 w-10 shrink-0 object-contain" />
          <span class="text-sm font-bold"
            >PHOENIX<span
              class="mt-1 block text-[8px] font-normal tracking-widest text-foreground/50"
              >ORGANIZATION PORTAL</span
            ></span
          >
        </RouterLink>
        <button
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
          :aria-label="compact ? 'Expand sidebar' : 'Collapse sidebar'"
          :title="compact ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-expanded="!compact"
          aria-controls="portal-navigation"
          @click="toggleNavigation"
        >
          <component
            :is="compact ? PanelLeftOpen : PanelLeftClose"
            :size="19"
            class="shrink-0"
          />
        </button>
      </div>
      <nav
        id="portal-navigation"
        aria-label="Portal navigation"
        class="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-4 text-sm"
      >
        <RouterLink
          v-for="link in links"
          :key="link.to"
          v-slot="{ href, navigate, isExactActive }"
          :to="link.to"
          custom
        >
          <a
            :href="href"
            :aria-label="link.label"
            :title="compact ? link.label : undefined"
            :aria-current="isExactActive ? 'page' : undefined"
            class="flex min-h-11 items-center gap-3 rounded-sm px-3 transition-colors"
            :class="[
              compact ? 'justify-center' : '',
              isExactActive
                ? 'bg-foreground text-surface'
                : 'text-foreground/60 hover:bg-foreground/10 hover:text-foreground',
              link.to === '/portal/settings' ? 'mt-5' : '',
            ]"
            @click="
              navigate($event);
              mobileExpanded = false;
            "
          >
            <component :is="link.icon" :size="19" class="shrink-0" /><span
              v-if="!compact"
              class="whitespace-nowrap"
              >{{ link.label }}</span
            >
          </a>
        </RouterLink>
      </nav>
      <div class="shrink-0 space-y-1 px-2 py-3">
        <div
          class="flex min-h-11 items-center gap-3 px-3 text-foreground/60"
          :class="{ 'justify-center': compact }"
          :title="accountName"
          role="group"
          :aria-label="`Signed in as ${accountName}`"
        >
          <User :size="19" class="shrink-0" /><span
            v-if="!compact"
            class="min-w-0 break-words text-[11px] leading-relaxed"
            >{{ accountName }}</span
          >
        </div>
        <div class="flex gap-1" :class="{ 'flex-col': compact }">
          <button
            class="flex min-h-11 flex-1 items-center gap-3 rounded-sm px-3 text-foreground/65 hover:bg-foreground/10 hover:text-foreground"
            :class="{ 'justify-center': compact }"
            aria-label="Sign out"
            :title="compact ? 'Sign out' : undefined"
            @click="logout"
          >
            <LogOut :size="19" class="shrink-0" /><span
              v-if="!compact"
              class="text-xs"
              >Sign out</span
            >
          </button>
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-foreground/65 hover:bg-foreground/10 hover:text-foreground"
            :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="dark ? 'Switch to light mode' : 'Switch to dark mode'"
            :aria-pressed="dark"
            @click="toggleTheme"
          >
            <component :is="dark ? Sun : Moon" :size="19" />
          </button>
        </div>
      </div>
    </aside>
    <button
      v-if="mobile && mobileExpanded"
      class="fixed inset-y-0 left-64 right-0 z-30 bg-ink/40"
      aria-label="Collapse navigation"
      @click="mobileExpanded = false"
    ></button>
    <div
      class="min-h-screen min-w-0 transition-[padding] duration-200"
      :class="!mobile && !compact ? 'pl-64' : 'pl-16'"
    >
      <main class="mx-auto w-full min-w-0 max-w-[1400px] p-3 sm:p-8">
        <p
          v-if="error"
          role="alert"
          class="mb-5 text-sm text-red-700 dark:text-red-300"
        >
          {{ error }}
        </p>
        <RouterView v-if="portalAccount" />
        <div v-else class="panel">
          <p>Your officers and committees access is no longer active.</p>
          <RouterLink to="/portal/login" class="mt-5 inline-block underline"
            >Return to sign in</RouterLink
          >
        </div>
      </main>
    </div>
  </div>
</template>
