import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useToast } from './ui/Toast';
import { 
  Database, 
  CheckCircle2, 
  Loader2, 
  Globe,
  Gamepad2,
} from 'lucide-react';
import styles from './DemoModeToggle.module.css';

interface ProviderMetadata {
  name: string;
  is_free: boolean;
  season: string;
  has_logos: boolean;
  has_standings: boolean;
  has_finished_matches: boolean;
  description: string;
}

interface Provider {
  name: string;
  description: string;
  is_default: boolean;
}

interface ProvidersResponse {
  providers: Provider[];
  current_provider: string;
  current_metadata?: ProviderMetadata;
}

export default function DemoModeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [currentMetadata, setCurrentMetadata] = useState<ProviderMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const toast = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProviders();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProviders = async () => {
    try {
      const data = await api.getProviders() as ProvidersResponse;
      setProviders(data.providers);
      setCurrentProvider(data.current_provider);
      setCurrentMetadata(data.current_metadata || null);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (providerName: string) => {
    if (providerName === currentProvider) {
      setIsOpen(false);
      return;
    }
    
    setSwitching(true);
    setIsOpen(false);
    
    const loadingToastId = toast.info('Verifying data...', 'Switching provider', { duration: 0 });
    
    try {
      const response = await api.setProvider(providerName);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to change provider');
      }
      
      const verificationData = await api.getStandings();
      
      if (!verificationData || verificationData.length === 0) {
        throw new Error('No data received from new provider');
      }
      
      toast.removeToast(loadingToastId);
      const displayName = getProviderDisplayName(providerName);
      toast.success('Provider Changed', `Now using: ${displayName}`);
      setCurrentProvider(providerName);
      
      const providersData = await api.getProviders() as ProvidersResponse;
      setCurrentMetadata(providersData.current_metadata || null);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to change provider:', err);
      toast.removeToast(loadingToastId);
      toast.error('Provider Change Failed', 'Using previous provider');
    } finally {
      setSwitching(false);
    }
  };

  const getProviderDisplayName = (name: string) => {
    switch (name) {
      case 'api-football': return 'API-Football';
      case 'openfootball': return 'OpenFootball';
      case 'football-data.org': return 'Football-Data.org';
      case 'thesportsdb': return 'TheSportsDB';
      case 'demo': return 'Demo Mode';
      default: return name;
    }
  };

  const getProviderIcon = (name: string) => {
    switch (name) {
      case 'api-football': return <Globe size={20} />;
      case 'openfootball': return <Globe size={20} />;
      case 'football-data.org': return <Globe size={20} />;
      case 'thesportsdb': return <Database size={20} />;
      case 'demo': return <Gamepad2 size={20} />;
      default: return <Database size={20} />;
    }
  };

  if (loading) {
    return null;
  }

  const getCurrentProviderIcon = () => {
    return getProviderIcon(currentProvider);
  };

  return (
    <>
      <div className={styles.container} ref={dropdownRef}>
        <motion.button
          className={`${styles.toggle} ${currentProvider === 'demo' ? styles.active : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={switching}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className={styles.icon}>
            {switching ? <Loader2 className={styles.spinning} size={20} /> : getCurrentProviderIcon()}
          </span>
          <span className={styles.label}>
            {getProviderDisplayName(currentProvider)}
          </span>
          <span className={styles.status}>
            {switching ? 'Changing...' : (currentMetadata?.season || 'Click to switch')}
          </span>
        </motion.button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.dropdownHeader}>
                Select Data Provider
              </div>
              {providers.map((provider) => (
                <motion.button
                  key={provider.name}
                  className={`${styles.dropdownItem} ${provider.name === currentProvider ? styles.activeItem : ''}`}
                  onClick={() => handleProviderChange(provider.name)}
                  disabled={switching}
                  whileHover={{ backgroundColor: 'var(--color-gray-50)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.providerIcon}>{getProviderIcon(provider.name)}</span>
                  <div className={styles.providerInfo}>
                    <span className={styles.providerName}>
                      {getProviderDisplayName(provider.name)}
                      {provider.is_default && <span className={styles.defaultBadge}>Recommended</span>}
                    </span>
                    <span className={styles.providerDesc}>{provider.description}</span>
                  </div>
                  {provider.name === currentProvider && (
                    <CheckCircle2 className={styles.checkmark} size={18} />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
