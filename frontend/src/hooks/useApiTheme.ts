import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export type ApiProvider = 'demo' | 'api-football' | 'openfootball' | 'football-data.org' | 'thesportsdb' | 'fixturedownload' | '';

export interface ApiThemeConfig {
  provider: ApiProvider;
  displayName: string;
  season: string;
  badgeText: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const providerConfigs: Record<ApiProvider, ApiThemeConfig> = {
  '': {
    provider: '',
    displayName: 'Default',
    season: '',
    badgeText: '',
    description: '',
    icon: 'Database',
    colors: { primary: '#DA291C', secondary: '#FBE122', accent: '#DA291C' }
  },
  'demo': {
    provider: 'demo',
    displayName: 'Demo Mode',
    season: '2024-25',
    badgeText: 'Demo Mode • Sample Data',
    description: 'Test data with extreme streaks for demonstration',
    icon: 'Gamepad2',
    colors: { primary: '#DA291C', secondary: '#FBE122', accent: '#8B5CF6' }
  },
  'api-football': {
    provider: 'api-football',
    displayName: 'API-Football',
    season: '2024-25',
    badgeText: '2024-25 Season • Historical Data',
    description: 'Historical archive with team logos',
    icon: 'Globe',
    colors: { primary: '#1E3A8A', secondary: '#D4AF37', accent: '#0EA5E9' }
  },
  'openfootball': {
    provider: 'openfootball',
    displayName: 'OpenFootball',
    season: '2025-26',
    badgeText: '2025-26 Season • Live Data',
    description: 'Current season with finished matches',
    icon: 'Globe',
    colors: { primary: '#059669', secondary: '#DA291C', accent: '#84CC16' }
  },
  'football-data.org': {
    provider: 'football-data.org',
    displayName: 'Football-Data.org',
    season: '2024-25',
    badgeText: '2024-25 Season • Official Data',
    description: 'Reliable football data from football-data.org',
    icon: 'Globe',
    colors: { primary: '#0D9488', secondary: '#F59E0B', accent: '#6366F1' }
  },
  'thesportsdb': {
    provider: 'thesportsdb',
    displayName: 'TheSportsDB',
    season: 'Various',
    badgeText: 'Multiple Seasons • Entertainment',
    description: 'Entertainment-focused sports data',
    icon: 'Database',
    colors: { primary: '#7C3AED', secondary: '#EC4899', accent: '#06B6D4' }
  },
  'fixturedownload': {
    provider: 'fixturedownload',
    displayName: 'FixtureDownload',
    season: '2024-25',
    badgeText: '2024-25 Season • Daily Updates',
    description: 'Free daily updated Premier League data - no API key required',
    icon: 'Calendar',
    colors: { primary: '#F59E0B', secondary: '#EA580C', accent: '#78716C' }
  }
};

export function useApiTheme() {
  const [currentProvider, setCurrentProvider] = useState<ApiProvider>('');
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<{
    season?: string;
    has_logos?: boolean;
    has_finished_matches?: boolean;
  } | null>(null);

  const fetchCurrentProvider = useCallback(async () => {
    try {
      const data = await api.getProviders();
      const provider = (data.current_provider || '') as ApiProvider;
      setCurrentProvider(provider);
      
      if (data.current_metadata) {
        setMetadata(data.current_metadata);
      }
    } catch (err) {
      console.error('Failed to fetch current provider:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentProvider();
  }, [fetchCurrentProvider]);

  useEffect(() => {
    if (currentProvider) {
      document.documentElement.setAttribute('data-api', currentProvider);
    }
  }, [currentProvider]);

  const themeConfig = providerConfigs[currentProvider] || providerConfigs[''];

  return {
    provider: currentProvider,
    loading,
    metadata,
    themeConfig,
    providerConfigs,
    refreshProvider: fetchCurrentProvider
  };
}

export { providerConfigs };
