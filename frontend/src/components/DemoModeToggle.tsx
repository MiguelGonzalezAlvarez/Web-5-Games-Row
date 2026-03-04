import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
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

export default function DemoModeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
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
      await api.setProvider(providerName);
      setCurrentProvider(providerName);
      
      const provider = providers.find(p => p.name === providerName);
      const displayName = providerName === 'football-data.org' ? 'Football-Data.org' : 
                         providerName === 'thesportsdb' ? 'TheSportsDB' : 
                         providerName.charAt(0).toUpperCase() + providerName.slice(1);
      
      setToastMessage(`Now using: ${displayName}`);
      setShowToast(true);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to change provider:', err);
      setToastMessage('Failed to change provider');
      setShowToast(true);
    } finally {
      setSwitching(false);
    }
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
      case 'football-data.org': return '⚽';
      case 'thesportsdb': return '🌐';
      case 'demo': return '🎮';
      default: return '⚽';
    }
  };

  const getCurrentProviderInfo = () => {
    const provider = providers.find(p => p.name === currentProvider);
    return provider || { name: currentProvider, description: '', is_default: false };
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <div className={styles.container} ref={dropdownRef}>
        <button
          className={`${styles.toggle} ${currentProvider === 'demo' ? styles.active : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={switching}
        >
          <span className={styles.icon}>{getProviderIcon(currentProvider)}</span>
          <span className={styles.label}>
            {getProviderDisplayName(currentProvider)}
          </span>
          <span className={styles.status}>
            {switching ? 'Changing...' : 'Click to switch'}
          </span>
        </button>
        
        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              Select Data Provider
            </div>
            {providers.map((provider) => (
              <button
                key={provider.name}
                className={`${styles.dropdownItem} ${provider.name === currentProvider ? styles.activeItem : ''}`}
                onClick={() => handleProviderChange(provider.name)}
                disabled={switching}
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
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </>
  );
}
