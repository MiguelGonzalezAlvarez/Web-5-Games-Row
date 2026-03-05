import { motion, AnimatePresence } from 'framer-motion';
import { useApiTheme, ApiProvider } from '../../hooks/useApiTheme';
import { 
  Gamepad2, 
  Globe, 
  Database, 
  Clock, 
  TrendingUp,
  Archive,
  Activity
} from 'lucide-react';
import styles from './ApiThemeWrapper.module.css';

interface ApiThemeWrapperProps {
  children: React.ReactNode;
}

function getProviderIcon(provider: ApiProvider) {
  switch (provider) {
    case 'demo': return <Gamepad2 size={16} />;
    case 'api-football': return <Archive size={16} />;
    case 'openfootball': return <Activity size={16} />;
    case 'football-data.org': return <Globe size={16} />;
    case 'thesportsdb': return <Database size={16} />;
    default: return <Globe size={16} />;
  }
}

function getProviderAnimation(provider: ApiProvider) {
  switch (provider) {
    case 'demo': 
      return {
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(218, 41, 28, 0.1) 100%)',
        borderColor: 'rgba(139, 92, 246, 0.3)'
      };
    case 'api-football': 
      return {
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)',
        borderColor: 'rgba(30, 58, 138, 0.3)'
      };
    case 'openfootball': 
      return {
        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(218, 41, 28, 0.1) 100%)',
        borderColor: 'rgba(5, 150, 105, 0.3)'
      };
    case 'football-data.org': 
      return {
        background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
        borderColor: 'rgba(13, 148, 136, 0.3)'
      };
    case 'thesportsdb': 
      return {
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        borderColor: 'rgba(124, 58, 237, 0.3)'
      };
    default:
      return {
        background: 'linear-gradient(135deg, rgba(218, 41, 28, 0.1) 0%, rgba(251, 225, 34, 0.1) 100%)',
        borderColor: 'rgba(218, 41, 28, 0.3)'
      };
  }
}

export default function ApiThemeWrapper({ children }: ApiThemeWrapperProps) {
  const { provider, loading, themeConfig } = useApiTheme();

  if (loading) {
    return <>{children}</>;
  }

  const animationStyle = getProviderAnimation(provider);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={provider || 'default'}
        className={styles.wrapper}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className={styles.apiBadge}
          style={animationStyle}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <span className={styles.badgeIcon}>
            {getProviderIcon(provider)}
          </span>
          <span className={styles.badgeText}>
            {themeConfig.badgeText || 'Select a Data Provider'}
          </span>
        </motion.div>
        
        <motion.div
          className={styles.content}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {children}
        </motion.div>

        {provider && (
          <motion.div
            className={styles.providerIndicator}
            style={{
              background: themeConfig.colors.primary,
              boxShadow: `0 0 20px ${themeConfig.colors.primary}40`
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
