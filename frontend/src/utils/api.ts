const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface FetchOptions extends RequestInit {
  timeout?: number;
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

async function fetchWithTimeout<T>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 10000, ...fetchOptions } = options;
  
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

async function fetchAPI<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  try {
    return await fetchWithTimeout<T>(`${API_BASE_URL}${endpoint}`, options);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Football endpoints
  getStandings: () => fetchAPI<any[]>('/football/standings'),
  
  getMatches: (matchday?: number) => 
    fetchAPI<any[]>(`/football/matches${matchday ? `?matchday=${matchday}` : ''}`),
  
  getManchesterUnitedMatches: (limit = 10) => 
    fetchAPI<any[]>(`/football/matches/manchester-united?limit=${limit}`),
  
  getNextMatch: () => fetchAPI<any>('/football/matches/next'),
  
  getCurrentStreak: () => fetchAPI<any>('/football/streak/current'),
  
  getChallengeStatus: () => fetchAPI<any>('/football/challenge/status'),
  
  getHistoricalStreaks: () => fetchAPI<any>('/football/streak/history'),

  // Community endpoints
  getPosts: (skip = 0, limit = 20) => 
    fetchAPI<any[]>(`/community/posts?skip=${skip}&limit=${limit}`),
  
  createPost: (post: { image_url: string; caption?: string }) =>
    fetchAPI<any>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    }),
  
  likePost: (postId: number) =>
    fetchAPI<any>(`/community/posts/${postId}/like`, { method: 'POST' }),
  
  createComment: (postId: number, content: string) =>
    fetchAPI<any>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // Predictions
  getPredictions: (userId?: number) =>
    fetchAPI<any[]>(`/community/predictions${userId ? `?user_id=${userId}` : ''}`),
  
  createPrediction: (prediction: {
    match_id: string;
    home_team: string;
    away_team: string;
    prediction_home_goals: number;
    prediction_away_goals: number;
  }) =>
    fetchAPI<any>('/community/predictions', {
      method: 'POST',
      body: JSON.stringify(prediction),
    }),
};

export { ApiError };
