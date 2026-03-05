import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import { 
  TrendingUp, 
  Trophy, 
  Target, 
  Flame,
  Lightbulb,
  Info,
  Loader2
} from 'lucide-react';
import { staggerItem, scaleIn } from '../ui/animationConstants';
import styles from './HistoricalStats.module.css';

interface HistoricalStreak {
  length: number;
  start: string;
  end: string | null;
}

interface Stats {
  longest_streak: number;
  total_streaks: number;
  top_streaks: HistoricalStreak[];
  streaks_of_3_or_more: number;
}

export default function HistoricalStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getHistoricalStreaks();
        setStats(data);
      } catch (err) {
        setError('Failed to load historical stats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerTitle}>
            <TrendingUp className={styles.headerIcon} size={22} />
            <h3>Historical Streaks</h3>
          </div>
          <span className={styles.badge}>
            <Loader2 size={12} className={styles.spinning} />
            Loading
          </span>
        </motion.div>
        <div className={styles.loading}>
          <Loader2 className={styles.spinning} size={24} />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerTitle}>
            <TrendingUp className={styles.headerIcon} size={22} />
            <h3>Historical Streaks</h3>
          </div>
        </motion.div>
        <motion.div 
          className={styles.errorContainer}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Info size={48} className={styles.errorIcon} />
          <p>{error || 'Unable to load stats'}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className={styles.headerTitle}>
          <TrendingUp className={styles.headerIcon} size={22} />
          <h3>Historical Streaks</h3>
        </div>
        <span className={styles.badge}>
          <Trophy size={12} />
          MUFC
        </span>
      </motion.div>
      
      <motion.div 
        className={styles.statsGrid}
        variants={staggerItem}
        initial="initial"
        animate="animate"
      >
        <motion.div 
          className={styles.statCard}
          variants={scaleIn}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <span className={styles.statIcon}>
            <Trophy size={24} className={styles.iconTrophy} />
          </span>
          <span className={styles.statValue}>{stats.longest_streak}</span>
          <span className={styles.statLabel}>Longest Streak</span>
        </motion.div>
        
        <motion.div 
          className={styles.statCard}
          variants={scaleIn}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <span className={styles.statIcon}>
            <TrendingUp size={24} className={styles.iconTrending} />
          </span>
          <span className={styles.statValue}>{stats.total_streaks}</span>
          <span className={styles.statLabel}>Total Streaks</span>
        </motion.div>
        
        <motion.div 
          className={styles.statCard}
          variants={scaleIn}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <span className={styles.statIcon}>
            <Target size={24} className={styles.iconTarget} />
          </span>
          <span className={styles.statValue}>{stats.streaks_of_3_or_more}</span>
          <span className={styles.statLabel}>3+ Wins</span>
        </motion.div>
      </motion.div>

      <div className={styles.streaksList}>
        <h4>Top Streaks</h4>
        <AnimatePresence>
          {stats.top_streaks.map((streak, index) => (
            <motion.div 
              key={index} 
              className={`${styles.streakItem} ${streak.length >= 3 ? styles.highlight : ''}`}
              variants={staggerItem}
              initial="initial"
              animate="animate"
              custom={index}
              whileHover={{ scale: 1.01 }}
            >
              <div className={styles.streakRank}>#{index + 1}</div>
              <div className={styles.streakInfo}>
                <span className={styles.streakLength}>{streak.length} wins</span>
                <span className={styles.streakDates}>
                  {streak.start ? new Date(streak.start).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'Ongoing'}
                  {streak.end && ` - ${new Date(streak.end).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}`}
                </span>
              </div>
              {streak.length >= 3 && (
                <motion.div 
                  className={styles.streakBadge}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Flame size={20} className={styles.flameIcon} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div 
        className={styles.funFact}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h4>
          <Lightbulb size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Did You Know?
        </h4>
        <p>
          Manchester United has only achieved a 5-game winning streak {stats.longest_streak >= 5 ? 'once!' : 'never'} in recent history.
          That&apos;s why Frank&apos;s haircut is taking so long!
        </p>
      </motion.div>
    </div>
  );
}
