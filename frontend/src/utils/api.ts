import type { Standing, Match, ChallengeStatus, ProvidersResponse, ApiError } from './types';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8002/api/v1';
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout<T>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw new ApiError(500, 'Network error');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { retries = MAX_RETRIES, ...fetchOptions } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout<T>(url, { ...fetchOptions, retries: 0 });
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
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

async function fetchAPI<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  try {
    return await fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, options);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Helper to compute derived data for standings
function computeStandingData(standings: Standing[]): Standing[] {
  return standings.map(s => ({
    ...s,
    is_manchester_united: s.team_name.toLowerCase().includes('manchester united') || 
                          s.team_short_name?.toLowerCase().includes('man united'),
    has_valid_stats: s.played_games > 0 || s.points > 0 || s.goals_for > 0,
  }));
}

// Helper to compute derived data for matches
function computeMatchData(matches: Match[]): Match[] {
  return matches.map(m => {
    const isHome = m.home_team.toLowerCase().includes('manchester united') ||
                   m.home_team_short?.toLowerCase().includes('man united');
    
    let muResult: 'W' | 'L' | 'D' | null = null;
    if (m.status === 'FINISHED') {
      if (isHome) {
        muResult = m.home_score > m.away_score ? 'W' : 
                   m.home_score < m.away_score ? 'L' : 'D';
      } else {
        muResult = m.away_score > m.home_score ? 'W' : 
                   m.away_score < m.home_score ? 'L' : 'D';
      }
    }
    
    // Format date
    let formattedDate = '';
    try {
      const date = new Date(m.utc_date);
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
      ...m,
      mu_result: muResult,
      formatted_date: formattedDate,
    };
  });
}

export const api = {
  // Football endpoints with typed responses
  getStandings: async (): Promise<Standing[]> => {
    const data = await fetchAPI<Standing[]>('/football/standings');
    return computeStandingData(data);
  },
  
  getMatches: async (matchday?: number): Promise<Match[]> => {
    const endpoint = `/football/matches${matchday ? `?matchday=${matchday}` : ''}`;
    const data = await fetchAPI<Match[]>(endpoint);
    return computeMatchData(data);
  },
  
  getManchesterUnitedMatches: async (limit = 10): Promise<Match[]> => {
    const data = await fetchAPI<Match[]>(`/football/matches/manchester-united?limit=${limit}`);
    return computeMatchData(data).slice(0, limit);
  },
  
  getNextMatch: async () => {
    return fetchAPI<any>('/football/matches/next');
  },
  
  getCurrentStreak: async () => {
    return fetchAPI<any>('/football/streak/current');
  },
  
  getStreak: async () => {
    try {
      const current = await fetchAPI<any>('/football/streak/current');
      const history = await fetchAPI<any>('/football/streak/history');
      
      return {
        currentStreak: current?.current_streak || 0,
        longestStreak: Math.max(
          current?.longest_streak || 0,
          history?.top_streaks?.[0]?.length || 0,
          current?.current_streak || 0
        ),
        longestStreakSeason: history?.top_streaks?.[0]?.season,
        wins: current?.wins || 0,
        draws: current?.draws || 0,
        losses: current?.losses || 0,
        recentForm: current?.recent_form || [],
        totalMatches: current?.total_matches || 0,
      };
    } catch (err) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        recentForm: [],
        totalMatches: 0,
      };
    }
  },
  
  getPositionHistory: async () => {
    try {
      const data = await fetchAPI<any>('/football/standings/history');
      return {
        positions: data?.positions || [],
        currentPosition: data?.current_position,
        bestPosition: data?.best_position,
        worstPosition: data?.worst_position,
      };
    } catch (err) {
      return {
        positions: [],
        currentPosition: null,
        bestPosition: null,
        worstPosition: null,
      };
    }
  },
  
  getChallengeStatus: async (): Promise<ChallengeStatus> => {
    return fetchAPI<ChallengeStatus>('/football/challenge/status');
  },
  
  getHistoricalStreaks: async () => {
    return fetchAPI<any>('/football/streak/history');
  },

  // Community endpoints
  getPosts: async (skip = 0, limit = 20) => {
    return fetchAPI<any[]>(`/community/posts?skip=${skip}&limit=${limit}`);
  },
  
  createPost: async (post: { image_url: string; caption?: string }) => {
    return fetchAPI<any>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },
  
  likePost: async (postId: number) => {
    return fetchAPI<any>(`/community/posts/${postId}/like`, { method: 'POST' });
  },
  
  createComment: async (postId: number, content: string) => {
    return fetchAPI<any>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Predictions
  getPredictions: async (userId?: number) => {
    return fetchAPI<any[]>(`/community/predictions${userId ? `?user_id=${userId}` : ''}`);
  },
  
  createPrediction: async (prediction: {
    match_id: string;
    home_team: string;
    away_team: string;
    prediction_home_goals: number;
    prediction_away_goals: number;
  }) => {
    return fetchAPI<any>('/community/predictions', {
      method: 'POST',
      body: JSON.stringify(prediction),
    });
  },

  // Demo mode
  getDemoModeStatus: async () => {
    return fetchAPI<any>('/football/demo-mode');
  },
  
  setDemoMode: async (enabled: boolean) => {
    return fetchAPI<any>(`/football/demo-mode?enabled=${enabled}`, {
      method: 'POST',
    });
  },

  // Data providers
  getProviders: async (): Promise<ProvidersResponse> => {
    return fetchAPI<ProvidersResponse>('/football/providers');
  },
  
  getProvidersMetadata: async () => {
    return fetchAPI<any>('/football/providers/metadata');
  },
  
  setProvider: async (providerName: string) => {
    return fetchAPI<any>(`/football/providers/${providerName}`, {
      method: 'POST',
    });
  },
};

export { ApiError };
