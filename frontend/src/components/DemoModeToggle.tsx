import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Globe,
  Gamepad2
} from 'lucide-react';
import styles from './DemoModeToggle.module.css';

interface Provider {
  name: string;
  description: string;
  is_default: boolean;
}

interface ProvidersResponse {
  providers: Provider[];
  current_provider: string;
}

type ToastType = 'success' | 'error' | 'loading';

export default function DemoModeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [dataVerified, setDataVerified] = useState(false);
  const toastRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProviders();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (toastRef.current && !toastRef.current.contains(event.target as Node)) {
        // Don't close toast on outside click - it should stay until provider changes
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
    
    try {
      // 1. Change provider in backend
      const response = await api.setProvider(providerName);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to change provider');
      }
      
      // 2. Verify data is coming through
      setToastType('loading');
      setToastMessage('Verifying data...');
      setShowToast(true);
      
      const verificationData = await api.getStandings();
      
      if (!verificationData || verificationData.length === 0) {
        throw new Error('No data received from new provider');
      }
      
      // 3. Show success
      const displayName = getProviderDisplayName(providerName);
      setToastType('success');
      setToastMessage(`Now using: ${displayName}`);
      setDataVerified(true);
      setCurrentProvider(providerName);
      
      // 4. Reload after a short delay to let user see the success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to change provider:', err);
      setToastType('error');
      setToastMessage('Failed to change provider - using previous');
      setDataVerified(false);
    } finally {
      setSwitching(false);
    }
  };

  const closeToast = () => {
    setShowToast(false);
    setDataVerified(false);
  };

  const getProviderDisplayName = (name: string) => {
    switch (name) {
      case 'football-data.org': return 'Football-Data.org';
      case 'thesportsdb': return 'TheSportsDB';
      case 'demo': return 'Demo Mode';
      default: return name;
    }
  };

  const getProviderIcon = (name: string) => {
    switch (name) {
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
            {switching ? 'Changing...' : 'Click to switch'}
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
      
      <AnimatePresence>
        {showToast && (
          <motion.div
            ref={toastRef}
            className={`${styles.toast} ${styles[`toast${toastType.charAt(0).toUpperCase() + toastType.slice(1)}`]}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.toastContent}>
              {toastType === 'success' && <CheckCircle2 size={20} />}
              {toastType === 'error' && <AlertCircle size={20} />}
              {toastType === 'loading' && <Loader2 className={styles.spinning} size={20} />}
              <span className={styles.toastMessage}>{toastMessage}</span>
              {dataVerified && (
                <span className={styles.verifiedBadge}>✓ Data Verified</span>
              )}
            </div>
            <button className={styles.toastClose} onClick={closeToast}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
