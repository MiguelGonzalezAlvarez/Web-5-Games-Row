/**
 * Football Data Hooks - React Query hooks para datos de fútbol
 * 5 Games in a Row - Manchester United Challenge
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { footballApi } from '@/lib/api';
import type { Standing, Match, ChallengeStatus, StreakData, PositionHistory } from '@/types/api.d';

// ==========================================
// Query Keys
// ==========================================

export const footballKeys = {
  standings: ['football', 'standings'] as const,
  standingsByProvider: (provider: string) =>
    ['football', 'standings', provider] as const,
  matches: (matchday?: number) =>
    ['football', 'matches', matchday ?? 'all'] as const,
  manchesterMatches: (limit: number) =>
    ['football', 'matches', 'manchester', limit] as const,
  nextMatch: ['football', 'matches', 'next'] as const,
  streak: ['football', 'streak'] as const,
  challengeStatus: ['football', 'challenge', 'status'] as const,
  positionHistory: ['football', 'position', 'history'] as const,
} as const;

// ==========================================
// Standings
// ==========================================

export function useStandings(provider?: string) {
  return useQuery({
    queryKey: provider
      ? footballKeys.standingsByProvider(provider)
      : footballKeys.standings,
    queryFn: () => footballApi.getStandings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ==========================================
// Matches
// ==========================================

export function useMatches(matchday?: number) {
  return useQuery({
    queryKey: footballKeys.matches(matchday),
    queryFn: () => footballApi.getMatches(matchday),
    staleTime: 5 * 60 * 1000,
  });
}

export function useManchesterMatches(limit = 10) {
  return useQuery({
    queryKey: footballKeys.manchesterMatches(limit),
    queryFn: () => footballApi.getManchesterUnitedMatches(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNextMatch() {
  return useQuery({
    queryKey: footballKeys.nextMatch,
    queryFn: () => footballApi.getNextMatch(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// ==========================================
// Streaks
// ==========================================

export function useStreak() {
  return useQuery({
    queryKey: footballKeys.streak,
    queryFn: () => footballApi.getStreak(),
    staleTime: 60 * 1000, // 1 minute
  });
}

// ==========================================
// Challenge Status
// ==========================================

export function useChallengeStatus() {
  return useQuery({
    queryKey: footballKeys.challengeStatus,
    queryFn: () => footballApi.getChallengeStatus(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// ==========================================
// Position History
// ==========================================

export function usePositionHistory() {
  return useQuery({
    queryKey: footballKeys.positionHistory,
    queryFn: () => footballApi.getPositionHistory(),
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================================
// Providers
// ==========================================

export function useProviders() {
  return useQuery({
    queryKey: ['football', 'providers'] as const,
    queryFn: () => footballApi.getProviders(),
    staleTime: Infinity, // Providers rarely change
  });
}

export function useProvidersMetadata() {
  return useQuery({
    queryKey: ['football', 'providers', 'metadata'] as const,
    queryFn: () => footballApi.getProvidersMetadata(),
    staleTime: Infinity,
  });
}

export function useChangeProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerName: string) =>
      footballApi.setProvider(providerName),
    onSuccess: () => {
      // Invalidate all football-related queries
      queryClient.invalidateQueries({ queryKey: ['football'] });
    },
  });
}

// ==========================================
// Demo Mode
// ==========================================

export function useDemoModeStatus() {
  return useQuery({
    queryKey: ['football', 'demo-mode'] as const,
    queryFn: () => footballApi.getDemoModeStatus(),
    staleTime: Infinity,
  });
}

export function useToggleDemoMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) => footballApi.setDemoMode(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['football'] });
    },
  });
}
