import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiTheme, ApiProvider } from '../../hooks/useApiTheme';
import { api } from '../../utils/api';
import PositionHistory from '../widgets/PositionHistory';
import StreakTimeline from '../widgets/StreakTimeline';
import { 
  Archive, 
  Activity, 
  Gamepad2, 
  Globe, 
  Database,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Image,
  Clock,
  Trophy,
  BarChart3,
  Info,
  Calendar
} from 'lucide-react';
import styles from './ApiSpecificDashboard.module.css';

interface PositionData {
  matchday: number;
  position: number;
  points: number;
  change?: 'up' | 'down' | 'same';
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  wins: number;
  draws: number;
  losses: number;
  recentForm: string[];
  totalMatches: number;
}

interface ApiSpecificDashboardProps {
  children?: React.ReactNode;
}

function getProviderDisplayContent(provider: ApiProvider, metadata: any) {
  const season = metadata?.season || 'Unknown';
  const hasLogos = metadata?.has_logos ?? true;
  const hasFinishedMatches = metadata?.has_finished_matches ?? true;
  const description = metadata?.description || '';

  switch (provider) {
    case 'api-football':
      return {
        icon: <Archive size={24} />,
        title: 'Historical Archive',
        subtitle: `${season} Season • Historical Data`,
        description: hasFinishedMatches 
          ? 'Complete match history with scores. All 380 matches have recorded results from the season.'
          : 'Historical data - matches show scores but status may appear as SCHEDULED.',
        accent: '#1E3A8A',
        accentLight: '#3B82F6',
        features: hasLogos 
          ? ['Team logos included', 'Complete match history', 'Historical standings']
          : ['No team logos', 'Complete match history', 'Historical standings'],
        warnings: hasFinishedMatches ? [] : ['Matches marked as SCHEDULED but have scores'],
        dataStatus: hasFinishedMatches ? 'complete' : 'partial',
      };
    case 'openfootball':
      return {
        icon: <Activity size={24} />,
        title: 'Live Season',
        subtitle: `${season} Season • Live Data`,
        description: hasFinishedMatches
          ? 'Current season data - all matches finished with live results.'
          : 'No finished matches available yet.',
        accent: '#059669',
        accentLight: '#10B981',
        features: hasLogos
          ? ['Live standings', 'All matches finished', 'Current season stats']
          : ['No team logos', 'All matches finished', 'Current season stats'],
        warnings: hasLogos ? [] : ['Team logos not available for this source'],
        dataStatus: hasFinishedMatches ? 'complete' : 'empty',
      };
    case 'demo':
      return {
        icon: <Gamepad2 size={24} />,
        title: 'Demo Playground',
        subtitle: 'Sample Data Mode',
        description: 'Test mode with sample data. Current streak exaggerated to 7 wins for demonstration purposes!',
        accent: '#8B5CF6',
        accentLight: '#A78BFA',
        features: ['Extreme streaks (7 wins!)', 'Sample match data', 'For testing only'],
        warnings: ['This is sample data', 'Not real match results'],
        dataStatus: 'demo',
      };
    case 'football-data.org':
      return {
        icon: <Globe size={24} />,
        title: 'Classic Data',
        subtitle: `${season} Season • Classic`,
        description: description || 'Reliable football data from football-data.org.',
        accent: '#0D9488',
        accentLight: '#14B8A6',
        features: hasLogos
          ? ['Team logos included', 'Reliable data', 'Comprehensive stats']
          : ['No team logos', 'Reliable data', 'Comprehensive stats'],
        warnings: hasLogos ? [] : ['Team logos not available'],
        dataStatus: hasFinishedMatches ? 'complete' : 'partial',
      };
    case 'thesportsdb':
      return {
        icon: <Database size={24} />,
        title: 'Sports Database',
        subtitle: 'Multiple Seasons',
        description: description || 'Entertainment-focused sports database with rich metadata.',
        accent: '#7C3AED',
        accentLight: '#8B5CF6',
        features: ['Rich metadata', 'Entertainment focus', 'Multiple sports'],
        warnings: [],
        dataStatus: hasFinishedMatches ? 'complete' : 'partial',
        supportsSeasonSelection: metadata?.supports_season_selection,
        availableSeasons: metadata?.available_seasons,
      };
    case 'fixturedownload':
      return {
        icon: <Clock size={24} />,
        title: 'Daily Updates',
        subtitle: `${season} Season • Daily Data`,
        description: description || 'Free Premier League data updated daily. No API key required.',
        accent: '#F59E0B',
        accentLight: '#FBBF24',
        features: ['Daily updates', 'All match results', 'Calculated standings', 'No API key needed'],
        warnings: hasLogos ? [] : ['No team logos', 'Standings calculated from results'],
        dataStatus: hasFinishedMatches ? 'complete' : 'partial',
        dataFreshness: metadata?.data_freshness || 'daily',
      };
    default:
      return {
        icon: <Globe size={24} />,
        title: 'Dashboard',
        subtitle: 'Overview',
        description: 'Select a data provider to see specific visualizations.',
        accent: '#DA291C',
        accentLight: '#EF4444',
        features: ['Select a provider', 'View data details', 'Compare providers'],
        warnings: [],
        dataStatus: 'unknown',
      };
  }
}

export default function ApiSpecificDashboard({ children }: ApiSpecificDashboardProps) {
  const { provider, loading, metadata } = useApiTheme();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [positionData, setPositionData] = useState<PositionData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const content = getProviderDisplayContent(provider, metadata);

  useEffect(() => {
    async function fetchData() {
      if (!provider) return;
      
      try {
        setLoadingData(true);
        setError(null);
        
        const [streak, position] = await Promise.all([
          api.getStreak(),
          api.getPositionHistory()
        ]);
        
        setStreakData(streak);
        setPositionData(position.positions || []);
        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load data from this provider');
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [provider]);

  if (loading || !provider) {
    return <>{children}</>;
  }

  const muPosition = positionData.length > 0 
    ? positionData[positionData.length - 1].position 
    : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={provider}
        className={styles.dashboard}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className={styles.heroBanner}
          style={{ 
            background: `linear-gradient(135deg, ${content.accent}15 0%, ${content.accent}05 100%)`,
            borderColor: `${content.accent}30`
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.heroIcon} style={{ background: content.accent }}>
            {content.icon}
          </div>
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle} style={{ color: content.accent }}>
              {content.title}
            </h2>
            <p className={styles.heroSubtitle}>{content.subtitle}</p>
          </div>
          <div className={styles.heroBadges}>
            <span 
              className={styles.heroBadge}
              style={{ 
                background: content.accent,
                boxShadow: `0 4px 12px ${content.accent}40`
              }}
            >
              <Sparkles size={12} />
              {provider === 'demo' ? 'Demo' : provider === 'api-football' ? 'Historical' : provider === 'openfootball' ? 'Live' : 'Data'}
            </span>
            <span className={styles.dataStatusBadge} data-status={content.dataStatus}>
              {content.dataStatus === 'complete' && <CheckCircle2 size={12} />}
              {content.dataStatus === 'partial' && <AlertCircle size={12} />}
              {content.dataStatus === 'demo' && <Gamepad2 size={12} />}
              {content.dataStatus === 'empty' && <Clock size={12} />}
              {content.dataStatus === 'complete' ? 'Complete' : 
               content.dataStatus === 'partial' ? 'Partial' :
               content.dataStatus === 'demo' ? 'Demo' : 'No Data'}
            </span>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            className={styles.errorBox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}

        <div className={styles.descriptionBox} style={{ borderLeftColor: content.accent }}>
          <p>{content.description}</p>
        </div>

        {content.warnings.length > 0 && (
          <div className={styles.warningsBox}>
            {content.warnings.map((warning: string, i: number) => (
              <motion.div
                key={warning}
                className={styles.warningItem}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <AlertCircle size={14} />
                <span>{warning}</span>
              </motion.div>
            ))}
          </div>
        )}

        <div className={styles.featuresList}>
          {content.features.map((feature: string, i: number) => (
            <motion.div
              key={feature}
              className={styles.featureItem}
              style={{ borderColor: `${content.accent}20` }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <ChevronRight size={14} style={{ color: content.accent }} />
              <span>{feature}</span>
            </motion.div>
          ))}
        </div>

        {loadingData ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} style={{ borderTopColor: content.accent }} />
            <span>Loading {provider} data...</span>
          </div>
        ) : (
          <div className={styles.widgetsGrid}>
            <motion.div
              className={styles.widget}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <StreakTimeline 
                data={{
                  currentStreak: streakData?.currentStreak || 0,
                  longestStreak: streakData?.longestStreak || 0,
                  wins: streakData?.wins || 0,
                  draws: streakData?.draws || 0,
                  losses: streakData?.losses || 0,
                  recentForm: streakData?.recentForm || []
                }}
              />
            </motion.div>

            <motion.div
              className={styles.widget}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <PositionHistory 
                positions={positionData.map(p => ({
                  matchday: p.matchday,
                  position: p.position,
                  points: p.points,
                  change: p.change
                }))}
                currentPosition={muPosition || undefined}
              />
            </motion.div>
          </div>
        )}

        {metadata && (
          <motion.div 
            className={styles.metadataBox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className={styles.metadataTitle}>
              <Info size={14} />
              <span>Provider Information</span>
            </div>
            <div className={styles.metadataGrid}>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Season</span>
                <span className={styles.metadataValue}>{metadata.season || 'Unknown'}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Team Logos</span>
                <span className={styles.metadataValue}>
                  {metadata.has_logos ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {metadata.has_logos ? ' Available' : ' Not Available'}
                </span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Finished Matches</span>
                <span className={styles.metadataValue}>
                  {metadata.has_finished_matches ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {metadata.has_finished_matches ? ' Yes' : ' No'}
                </span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Free Tier</span>
                <span className={styles.metadataValue}>
                  {metadata.is_free !== false ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {metadata.is_free !== false ? ' Yes' : ' No'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
