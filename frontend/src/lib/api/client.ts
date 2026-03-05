/**
 * API Client - Cliente API estrictamente tipado
 * 5 Games in a Row - Manchester United Challenge
 */

import {
  Standing,
  Match,
  ChallengeStatus,
  StreakData,
  PositionHistory,
  ProvidersResponse,
  ProvidersMetadataResponse,
  Post,
  Prediction,
  MatchPrediction,
  ApiError,
} from '@/types/api.d';

// ==========================================
// Configuration
// ==========================================

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8002/api/v1';
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ==========================================
// Error Handling
// ==========================================

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  static fromResponse(response: Response, data?: unknown): ApiClientError {
    let code = 'UNKNOWN_ERROR';
    let details: Record<string, unknown> | undefined;

    if (data && typeof data === 'object' && 'detail' in data) {
      code = 'VALIDATION_ERROR';
      details = { detail: (data as { detail: unknown }).detail };
    } else if (data && typeof data === 'object' && 'code' in data) {
      code = (data as { code: string }).code;
    }

    const messages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      408: 'Request Timeout',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return new ApiClientError(
      response.status,
      messages[response.status] || `HTTP Error ${response.status}`,
      code,
      details
    );
  }
}

// ==========================================
// Utilities
// ==========================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriable(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

// ==========================================
// Fetch with Timeout
// ==========================================

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw ApiClientError.fromResponse(response, errorData);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiClientError(408, 'Request timeout');
      }
      throw new ApiClientError(500, error.message);
    }
    throw new ApiClientError(500, 'Network error');
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==========================================
// Fetch with Retry
// ==========================================

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: ApiClientError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout<T>(url, options);
    } catch (error) {
      lastError = error as ApiClientError;

      // Don't retry on client errors (except 429)
      if (error instanceof ApiClientError && !isRetriable(error.status)) {
        throw error;
      }

      // Wait before retrying
      if (attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1));
      }
    }
  }

  throw lastError;
}

// ==========================================
// API Client
// ==========================================

class FootballApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      return await fetchWithRetry<T>(url, options);
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // Standings
  // ==========================================

  async getStandings(): Promise<Standing[]> {
    const data = await this.request<Standing[]>('/football/standings');
    return this.computeStandingData(data);
  }

  private computeStandingData(standings: Standing[]): Standing[] {
    return standings.map((standing) => ({
      ...standing,
      is_manchester_united:
        standing.team_name.toLowerCase().includes('manchester united') ||
        standing.team_short_name?.toLowerCase().includes('man united'),
      has_valid_stats:
        standing.played_games > 0 ||
        standing.points > 0 ||
        standing.goals_for > 0,
    }));
  }

  // ==========================================
  // Matches
  // ==========================================

  async getMatches(matchday?: number): Promise<Match[]> {
    const endpoint = matchday
      ? `/football/matches?matchday=${matchday}`
      : '/football/matches';
    const data = await this.request<Match[]>(endpoint);
    return this.computeMatchData(data);
  }

  async getManchesterUnitedMatches(limit = 10): Promise<Match[]> {
    const data = await this.request<Match[]>(
      `/football/matches/manchester-united?limit=${limit}`
    );
    return this.computeMatchData(data).slice(0, limit);
  }

  async getNextMatch(): Promise<Match | null> {
    try {
      return await this.request<Match>('/football/matches/next');
    } catch {
      return null;
    }
  }

  private computeMatchData(matches: Match[]): Match[] {
    return matches.map((match) => {
      const isHome = match.home_team
        .toLowerCase()
        .includes('manchester united');

      let muResult: 'W' | 'L' | 'D' | null = null;
      if (match.status === 'FINISHED') {
        if (isHome) {
          muResult =
            match.home_score > match.away_score
              ? 'W'
              : match.home_score < match.away_score
              ? 'L'
              : 'D';
        } else {
          muResult =
            match.away_score > match.home_score
              ? 'W'
              : match.away_score < match.home_score
              ? 'L'
              : 'D';
        }
      }

      let formattedDate = '';
      try {
        const date = new Date(match.utc_date);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
        }
      } catch {
        formattedDate = '';
      }

      return {
        ...match,
        mu_result: muResult,
        formatted_date: formattedDate,
      };
    });
  }

  // ==========================================
  // Streaks
  // ==========================================

  async getCurrentStreak(): Promise<StreakData> {
    return this.request<StreakData>('/football/streak/current');
  }

  async getStreak(): Promise<StreakData> {
    try {
      const [current, history] = await Promise.all([
        this.request<StreakData>('/football/streak/current'),
        this.request<{ top_streaks: Array<{ length: number; season: string }> }>(
          '/football/streak/history'
        ),
      ]);

      return {
        ...current,
        longest_streak: Math.max(
          current.longest_streak,
          history?.top_streaks?.[0]?.length || 0,
          current.current_streak
        ),
      };
    } catch {
      return {
        current_streak: 0,
        longest_streak: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        recent_form: [],
        total_matches: 0,
        is_winning: false,
        streak_start_date: null,
        last_match_result: null,
      };
    }
  }

  async getPositionHistory(): Promise<PositionHistory> {
    try {
      const data = await this.request<PositionHistory>('/football/standings/history');
      return {
        positions: data?.positions || [],
        current_position: data?.current_position ?? null,
        best_position: data?.best_position ?? null,
        worst_position: data?.worst_position ?? null,
      };
    } catch {
      return {
        positions: [],
        current_position: null,
        best_position: null,
        worst_position: null,
      };
    }
  }

  // ==========================================
  // Challenge
  // ==========================================

  async getChallengeStatus(): Promise<ChallengeStatus> {
    return this.request<ChallengeStatus>('/football/challenge/status');
  }

  // ==========================================
  // Providers
  // ==========================================

  async getProviders(): Promise<ProvidersResponse> {
    return this.request<ProvidersResponse>('/football/providers');
  }

  async getProvidersMetadata(): Promise<ProvidersMetadataResponse> {
    return this.request<ProvidersMetadataResponse>('/football/providers/metadata');
  }

  async setProvider(providerName: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/football/providers/${providerName}`,
      { method: 'POST' }
    );
  }

  // ==========================================
  // Demo Mode
  // ==========================================

  async getDemoModeStatus(): Promise<{ demo_mode: boolean }> {
    return this.request<{ demo_mode: boolean }>('/football/demo-mode');
  }

  async setDemoMode(enabled: boolean): Promise<{ demo_mode: boolean }> {
    return this.request<{ demo_mode: boolean }>(
      `/football/demo-mode?enabled=${enabled}`,
      { method: 'POST' }
    );
  }

  // ==========================================
  // Community
  // ==========================================

  async getPosts(skip = 0, limit = 20): Promise<Post[]> {
    return this.request<Post[]>(`/community/posts?skip=${skip}&limit=${limit}`);
  }

  async createPost(post: { image_url: string; caption?: string }): Promise<Post> {
    return this.request<Post>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async likePost(postId: number): Promise<{ likes_count: number }> {
    return this.request<{ likes_count: number }>(
      `/community/posts/${postId}/like`,
      { method: 'POST' }
    );
  }

  // ==========================================
  // Predictions
  // ==========================================

  async getPredictions(userId?: number): Promise<Prediction[]> {
    const endpoint = userId
      ? `/community/predictions?user_id=${userId}`
      : '/community/predictions';
    return this.request<Prediction[]>(endpoint);
  }

  async createPrediction(prediction: MatchPrediction): Promise<Prediction> {
    return this.request<Prediction>('/community/predictions', {
      method: 'POST',
      body: JSON.stringify(prediction),
    });
  }
}

// Singleton instance
export const footballApi = new FootballApiClient();

// Default export for backward compatibility
export default footballApi;
