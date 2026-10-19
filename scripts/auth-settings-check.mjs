import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const config = readFileSync("supabase/config.toml", "utf8");
assert.match(config, /\[auth\][\s\S]*?enable_signup\s*=\s*false/);
assert.match(config, /\[auth\.email\][\s\S]*?enable_signup\s*=\s*true/);
const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/)
  .filter((line) => line.includes("=") && !line.startsWith("#"))
  .map((line) => { const at = line.indexOf("="); return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^['"]|['"]$/g, "")]; }));
const raw = env.VITE_SUPABASE_URL;
const base = (raw.startsWith("http") ? raw : "https://" + raw).replace(/\/$/, "");
const headers = { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY, "Content-Type": "application/json" };
const request = async (path, body) => {
  const response = await fetch(base + "/auth/v1/" + path, {
    method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, data: await response.json() };
};
const settings = await request("settings");
assert.equal(settings.status, 200);
assert.equal(settings.data.external.email, true, "Email provider must allow existing-account login");
assert.equal(settings.data.disable_signup, true, "Public registration must stay disabled");
console.log("PASS live email provider enabled and public registration disabled");
// Deliberately nonexistent account: does not attempt a real user's password.
const fake = { email: "qa-" + crypto.randomUUID() + "@student.fatima.edu.ph", password: crypto.randomUUID() };
const login = await request("token?grant_type=password", fake);
assert.equal(login.data.error_code, "invalid_credentials");
console.log("PASS email/password endpoint accepts login requests (invalid test credentials rejected)");
const signup = await request("signup", fake);
assert.equal(signup.data.error_code, "signup_disabled");
console.log("PASS public sign-up rejected; no test user or email created");
