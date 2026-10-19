import { requireClient } from "./client";
import type { ScoreboardTeam } from "./types";
export function sortScoreboard(teams: readonly ScoreboardTeam[]) {
  return [...teams].sort(
    (a, b) =>
      b.wins - a.wins ||
      a.losses - b.losses ||
      a.team_name.localeCompare(b.team_name) ||
      a.id.localeCompare(b.id),
  );
}

export async function loadScoreboard(tournamentId: string) {
  const teams: ScoreboardTeam[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await requireClient()
      .from("tournament_scoreboard")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("id")
      .range(start, start + 499);
    if (error) throw error;
    teams.push(...(data as ScoreboardTeam[]));
    if (data.length < 500) break;
  }
  return sortScoreboard(teams);
}
