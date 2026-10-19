export type Module = "members" | "recruitment" | "content" | "tournaments";
export interface PortalAccount {
  user_id: string;
  email: string;
  name: string;
  is_admin: boolean;
  modules: Module[];
  active: boolean;
  organization_role: "officer" | "committee";
}
export type ContentKind =
  "announcement" | "event" | "opening" | "product" | "tournament";
export interface Content {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  image_url: string | null;
  status: string;
  featured: boolean;
  starts_at: string | null;
  ends_at: string | null;
  deadline: string | null;
  venue: string;
  game: string;
  champion_name: string;
  price: number | null;
  variants: string[];
  availability: string;
  external_url: string;
  roster_size: number;
  substitutes: number;
  capacity: number;
  created_at: string;
}
export interface Member {
  id: string;
  name: string;
  position: string;
  category: string;
  game: string;
  team: string;
  academic_term: string;
  active: boolean;
  public_visible: boolean;
}
export interface Application {
  id: string;
  reference: string;
  opening_id: string;
  email: string;
  name: string;
  student_number: string;
  course_year: string;
  experience: string;
  status: string;
  campus_verified: boolean;
  internal_notes: string;
  public_feedback: string;
  created_at: string;
}
export interface RosterPlayer {
  name: string;
  alias: string;
  student_number: string;
  course_year: string;
  game_id: string;
  substitute: boolean;
}
export interface Team {
  id: string;
  tournament_id: string;
  reference: string;
  name: string;
  email: string;
  captain: string;
  roster: RosterPlayer[];
  status: string;
  campus_verified: boolean;
  seed: number | null;
  public_feedback: string;
  internal_notes: string;
  created_at: string;
}
export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  team_a: string | null;
  team_b: string | null;
  winner_id: string | null;
  score_a: number | null;
  score_b: number | null;
  starts_at: string | null;
  resolved: boolean;
  version: number;
}
export interface Settings {
  id: number;
  contact_email: string;
  inquiry_url: string;
  social_url: string;
  about: string;
}
export interface PublicTeam {
  id: string;
  tournament_id: string;
  name: string;
  seed: number | null;
  aliases: string[];
}
export interface SubmissionStatus {
  reference: string;
  status: string;
  public_feedback: string;
  created_at: string;
  title: string;
}

export interface ScoreboardTeam {
  id: string;
  tournament_id: string;
  team_name: string;
  wins: number;
  losses: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface TournamentFixture {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  winner_id: string | null;
  starts_at: string | null;
  round_label: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  version: number;
  created_at: string;
  updated_at: string;
}
