import type { Content } from "./types";

/** Keep active and soonest upcoming tournaments ahead of drafts and history. */
export function sortTournaments(items: Content[], now = Date.now()): Content[] {
  const timestamp = (value: string | null) =>
    value ? Date.parse(value) : Number.NaN;
  const priority = (item: Content) => {
    const start = timestamp(item.starts_at);
    const end = timestamp(item.ends_at);
    if (
      item.status === "ongoing" ||
      (item.status === "published" && start <= now && end >= now)
    )
      return 0;
    if (item.status === "published" && start > now) return 1;
    if (item.status === "published" && !Number.isFinite(start)) return 2;
    if (item.status === "draft") return 3;
    if (item.status === "cancelled") return 5;
    if (item.status === "archived") return 6;
    return 4;
  };

  return [...items].sort((a, b) => {
    const group = priority(a) - priority(b);
    if (group) return group;
    const ascending = priority(a) <= 1;
    const fallback = ascending ? Infinity : -Infinity;
    const startA = Number.isFinite(timestamp(a.starts_at))
      ? timestamp(a.starts_at)
      : fallback;
    const startB = Number.isFinite(timestamp(b.starts_at))
      ? timestamp(b.starts_at)
      : fallback;
    // Upcoming dates run forward; historical dates run backward.
    if (startA !== startB) {
      return ascending ? startA - startB : startB - startA;
    }
    return b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id);
  });
}
