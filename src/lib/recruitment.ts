import type { Content } from "./types";

export function openingApplicationUrl(
  item: Pick<Content, "kind" | "status" | "deadline" | "external_url"> | null,
  now = Date.now(),
): string {
  if (!item || item.kind !== "opening" || item.status !== "open") return "";
  if (item.deadline && !(Date.parse(item.deadline) > now)) return "";
  try {
    const url = new URL(item.external_url);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
