import { requireClient } from "./client";
import type { TournamentFixture } from "./types";
const priority = { live: 0, scheduled: 1, completed: 2, cancelled: 3 };
export function sortFixtures(fixtures: readonly TournamentFixture[]) {
  return [...fixtures].sort(
    (a, b) =>
      priority[a.status] - priority[b.status] ||
      (a.starts_at ? Date.parse(a.starts_at) : Infinity) -
        (b.starts_at ? Date.parse(b.starts_at) : Infinity) ||
      a.id.localeCompare(b.id),
  );
}
export async function loadFixtures(tournamentId: string) {
  const fixtures: TournamentFixture[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await requireClient()
      .from("tournament_fixtures")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("id")
      .range(start, start + 499);
    if (error) throw error;
    fixtures.push(...(data as TournamentFixture[]));
    if (data.length < 500) break;
  }
  return sortFixtures(fixtures);
}
