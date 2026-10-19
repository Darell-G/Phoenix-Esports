import { createRouter, createWebHistory } from "vue-router";
import { initAuth, portalAccount, can } from "../composables/useAuth";
import type { Module } from "../lib/types";
export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, saved) {
    return saved || (to.path === from.path ? {} : { top: 0 });
  },
  routes: [
    {
      path: "/",
      component: () => import("../layouts/PublicLayout.vue"),
      children: [
        {
          path: "",
          component: () => import("../views/Home.vue"),
          meta: { title: "Home" },
        },
        ...(
          [
            "announcements",
            "events",
            "recruitment",
            "tournaments",
            "merch",
          ] as const
        ).map((section) => ({
          path: section,
          component: () => import("../views/Listing.vue"),
          props: { section },
          meta: { title: section },
        })),
        {
          path: ":section(announcements|events|recruitment|tournaments|merch)/:slug",
          component: () => import("../views/Detail.vue"),
          meta: { title: "Explore" },
        },
      ],
    },
    {
      path: "/portal/login",
      component: () => import("../views/portal/Login.vue"),
      meta: { title: "Portal" },
    },
    {
      path: "/portal/reset-password",
      component: () => import("../views/portal/ResetPassword.vue"),
      meta: { title: "Set your password" },
    },
    {
      path: "/portal",
      component: () => import("../layouts/PortalLayout.vue"),
      meta: { requiresPortalAccount: true },
      children: [
        {
          path: "",
          component: () => import("../views/portal/Dashboard.vue"),
          meta: { title: "Dashboard" },
        },
        {
          path: "content",
          component: () => import("../views/portal/ContentManager.vue"),
          meta: { title: "Content & merchandise", module: "content" },
        },
        {
          path: "openings",
          component: () => import("../views/portal/ContentManager.vue"),
          props: { kind: "opening" },
          meta: { title: "Recruitment openings", module: "recruitment" },
        },
        {
          path: "members",
          component: () => import("../views/portal/Members.vue"),
          meta: { title: "Members", module: "members" },
        },
        {
          path: "applications",
          component: () => import("../views/portal/Applications.vue"),
          meta: { title: "Applications", module: "recruitment" },
        },
        {
          path: "tournaments",
          component: () => import("../views/portal/Tournaments.vue"),
          meta: { title: "Tournaments", module: "tournaments" },
        },
        {
          path: "settings",
          component: () => import("../views/portal/Settings.vue"),
          meta: { title: "Settings", admin: true },
        },
        {
          path: "audit",
          component: () => import("../views/portal/Audit.vue"),
          meta: { title: "Activity log", admin: true },
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("../views/NotFound.vue"),
      meta: { title: "Page not found" },
    },
  ],
});
router.beforeEach(async (to) => {
  if (to.meta.requiresPortalAccount) {
    await initAuth();
    if (!portalAccount.value)
      return { path: "/portal/login", query: { next: to.fullPath } };
    if (
      (to.meta.admin && !portalAccount.value.is_admin) ||
      (to.meta.module && !can(to.meta.module as Module))
    )
      return "/portal";
  }
});
router.afterEach((to) => {
  const title = String(to.meta.title || "Phoenix Esports");
  document.title = `${title.charAt(0).toUpperCase() + title.slice(1)} | Phoenix Esports`;
});
