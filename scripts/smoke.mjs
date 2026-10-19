import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const env = Object.fromEntries(
  (await readFile(new URL("../.env", import.meta.url), "utf8"))
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^['"]|['"]$/g, ""),
      ];
    }),
);
const base = (
  env.VITE_SUPABASE_URL.startsWith("http")
    ? env.VITE_SUPABASE_URL
    : `https://${env.VITE_SUPABASE_URL}`
).replace(/\/$/, "");
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};
const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.json();
  return { status: response.status, body };
};
for (const table of [
  "content",
  "site_settings",
  "tournament_scoreboard",
  "tournament_fixtures",
  "matches",
  "members",
]) {
  const result = await request(`/rest/v1/${table}?select=*&limit=1`);
  assert.equal(result.status, 200, `${table} public read`);
  assert.ok(Array.isArray(result.body));
  console.log(`PASS public read: ${table}`);
}
for (const table of [
  "applications",
  "teams",
  "officers_and_committees",
  "officer_committee_invitations",
  "audit_log",
]) {
  const result = await request(`/rest/v1/${table}?select=*&limit=1`);
  assert.ok([401, 403].includes(result.status), `${table} must be private`);
  console.log(`PASS denied anonymous read: ${table}`);
}
const call = (body) =>
  request("/functions/v1/phoenix-api", {
    method: "POST",
    body: JSON.stringify(body),
  });
let result = await call({ action: "status", token: "invalid" });
assert.equal(result.status, 410);
console.log("PASS retired private status workflow");
result = await call({
  action: "invite_portal_account",
  id: crypto.randomUUID(),
  reason: "unauthorized test",
});
assert.ok([401, 403].includes(result.status));
assert.match(result.body.error, /session|sign in|permission/i);
console.log("PASS anonymous officers_and_committees workflow denied");
result = await call({
  action: "send_code",
  email: "outside@example.com",
  purpose: "renew",
});
assert.equal(result.status, 410);
console.log("PASS retired email verification workflow");
result = await call({ action: "capabilities" });
assert.equal(result.status, 200);
assert.equal(typeof result.body.email_verification, "boolean");
console.log(
  `PASS email capability check (configured: ${result.body.email_verification})`,
);
for (const action of [
  "activate_invite",
  "generate_bracket",
  "record_result",
  "review_team",
]) {
  const disabled = await call({ action, id: crypto.randomUUID() });
  assert.equal(disabled.status, 400);
  assert.match(disabled.body.error, /unknown action/i);
  console.log(`PASS removed action: ${action}`);
}
const teamCode = await call({
  action: "send_code",
  purpose: "team",
  email: "test@student.fatima.edu.ph",
  target_id: crypto.randomUUID(),
});
assert.equal(teamCode.status, 410);
console.log("PASS disabled tournament email registration");
if (!process.argv.includes("--api-only")) {
  for (const route of [
    "/",
    "/announcements",
    "/events",
    "/recruitment",
    "/tournaments",
    "/merch",
    "/portal",
    "/portal/login",
    "/portal/reset-password",
  ]) {
    const response = await fetch(`http://127.0.0.1:5173${route}`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), /<div id="app"><\/div>/);
    console.log(`PASS SPA entry: ${route}`);
  }
}
