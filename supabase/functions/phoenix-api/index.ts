const appUrl = "https://phoenix-esports.vercel.app";
const origins = new Set([
  appUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
class RequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const field = (value: unknown, max: number, required = false) => {
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    throw new RequestError("Check required fields and their lengths.");
  return value.trim();
};
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (origin && !origins.has(origin))
    return reply({ error: "Website origin is not allowed." }, 403);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST")
    return reply({ error: "Method not allowed." }, 405);
  try {
    const reader = req.body?.getReader();
    if (!reader) throw new RequestError("A request body is required.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 50000) {
        await reader.cancel();
        throw new RequestError("Request is too large.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let body;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new RequestError("Invalid request.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new RequestError("Invalid request.");
    const action = body.action;
    if (action === "capabilities") return reply({ email_verification: false });
    if (
      [
        "send_code",
        "verify_code",
        "submit",
        "status",
        "renew_status",
        "portal_access",
      ].includes(action)
    )
      return reply({ error: "This workflow is no longer available." }, 410);
    const permissions: Record<string, string> = {
      invite_portal_account: "admin",
      review_application: "recruitment",
      convert_member: "recruitment",
    };
    if (typeof action !== "string" || !Object.hasOwn(permissions, action))
      throw new RequestError("Unknown action.");
    const token = req.headers
      .get("Authorization")
      ?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new RequestError("Sign in to continue.", 401);
    const url = Deno.env.get("SUPABASE_URL");
    let secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secret) {
      try {
        secret = JSON.parse(
          Deno.env.get("SUPABASE_SECRET_KEYS") || "{}",
        ).default;
      } catch {
        /* Fail closed. */
      }
    }
    if (!url || !secret)
      throw new RequestError("Service is temporarily unavailable.", 503);
    const serviceHeaders: Record<string, string> = {
      apikey: secret,
      "Content-Type": "application/json",
    };
    if (secret.startsWith("eyJ"))
      serviceHeaders.Authorization = `Bearer ${secret}`;
    const request = async (path: string, options: RequestInit = {}) => {
      const response = await fetch(url + path, {
        ...options,
        headers: { ...serviceHeaders, ...options.headers },
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      return { response, data };
    };
    const auth = await request("/auth/v1/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!auth.response.ok || !auth.data.id)
      throw new RequestError("Your session has expired. Sign in again.", 401);
    const query = new URLSearchParams({
      select: "user_id,email,is_admin,modules",
      user_id: `eq.${auth.data.id}`,
      active: "eq.true",
    });
    const accountResult = await request(
      "/rest/v1/officers_and_committees?" + query,
    );
    const account = accountResult.response.ok && accountResult.data[0];
    if (
      !account ||
      account.email !== auth.data.email?.toLowerCase() ||
      (!account.is_admin && !account.modules?.includes(permissions[action]))
    )
      throw new RequestError(
        "You do not have permission for this action.",
        403,
      );
    const rpc = async (name: string, args: Record<string, unknown>) => {
      const result = await request("/rest/v1/rpc/" + name, {
        method: "POST",
        body: JSON.stringify(args),
      });
      if (!result.response.ok)
        throw new RequestError(
          "The change could not be saved. Check the record and permissions.",
        );
      return result.data;
    };
    if (action === "invite_portal_account") {
      const email = field(body.email, 254, true).toLowerCase();
      if (!/^[^\s@]+@student\.fatima\.edu\.ph$/.test(email))
        throw new RequestError(
          "Use your @student.fatima.edu.ph email address.",
        );
      const modules = body.modules;
      if (
        !Array.isArray(modules) ||
        modules.some(
          (m: unknown) =>
            !["members", "recruitment", "content", "tournaments"].includes(
              String(m),
            ),
        )
      )
        throw new RequestError("Invalid permissions.");
      if (!["officer", "committee"].includes(body.organization_role))
        throw new RequestError("Invalid organization role.");
      await rpc("save_portal_invitation", {
        p_email: email,
        p_organization_role: body.organization_role,
        p_name: field(body.name, 160, true),
        p_admin: body.is_admin === true,
        p_modules: modules,
        p_actor: account.user_id,
        p_reason: "Invited officer or committee member",
      });
      const invited = await request(
        "/auth/v1/invite?redirect_to=" +
          encodeURIComponent(appUrl + "/portal/reset-password"),
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );
      return reply({ ok: true, delivery: invited.response.ok });
    }
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.id || "",
      )
    )
      throw new RequestError("Invalid record.");
    const data =
      body.data && typeof body.data === "object" && !Array.isArray(body.data)
        ? { ...body.data }
        : {};
    for (const name of ["internal_notes", "public_feedback"])
      if (data[name] !== undefined) data[name] = field(data[name], 5000);
    await rpc("portal_action", {
      p_action: action,
      p_id: body.id,
      p_actor: account.user_id,
      p_data: data,
      p_reason:
        action === "review_application"
          ? "Reviewed application"
          : "Created member from accepted application",
    });
    return reply({ ok: true });
  } catch (error) {
    if (error instanceof RequestError)
      return reply({ error: error.message }, error.status);
    return reply(
      { error: "Service is temporarily unavailable. Please try again." },
      503,
    );
  }
});
