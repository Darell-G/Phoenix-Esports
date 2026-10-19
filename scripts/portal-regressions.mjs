import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as vue from "vue";
const require = createRequire(import.meta.url);
function evaluate(source, mocks = {}) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", compiled)(
    (name) => (name in mocks ? mocks[name] : require(name)),
    module,
    module.exports,
  );
  return module.exports;
}
const calls = [];
const client = {
  rpc: async (name, args) => {
    calls.push({ name, args });
    return { error: null };
  },
};
const descriptor = parse(
  readFileSync("src/components/ContentEditor.vue", "utf8"),
).descriptor;
const compiled = compileScript(descriptor, { id: "content-test" });
const Editor = evaluate(compiled.content, {
  "./Modal.vue": {},
  "../lib/client": { requireClient: () => client },
  "../composables/useAuth": { currentUser: vue.ref(null) },
  "../lib/format": {
    toLocal: (v) => v || "",
    fromLocal: (v) => v || null,
    errorMessage: (error) => error.message,
  },
}).default;
const product = {
  id: "product-one",
  kind: "product",
  title: "Jersey",
  status: "published",
  variants: ["S", "M"],
  price: 500,
};
const props = vue.reactive({
  item: product,
  kinds: ["announcement", "event", "product"],
});
const scope = vue.effectScope();
const form = scope.run(() => Editor.setup(props, { expose() {}, emit() {} }));
assert.equal(form.form.kind, "product");
assert.equal(form.form.price, 500);
assert.equal(form.typeLocked.value, false);
assert(form.availableKinds.value.includes("product"));
form.form.title = "Updated jersey";
await form.save();
assert.equal(calls.at(-1).args.p_data.kind, "product");
assert.equal(calls.at(-1).args.p_data.title, "Updated jersey");
props.item = { ...product, id: "product-two", title: "Lanyard", price: 100 };
await vue.nextTick();
assert.equal(form.form.kind, "product");
assert.equal(form.form.title, "Lanyard");
assert.equal(form.form.price, 100);
form.form.kind = "announcement";
await form.save();
form.form.kind = "product";
await form.save();
assert.equal(calls.at(-1).args.p_data.kind, "product");
await form.remove();
assert.equal(calls.at(-1).name, "delete_content");
assert.equal(calls.at(-1).args.p_id, "product-two");
scope.stop();
console.log(
  "PASS product editor initialization, record switching, saving, type selection, and deletion target",
);
const { usePagination } = evaluate(
  readFileSync("src/composables/usePagination.ts", "utf8"),
);
const records = vue.ref(Array.from({ length: 25 }, (_, i) => i + 1));
const filter = vue.ref("");
const pagingScope = vue.effectScope();
const paging = pagingScope.run(() => usePagination(records, [filter]));
paging.page.value = 3;
assert.deepEqual(paging.entries.value, [21, 22, 23, 24, 25]);
filter.value = "changed";
await vue.nextTick();
assert.equal(paging.page.value, 1);
paging.page.value = 3;
records.value = [1, 2];
await vue.nextTick();
assert.equal(paging.page.value, 1);
assert.deepEqual(paging.entries.value, [1, 2]);
records.value = [];
await vue.nextTick();
assert.equal(paging.page.value, 1);
assert.equal(paging.total.value, 0);
pagingScope.stop();
console.log(
  "PASS pagination boundaries, filter reset, deletion clamp, and empty lists",
);
const all = Array.from({ length: 1007 }, (_, id) => ({ id }));
const ranges = [];
const query = {
  select() {
    return this;
  },
  order() {
    return this;
  },
  async range(start, end) {
    ranges.push([start, end]);
    return { data: all.slice(start, end + 1), error: null };
  },
};
const { useRecords } = evaluate(
  readFileSync("src/composables/useRecords.ts", "utf8"),
  {
    "../lib/client": { requireClient: () => ({ from: () => query }) },
    "../lib/format": { errorMessage: (e) => e.message },
  },
);
const list = useRecords("members");
await list.load();
assert.equal(list.rows.value.length, 1007);
assert.deepEqual(ranges, [
  [0, 499],
  [500, 999],
  [1000, 1499],
]);
console.log("PASS list loading beyond the default backend row cap");

const { sortScoreboard } = evaluate(
  readFileSync("src/lib/scoreboard.ts", "utf8"),
  { "./client": { requireClient: () => ({}) } },
);
const scoreboard = [
  { id: "a", team_name: "Alpha", wins: 2, losses: 1 },
  { id: "b", team_name: "Beta", wins: 3, losses: 2 },
  { id: "c", team_name: "Gamma", wins: 3, losses: 1 },
  { id: "d", team_name: "Delta", wins: 1, losses: 0 },
];
assert.deepEqual(
  sortScoreboard(scoreboard).map((team) => team.id),
  ["c", "b", "a", "d"],
);
assert.equal(scoreboard[0].id, "a");
const tournamentProps = vue.reactive({
  item: { ...product, kind: "tournament", status: "published" },
  kinds: ["tournament"],
});
const tournamentScope = vue.effectScope();
const tournamentEditor = tournamentScope.run(() =>
  Editor.setup(tournamentProps, { expose() {}, emit() {} }),
);
assert.deepEqual(tournamentEditor.statuses.value, [
  "draft",
  "published",
  "ongoing",
  "completed",
  "cancelled",
  "archived",
]);
await tournamentEditor.save();
assert.equal(calls.at(-1).args.p_data.deadline, null);
tournamentScope.stop();
const loginSource = readFileSync("src/views/portal/Login.vue", "utf8");
assert(
  !loginSource.includes("activate_invite") &&
    !loginSource.includes('mode = \"activate\"'),
);
assert(
  !readFileSync("src/views/portal/Settings.vue", "utf8").includes(
    "Organization details",
  ),
);
assert(!readFileSync("src/views/Home.vue", "utf8").includes("moment.label"));
console.log(
  "PASS manual scoreboard sorting, tournament publishing states, removed login invitation and pictured controls",
);

const { sortFixtures } = evaluate(readFileSync("src/lib/fixtures.ts", "utf8"), {
  "./client": { requireClient: () => ({}) },
});
const fixtures = [
  { id: "a", status: "completed", starts_at: "2026-10-20T08:00:00Z" },
  { id: "b", status: "scheduled", starts_at: "2026-10-21T08:00:00Z" },
  { id: "c", status: "live", starts_at: "2026-10-20T08:00:00Z" },
  { id: "d", status: "scheduled", starts_at: null },
  { id: "e", status: "scheduled", starts_at: "2026-10-20T10:00:00Z" },
];
assert.deepEqual(
  sortFixtures(fixtures).map((fixture) => fixture.id),
  ["c", "e", "b", "d", "a"],
);
const matchDescriptor = parse(
  readFileSync("src/components/TournamentMatchEditor.vue", "utf8"),
).descriptor;
const MatchEditor = evaluate(
  compileScript(matchDescriptor, { id: "fixture-test" }).content,
  {
    "./Modal.vue": {},
    "../lib/client": { requireClient: () => client },
    "../lib/format": {
      toLocal: (v) => v || "",
      fromLocal: (v) => v || null,
      errorMessage: (e) => e.message,
    },
  },
).default;
const matchScope = vue.effectScope();
const matchForm = matchScope.run(() =>
  MatchEditor.setup(
    { tournamentId: "tournament", teams: [], fixture: undefined },
    { expose() {}, emit() {} },
  ),
);
Object.assign(matchForm.form, {
  team_a_id: "a",
  team_b_id: "b",
  round_label: "  Semifinal  ",
});
const inserted = [];
client.from = () => ({
  insert(data) {
    inserted.push(data);
    return this;
  },
  select() {
    return this;
  },
  async single() {
    return { data: { id: "match" }, error: null };
  },
});
await matchForm.save();
assert.equal(inserted[0].team_a_id, "a");
assert.equal(inserted[0].team_b_id, "b");
assert.equal(inserted[0].starts_at, null);
assert.equal(inserted[0].round_label, "Semifinal");
matchScope.stop();
const editorScope = vue.effectScope();
const endForm = editorScope.run(() =>
  Editor.setup(
    {
      ...tournamentProps,
      item: { ...tournamentProps.item, ends_at: "2026-10-21T12:00:00Z" },
    },
    { expose() {}, emit() {} },
  ),
);
await endForm.save();
assert.equal(calls.at(-1).args.p_data.ends_at, "2026-10-21T12:00:00Z");
endForm.form.champion_name = "  Team Alpha  ";
await endForm.save();
assert.equal(calls.at(-1).args.p_data.champion_name, "Team Alpha");
endForm.form.champion_name = "Team Beta";
await endForm.save();
assert.equal(calls.at(-1).args.p_data.champion_name, "Team Beta");
endForm.form.champion_name = "";
await endForm.save();
assert.equal(calls.at(-1).args.p_data.champion_name, "");
console.log("PASS manual champion creation, correction, and removal payloads");
editorScope.stop();
assert(
  !readFileSync("src/components/TournamentScoreboard.vue", "utf8").includes(
    "Points",
  ),
);
assert(
  !readFileSync("src/views/portal/Tournaments.vue", "utf8").includes(
    "form.points",
  ),
);
console.log(
  "PASS fixture priority/order, manual match creation, tournament end-date submission, and points removal",
);

matchForm.form.winner_id = "a";
matchForm.selectWinner();
await matchForm.save();
assert.equal(inserted.at(-1).status, "completed");
assert.equal(inserted.at(-1).winner_id, "a");
matchForm.form.status = "cancelled";
await vue.nextTick();
await matchForm.save();
assert.equal(inserted.at(-1).winner_id, null);
assert(!readFileSync("src/router/index.ts", "utf8").includes('path: "status"'));
assert(
  !readFileSync("src/components/SubmissionForm.vue", "utf8").includes(
    "statusLink",
  ),
);
assert(
  !readFileSync("src/components/Footer.vue", "utf8").includes('to="/status"'),
);
console.log(
  "PASS winner selection completes matches, cancellation clears results, tracking route/links removed",
);

const { sortTournaments } = evaluate(
  readFileSync("src/lib/tournaments.ts", "utf8"),
);
const tournamentCards = [
  { id: "draft", status: "draft", starts_at: null, ends_at: null },
  { id: "later", status: "published", starts_at: "2026-11-01", ends_at: null },
  {
    id: "past",
    status: "published",
    starts_at: "2026-10-01",
    ends_at: "2026-10-02",
  },
  { id: "soon", status: "published", starts_at: "2026-10-20", ends_at: null },
  { id: "undated", status: "published", starts_at: null, ends_at: null },
  { id: "live", status: "ongoing", starts_at: "2026-10-18", ends_at: null },
  {
    id: "in-progress",
    status: "published",
    starts_at: "2026-10-19",
    ends_at: "2026-10-21",
  },
].map((item) => ({ ...item, created_at: "2026-10-01T00:00:00Z" }));
const originalOrder = tournamentCards.map((item) => item.id);
assert.deepEqual(
  sortTournaments(tournamentCards, Date.parse("2026-10-19T12:00:00Z")).map(
    (item) => item.id,
  ),
  ["live", "in-progress", "soon", "later", "undated", "draft", "past"],
);
assert.deepEqual(
  tournamentCards.map((item) => item.id),
  originalOrder,
);
console.log(
  "PASS live and upcoming tournament priority, nearest dates first, and immutable sorting",
);

const { openingApplicationUrl } = evaluate(
  readFileSync("src/lib/recruitment.ts", "utf8"),
);
const openOpening = {
  kind: "opening",
  status: "open",
  deadline: "2026-12-01T00:00:00Z",
  external_url: "https://forms.gle/qa-form",
};
const applicationTime = Date.parse("2026-10-19T00:00:00Z");
assert.equal(
  openingApplicationUrl(openOpening, applicationTime),
  "https://forms.gle/qa-form",
);
assert.equal(
  openingApplicationUrl({ ...openOpening, status: "closed" }, applicationTime),
  "",
);
assert.equal(
  openingApplicationUrl(openOpening, Date.parse(openOpening.deadline)),
  "",
);
assert.equal(
  openingApplicationUrl({ ...openOpening, deadline: null }, applicationTime),
  "https://forms.gle/qa-form",
);
for (const external_url of [
  "",
  "javascript:alert(1)",
  "http://example.com",
  "mailto:test@example.com",
  "invalid",
]) {
  assert.equal(
    openingApplicationUrl({ ...openOpening, external_url }, applicationTime),
    "",
  );
}
assert.equal(openingApplicationUrl(null, applicationTime), "");
console.log(
  "PASS external application URL, closed/expired opening boundaries, and invalid URL rejection",
);

const signedInProfile = vue.ref({
  user_id: "admin",
  email: "qa@student.fatima.edu.ph",
  name: "Original admin",
  active: true,
  is_admin: true,
  organization_role: "officer",
  modules: ["members"],
});
let accessResponse = {
  data: { ...signedInProfile.value, name: "Updated admin" },
  error: null,
};
let accessMode = "result";
const accessCalls = [];
const Settings = evaluate(
  compileScript(
    parse(readFileSync("src/views/portal/Settings.vue", "utf8")).descriptor,
    { id: "access-test" },
  ).content,
  {
    vue: { ...vue, onMounted() {} },
    "../../components/Modal.vue": {},
    "../../components/PortalPagination.vue": {},
    "../../composables/usePagination": { usePagination },
    "../../composables/useAuth": {
      currentUser: vue.ref({ id: "admin" }),
      portalAccount: signedInProfile,
    },
    "../../lib/format": evaluate(readFileSync("src/lib/format.ts", "utf8")),
    "../../lib/client": {
      invoke: () => {
        throw new Error("Access edits must not use Edge Functions");
      },
      requireClient: () => ({
        rpc(name, args) {
          accessCalls.push({ name, args });
          return {
            abortSignal(signal) {
              if (accessMode === "timeout")
                return new Promise((resolve) =>
                  signal.addEventListener(
                    "abort",
                    () =>
                      resolve({ data: null, error: { message: "aborted" } }),
                    { once: true },
                  ),
                );
              return Promise.resolve(accessResponse);
            },
          };
        },
      }),
    },
  },
).default;
const accessScope = vue.effectScope();
const accessForm = accessScope.run(() =>
  Settings.setup({}, { expose() {}, emit() {} }),
);
accessForm.portalAccounts.value = [{ ...signedInProfile.value }];
accessForm.editing.value = {
  ...signedInProfile.value,
  name: "  Updated admin  ",
};
await accessForm.savePortalAccount();
assert.equal(accessCalls.at(-1).name, "save_portal_access");
assert.equal(accessCalls.at(-1).args.p_data.name, "Updated admin");
assert.equal(signedInProfile.value.name, "Updated admin");
assert.equal(accessForm.portalAccounts.value[0].name, "Updated admin");
assert.equal(accessForm.editing.value, null);
assert.equal(accessForm.busy.value, false);
accessResponse = { data: null, error: { message: "Access denied" } };
accessForm.editing.value = { ...signedInProfile.value, name: "Unsaved name" };
await accessForm.savePortalAccount();
assert.equal(accessForm.error.value, "Access denied");
assert.equal(accessForm.editing.value.name, "Unsaved name");
assert.equal(signedInProfile.value.name, "Updated admin");
assert.equal(accessForm.busy.value, false);
const originalTimeout = globalThis.setTimeout;
let abortSave;
try {
  globalThis.setTimeout = (callback) => {
    abortSave = callback;
    return 0;
  };
  accessMode = "timeout";
  const pendingSave = accessForm.savePortalAccount();
  abortSave();
  await pendingSave;
  assert.match(accessForm.error.value, /Saving took too long/);
  assert.equal(accessForm.busy.value, false);
  assert.equal(accessForm.editing.value.name, "Unsaved name");
} finally {
  globalThis.setTimeout = originalTimeout;
}
accessScope.stop();
console.log(
  "PASS direct account save, immediate own-profile refresh, failed-save form preservation, and bounded pending state",
);
