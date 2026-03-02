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
}

export interface Match {
  match_id: number;
  utc_date: string;
  status: string;
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
}

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
