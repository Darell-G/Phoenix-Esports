import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const compile = (path) =>
  ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
const module = { exports: {} };
new Function("module", "exports", compile("src/lib/security.ts"))(
  module,
  module.exports,
);
const { portalDestination } = module.exports;
const origin = "https://phoenix-esports.vercel.app";
for (const value of [
  null,
  [],
  "//evil.test",
  "https://evil.test",
  "/portal-other",
  "/portal/../../outside",
  "/portal/login",
  "/portal/reset-password",
  "/portal\\evil",
])
  assert.equal(portalDestination(value, origin), "/portal", String(value));
assert.equal(
  portalDestination("/portal/content?page=2#latest", origin),
  "/portal/content?page=2#latest",
);
let handler;
new Function("Deno", compile("supabase/functions/phoenix-api/index.ts"))({
  serve: (fn) => {
    handler = fn;
  },
  env: { get: () => undefined },
});
const call = (body, extra = {}) =>
  handler(
    new Request(origin + "/api", {
      method: "POST",
      body: JSON.stringify(body),
      ...extra,
    }),
  );
for (const action of [
  "send_code",
  "verify_code",
  "submit",
  "status",
  "renew_status",
  "portal_access",
])
  assert.equal((await call({ action })).status, 410);
for (const action of [
  "invite_portal_account",
  "review_application",
  "convert_member",
])
  assert.equal((await call({ action })).status, 401);
for (const action of ["__proto__", "toString", "generate_bracket"])
  assert.equal((await call({ action })).status, 400);
assert.equal((await call({ action: "capabilities" })).status, 200);
assert.equal(
  (
    await call(
      { action: "capabilities" },
      { headers: { Origin: "https://evil.test" } },
    )
  ).status,
  403,
);
const preflight = await handler(
  new Request(origin + "/api", {
    method: "OPTIONS",
    headers: { Origin: origin },
  }),
);
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal(
  (
    await handler(
      new Request(origin + "/api", {
        method: "OPTIONS",
        headers: { Origin: "https://evil.test" },
      }),
    )
  ).status,
  403,
);
assert.equal((await call({ huge: "x".repeat(50001) })).status, 413);
assert.equal(
  (await handler(new Request(origin + "/api", { method: "POST", body: "{" })))
    .status,
  400,
);
assert.equal(
  (
    await call(
      { action: "invite_portal_account" },
      { headers: { Authorization: "Bearer fake" } },
    )
  ).status,
  503,
);
console.log(
  "PASS safe portal redirects, retired endpoints, authorization gates, CORS, malformed and oversized requests, fail-closed configuration",
);

const originalFetch = globalThis.fetch;
const requests = [];
let allowed = false;
let identityMatches = true;
new Function("Deno", compile("supabase/functions/phoenix-api/index.ts"))({
  serve: (fn) => {
    handler = fn;
  },
  env: {
    get: (name) =>
      name === "SUPABASE_URL"
        ? "https://mock.invalid"
        : name === "SUPABASE_SERVICE_ROLE_KEY"
          ? "test-secret"
          : undefined,
  },
});
globalThis.fetch = async (url, options) => {
  requests.push({ url, options });
  if (url.endsWith("/auth/v1/user"))
    return Response.json({
      id: "00000000-0000-4000-8000-000000000001",
      email: "admin@student.fatima.edu.ph",
    });
  if (url.includes("/rest/v1/officers_and_committees?"))
    return Response.json([
      {
        user_id: "00000000-0000-4000-8000-000000000001",
        email: identityMatches
          ? "admin@student.fatima.edu.ph"
          : "other@student.fatima.edu.ph",
        is_admin: allowed,
        modules: [],
      },
    ]);
  return Response.json({});
};
const invitation = {
  action: "invite_portal_account",
  email: "invited@student.fatima.edu.ph",
  name: "Test Officer",
  organization_role: "officer",
  modules: ["content"],
  is_admin: false,
};
const signed = { headers: { Authorization: "Bearer mock-user-token" } };
try {
  assert.equal((await call(invitation, signed)).status, 403);
  assert.equal(requests.length, 2);
  allowed = true;
  identityMatches = false;
  assert.equal((await call(invitation, signed)).status, 403);
  identityMatches = true;
  assert.equal(
    (await call({ ...invitation, email: "outside@example.com" }, signed))
      .status,
    400,
  );
  const response = await call(invitation, signed);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).delivery, true);
  const saved = requests.find((r) =>
    r.url.endsWith("/rest/v1/rpc/save_portal_invitation"),
  );
  assert.equal(
    JSON.parse(saved.options.body).p_actor,
    "00000000-0000-4000-8000-000000000001",
  );
  assert(
    requests.some((r) =>
      r.url.includes(encodeURIComponent(origin + "/portal/reset-password")),
    ),
  );
  assert(
    !requests.some(
      (r) => r.options.headers.Authorization === "Bearer test-secret",
    ),
  );
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  "PASS invitation permission and identity denial, server-derived actor, production redirect, and secret-key header handling with mocked delivery",
);
