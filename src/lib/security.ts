export function portalDestination(value: unknown, origin: string): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return "/portal";
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      !(url.pathname === "/portal" || url.pathname.startsWith("/portal/"))
    )
      return "/portal";
    if (["/portal/login", "/portal/reset-password"].includes(url.pathname))
      return "/portal";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/portal";
  }
}
