export interface ChallengeStatus {
  days_since_start: number;
  current_streak: number;
  target_streak: number;
  is_challenge_complete: boolean;
  next_match_date: string | null;
  next_match_home_team: string | null;
  next_match_away_team: string | null;
  motivational_message: string;
}

export interface Standing {
  position: number;
  team_id: number;
  team_name: string;
  team_short_name: string;
  team_crest: string;
  played_games: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  form: string | null;
  // Computed properties for UI
  is_manchester_united?: boolean;
  has_valid_stats?: boolean;
}

export interface Match {
  match_id: number;
  utc_date: string;
  status: MatchStatus;
  matchday: number;
  home_team: string;
  home_team_short: string;
  home_team_crest: string;
  away_team: string;
  away_team_short: string;
  away_team_crest: string;
  home_score: number;
  away_score: number;
  is_manchester_united: boolean;
  // Computed properties for UI
  mu_result?: 'W' | 'L' | 'D' | null;
  formatted_date?: string;
}

export type MatchStatus = 'SCHEDULED' | 'FINISHED' | 'IN_PLAY' | 'POSTPONED' | 'CANCELLED' | 'SUSPENDED';

export interface Post {
  id: number;
  user_id: number;
  image_url: string;
  caption: string | null;
  likes_count: number;
  created_at: string;
  author: {
    id: number;
    username: string;
    avatar_url: string | null;
  };
}

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
}

export interface Provider {
  name: string;
  description: string;
  is_default: boolean;
}

export interface ProvidersResponse {
  providers: Provider[];
  current_provider: string;
}

export interface ApiError {
  status: number;
  message: string;
}
