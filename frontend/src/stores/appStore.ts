import { create } from 'zustand';
import type { ChallengeStatus, Standing, Match, Post, User } from '../utils/types';

interface AppState {
  // Challenge
  challengeStatus: ChallengeStatus | null;
  setChallengeStatus: (status: ChallengeStatus) => void;

  // Standings
  standings: Standing[];
  setStandings: (standings: Standing[]) => void;

  // Matches
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  manchesterMatches: Match[];
  setManchesterMatches: (matches: Match[]) => void;

  // Posts
  posts: Post[];
  setPosts: (posts: Post[]) => void;

  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  challengeStatus: null,
  setChallengeStatus: (status) => set({ challengeStatus: status }),

  standings: [],
  setStandings: (standings) => set({ standings }),

  matches: [],
  setMatches: (matches) => set({ matches }),
  manchesterMatches: [],
  setManchesterMatches: (matches) => set({ manchesterMatches: matches }),

  posts: [],
  setPosts: (posts) => set({ posts }),

  user: null,
  setUser: (user) => set({ user }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
