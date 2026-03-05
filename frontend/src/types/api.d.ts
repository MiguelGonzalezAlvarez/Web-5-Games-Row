/**
 * API Types - Tipos estrictamente tipados para la API
 * 5 Games in a Row - Manchester United Challenge
 */

// ==========================================
// Base Types
// ==========================================

export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
  errors?: ApiError[];
}

export interface ResponseMeta {
  page?: number;
  perPage?: number;
  total?: number;
  hasMore?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// ==========================================
// Football Types
// ==========================================

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
  // Computed
  is_manchester_united?: boolean;
  has_valid_stats?: boolean;
}

export type MatchStatus = 'SCHEDULED' | 'FINISHED' | 'IN_PLAY' | 'POSTPONED' | 'CANCELLED' | 'SUSPENDED';

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
  // Computed
  mu_result?: 'W' | 'L' | 'D' | null;
  formatted_date?: string;
}

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

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  wins: number;
  draws: number;
  losses: number;
  recent_form: string[];
  total_matches: number;
  is_winning: boolean;
  streak_start_date: string | null;
  last_match_result: string | null;
  longest_streak_season?: string;
}

export interface PositionHistoryEntry {
  matchday: number;
  position: number;
  points: number;
  change?: 'up' | 'down' | 'same';
}

export interface PositionHistory {
  positions: PositionHistoryEntry[];
  current_position: number | null;
  best_position: number | null;
  worst_position: number | null;
}

// ==========================================
// Provider Types
// ==========================================

export interface ProviderFeature {
  name: string;
  available: boolean;
  description?: string;
}

export interface ProviderMetadata {
  name: string;
  is_free: boolean;
  season: string;
  has_logos: boolean;
  has_standings: boolean;
  has_finished_matches: boolean;
  description: string;
  data_freshness?: string;
  last_updated?: string;
  coverage?: string[];
  api_type?: string;
  limitations?: string;
  best_for?: string;
  data_quality?: string;
  special_note?: string;
  highlights?: string[];
  supports_season_selection?: boolean;
  available_seasons?: string[];
}

export interface Provider {
  name: string;
  description: string;
  is_default: boolean;
}

export interface ProvidersResponse {
  providers: Provider[];
  current_provider: string;
  current_metadata?: ProviderMetadata;
}

export interface ProvidersMetadataResponse {
  providers: ProviderMetadata[];
  current_provider: string;
}

// ==========================================
// Community Types
// ==========================================

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
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

export interface PostComment {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    avatar_url: string | null;
  };
}

export interface Prediction {
  id: number;
  user_id: number;
  match_id: string;
  home_team: string;
  away_team: string;
  prediction_home_goals: number;
  prediction_away_goals: number;
  is_correct?: boolean;
  points_earned?: number;
  created_at: string;
}

// ==========================================
// Match Prediction
// ==========================================

export interface MatchPrediction {
  match_id: string;
  home_team: string;
  away_team: string;
  prediction_home_goals: number;
  prediction_away_goals: number;
}

// ==========================================
// API Methods Return Types
// ==========================================

export type StandingsResponse = ApiResponse<Standing[]>;
export type MatchesResponse = ApiResponse<Match[]>;
export type ChallengeStatusResponse = ChallengeStatus;
export type StreakDataResponse = StreakData;
export type PositionHistoryResponse = PositionHistory;
export type ProvidersResponseType = ProvidersResponse;
export type ProvidersMetadataResponseType = ProvidersMetadataResponse;
export type PostsResponse = ApiResponse<Post[]>;
export type PostResponse = ApiResponse<Post>;
export type PredictionsResponse = ApiResponse<Prediction[]>;
