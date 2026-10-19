// Isolated browser fixtures: no real accounts, requests, or writes to Supabase.
const params = new URLSearchParams(location.search);
const longName = "QA Phoenix tournament with a longer title for mobile layouts";
const contents = [
  "tournament",
  "event",
  "announcement",
  "product",
  "opening",
].flatMap((kind) =>
  Array.from({ length: 12 }, (_, index) => ({
    id: `${kind}-${index}`,
    kind,
    title: index ? `QA ${kind} ${index}` : longName,
    slug: `${kind}-${index}`,
    status:
      kind === "opening"
        ? "open"
        : index === 0 && kind === "tournament"
          ? "ongoing"
          : "published",
    summary: "Supporting details for testing readable mobile content.",
    body: "Rules and additional details.\n" + "LongUnbrokenContent".repeat(12),
    category: "Campus esports / community",
    image_url: "/src/assets/images/banner.jpg",
    featured: index === 0,
    starts_at: "2026-12-20T04:00:00Z",
    ends_at: "2026-12-22T04:00:00Z",
    deadline: "2026-12-19T04:00:00Z",
    venue: "Our Lady of Fatima University — Quezon City",
    game: "Mobile Legends",
    champion_name: kind === "tournament" ? "QA Phoenix Champion Team" : "",
    price: 500,
    variants: ["Small", "Medium", "Large"],
    availability: "Available on inquiry",
    external_url: "https://example.com",
    roster_size: 5,
    substitutes: 1,
    capacity: 16,
    created_at: "2026-10-19T04:00:00Z",
  })),
);
const account = {
  user_id: "qa-user",
  email: "responsive-fixture-only@student.fatima.edu.ph",
  name: "QA Officer With A Longer Name",
  organization_role: "officer",
  is_admin: true,
  modules: ["members", "recruitment", "content", "tournaments"],
  active: true,
};
const teams = ["a", "b", "c"].map((id, index) => ({
  id,
  tournament_id: "tournament-0",
  team_name: index
    ? `QA Team ${index}`
    : "AnUnbrokenTeamNameForTestingMobileWrapping",
  wins: 2,
  losses: 1,
  version: 1,
}));
const data = {
  content: contents,
  tournament_scoreboard: teams,
  tournament_fixtures: ["scheduled", "live", "completed"].map(
    (status, index) => ({
      id: `fixture-${index}`,
      tournament_id: "tournament-0",
      team_a_id: "a",
      team_b_id: "b",
      starts_at: "2026-12-20T04:00:00Z",
      round_label: "Round 1",
      status,
      winner_id: status === "completed" ? "a" : null,
      version: 1,
    }),
  ),
  officers_and_committees: [account],
  officer_committee_invitations: [],
  members: Array.from({ length: 14 }, (_, i) => ({
    id: `${i}`,
    name: "QA Member Name",
    category: "player",
    position: "Player",
    game: "Mobile Legends",
    team: "QA Team",
    academic_term: "2026–2027",
    active: true,
    public_visible: false,
  })),
  applications: Array.from({ length: 14 }, (_, i) => ({
    id: `${i}`,
    reference: `QA-${i}`,
    opening_id: "opening-0",
    email: account.email,
    name: "QA Applicant",
    student_number: "QA-ONLY",
    course_year: "QA Course",
    experience: "QA experience",
    status: "submitted",
    campus_verified: false,
    internal_notes: "",
    public_feedback: "",
    created_at: "2026-10-19T04:00:00Z",
  })),
  audit_log: Array.from({ length: 14 }, (_, i) => ({
    id: `${i}`,
    actor_id: "qa-user",
    action: "update",
    entity: "content",
    record_label: longName,
    reason: `Updated tournament: ${longName}`,
    created_at: "2026-10-19T04:00:00Z",
  })),
  site_settings: [
    {
      id: 1,
      about: "Phoenix community at Our Lady of Fatima University, Quezon City.",
      contact_email: account.email,
      social_url: "https://example.com",
      inquiry_url: "https://example.com",
    },
  ],
};
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, options) => {
  const url = new URL(
    typeof input === "string" ? input : input.url || String(input),
    location.href,
  );
  if (!url.hostname.endsWith("supabase.co")) return nativeFetch(input, options);
  if (
    url.pathname === "/rest/v1/rpc/save_portal_access" &&
    options?.method === "POST"
  ) {
    const { p_id, p_data } = JSON.parse(options.body);
    const target = data.officers_and_committees.find(
      (person) => person.user_id === p_id,
    );
    if (!target)
      return new Response(JSON.stringify({ message: "Account not found" }), {
        status: 400,
      });
    Object.assign(target, p_data);
    return new Response(JSON.stringify(target), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!url.pathname.startsWith("/rest/v1/"))
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  if ((options?.method || "GET") !== "GET" && options?.method !== "HEAD")
    throw new Error("QA harness blocks writes");
  let rows = params.has("empty")
    ? []
    : data[url.pathname.split("/").at(-1)] || [];
  for (const [key, value] of url.searchParams) {
    if (value.startsWith("eq."))
      rows = rows.filter((row) => String(row[key]) === value.slice(3));
    if (value.startsWith("in.("))
      rows = rows.filter((row) =>
        value.slice(4, -1).split(",").includes(String(row[key])),
      );
  }
  const headers = new Headers(options?.headers);
  const single = headers.get("accept")?.includes("object+json");
  return new Response(JSON.stringify(single ? rows[0] || null : rows), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Range": `0-${Math.max(0, rows.length - 1)}/${rows.length}`,
    },
  });
};
const { createApp, h } = await import("vue");
const { createRouter, createMemoryHistory, RouterView } =
  await import("vue-router");
await import("/src/assets/style.css");
const { currentUser, portalAccount } =
  await import("/src/composables/useAuth.ts");
currentUser.value = { id: "qa-user", email: account.email };
portalAccount.value = account;
localStorage.setItem(
  "phoenix.portal.theme",
  params.has("dark") ? "dark" : "light",
);
const component = async (file) =>
  (await import(/* @vite-ignore */ `/src/${file}.vue`)).default;
const publicLayout = await component("layouts/PublicLayout"),
  portalLayout = await component("layouts/PortalLayout");
const routes = [
  {
    path: "/",
    component: publicLayout,
    children: [
      { path: "", component: await component("views/Home") },
      ...["announcements", "events", "recruitment", "tournaments", "merch"].map(
        (section) => ({
          path: section,
          component: () => component("views/Listing"),
          props: { section },
        }),
      ),
      { path: ":section/:slug", component: await component("views/Detail") },
    ],
  },
  {
    path: "/portal",
    component: portalLayout,
    children: [
      { path: "", component: await component("views/portal/Dashboard") },
      ...["Members", "Applications", "Tournaments", "Settings", "Audit"].map(
        (name) => ({
          path: name.toLowerCase(),
          component: () => component(`views/portal/${name}`),
        }),
      ),
      {
        path: "content",
        component: await component("views/portal/ContentManager"),
      },
      {
        path: "openings",
        component: await component("views/portal/ContentManager"),
        props: { kind: "opening" },
      },
    ],
  },
  { path: "/login", component: await component("views/portal/Login") },
];
const router = createRouter({ history: createMemoryHistory(), routes });
await router.push(params.get("route") || "/");
await router.isReady();
createApp({ render: () => h(RouterView) })
  .use(router)
  .mount("#app");
window.qaReady = true;
