import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../utils/api';
import { 
  Globe,
  Database,
  Gamepad2,
  Calendar,
  Image,
  Trophy,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
  Star
} from 'lucide-react';
import { scaleIn, staggerItem } from '../ui/animationConstants';
import styles from './ApiComparison.module.css';

interface ProviderMetadata {
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
}

interface ProvidersMetadataResponse {
  providers: ProviderMetadata[];
  current_provider: string;
}

export default function ApiComparison() {
  const [metadata, setMetadata] = useState<ProviderMetadata[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const data = await api.getProvidersMetadata() as ProvidersMetadataResponse;
      setMetadata(data.providers);
      setCurrentProvider(data.current_provider);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (name: string) => {
    switch (name) {
      case 'api-football': return <Globe size={20} />;
      case 'openfootball': return <Globe size={20} />;
      case 'football-data.org': return <Globe size={20} />;
      case 'thesportsdb': return <Database size={20} />;
      case 'fixturedownload': return <Calendar size={20} />;
      case 'demo': return <Gamepad2 size={20} />;
      default: return <Database size={20} />;
    }
  };

  const getProviderDisplayName = (name: string) => {
    switch (name) {
      case 'api-football': return 'API-Football';
      case 'openfootball': return 'OpenFootball';
      case 'football-data.org': return 'Football-Data.org';
      case 'thesportsdb': return 'TheSportsDB';
      case 'fixturedownload': return 'FixtureDownload';
      case 'demo': return 'Demo Mode';
      default: return name;
    }
  };

  const getDataFreshnessIcon = (freshness?: string) => {
    switch (freshness) {
      case 'daily': return <Clock size={14} />;
      case 'weekly': return <RefreshCw size={14} />;
      case 'historical': return <History size={14} />;
      case 'static': return <Star size={14} />;
      default: return <Globe size={14} />;
    }
  };

  const toggleExpand = (name: string) => {
    setExpanded(expanded === name ? null : name);
  };

  if (loading) {
    return (
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.loading}>
          <RefreshCw className={styles.spinning} size={24} />
          <p>Loading API comparison...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.headerTitle}>
          <Trophy className={styles.headerIcon} size={22} />
          <h3>API Comparison</h3>
        </div>
        <span className={styles.badge}>
          {metadata.length} Sources
        </span>
      </motion.div>

      <div className={styles.grid}>
        {metadata.map((provider, index) => (
          <motion.div
            key={provider.name}
            className={`${styles.providerCard} ${provider.name === currentProvider ? styles.active : ''}`}
            variants={staggerItem}
            initial="initial"
            animate="animate"
            custom={index}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.providerInfo}>
                <span className={styles.providerIcon}>
                  {getProviderIcon(provider.name)}
                </span>
                <div>
                  <span className={styles.providerName}>
                    {getProviderDisplayName(provider.name)}
                  </span>
                  <span className={styles.season}>
                    <Calendar size={12} />
                    {provider.season}
                  </span>
                </div>
              </div>
              {provider.name === currentProvider && (
                <span className={styles.currentBadge}>Active</span>
              )}
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                {provider.has_logos ? (
                  <CheckCircle2 size={16} className={styles.checkIcon} />
                ) : (
                  <XCircle size={16} className={styles.xIcon} />
                )}
                <span>Team Logos</span>
              </div>
              <div className={styles.feature}>
                {provider.has_standings ? (
                  <CheckCircle2 size={16} className={styles.checkIcon} />
                ) : (
                  <XCircle size={16} className={styles.xIcon} />
                )}
                <span>Standings</span>
              </div>
              <div className={styles.feature}>
                {provider.has_finished_matches ? (
                  <CheckCircle2 size={16} className={styles.checkIcon} />
                ) : (
                  <AlertCircle size={16} className={styles.warningIcon} />
                )}
                <span>Match Results</span>
              </div>
              <div className={styles.feature}>
                {provider.is_free ? (
                  <CheckCircle2 size={16} className={styles.checkIcon} />
                ) : (
                  <XCircle size={16} className={styles.xIcon} />
                )}
                <span>Free Tier</span>
              </div>
            </div>

            <button 
              className={styles.expandBtn}
              onClick={() => toggleExpand(provider.name)}
            >
              {expanded === provider.name ? (
                <>Show Less <ChevronUp size={14} /></>
              ) : (
                <>Show More <ChevronDown size={14} /></>
              )}
            </button>

            {expanded === provider.name && (
              <motion.div 
                className={styles.expandedContent}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <p className={styles.description}>{provider.description}</p>
                {!provider.has_finished_matches && (
                  <div className={styles.warning}>
                    <AlertCircle size={14} />
                    <span>This provider shows scheduled matches but no final results yet. Streaks calculation may be limited.</span>
                  </div>
                )}
                {!provider.has_logos && (
                  <div className={styles.info}>
                    <Image size={14} />
                    <span>Logos are not available from this data source.</span>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className={styles.legend}>
        <h4>Legend</h4>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <CheckCircle2 size={14} className={styles.checkIcon} />
            <span>Available</span>
          </div>
          <div className={styles.legendItem}>
            <XCircle size={14} className={styles.xIcon} />
            <span>Not Available</span>
          </div>
          <div className={styles.legendItem}>
            <AlertCircle size={14} className={styles.warningIcon} />
            <span>Limited</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
