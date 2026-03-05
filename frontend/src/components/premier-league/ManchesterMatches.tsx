import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import type { Match } from '../../utils/types';
import { History, Trophy, ArrowUp, ArrowDown, Minus, Info, Loader2 } from 'lucide-react';
import { SkeletonList } from '../ui/Skeleton';
import { slideInLeft, staggerItem, buttonTap } from '../ui/animationConstants';
import styles from './ManchesterMatches.module.css';

const MANCHESTER_UNITED_NAMES = ['Manchester United', 'Man United'];

export default function ManchesterMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isManchesterUnited = (teamName: string) => {
    if (!teamName) return false;
    return MANCHESTER_UNITED_NAMES.some(name => 
      teamName.toLowerCase().includes(name.toLowerCase())
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23DA291C"/></svg>';
  };

  useEffect(() => {
    async function fetchMatches() {
      try {
        const data = await api.getManchesterUnitedMatches(10);
        setMatches(data.reverse());
      } catch (err) {
        setError('Failed to load matches');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
    const interval = setInterval(fetchMatches, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.headerTitle}>
            <History className={styles.headerIcon} size={22} />
            <h3>Recent Matches</h3>
          </div>
          <span className={styles.badge}>
            <Loader2 size={12} className={styles.spinning} />
            MUFC
          </span>
        </motion.div>
        <div className={styles.matches}>
          <SkeletonList count={5} skeleton="match" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerTitle}>
            <History className={styles.headerIcon} size={22} />
            <h3>Recent Matches</h3>
          </div>
        </motion.div>
        <motion.div 
          className={styles.errorContainer}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Info size={48} className={styles.errorIcon} />
          <p>{error}</p>
        </motion.div>
      </div>
    );
  }

  const getResultClass = (match: Match) => {
    const muIsHome = isManchesterUnited(match.home_team);
    const muWon = muIsHome ? match.home_score > match.away_score : match.away_score > match.home_score;
    const muDrew = match.home_score === match.away_score;
    
    if (muWon) return styles.win;
    if (muDrew) return styles.draw;
    return styles.loss;
  };

  const getResultIcon = (match: Match) => {
    const muIsHome = isManchesterUnited(match.home_team);
    const muWon = muIsHome ? match.home_score > match.away_score : match.away_score > match.home_score;
    const muDrew = match.home_score === match.away_score;
    
    if (muWon) return <ArrowUp size={14} />;
    if (muDrew) return <Minus size={14} />;
    return <ArrowDown size={14} />;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className={styles.headerTitle}>
          <History className={styles.headerIcon} size={22} />
          <h3>Recent Matches</h3>
        </div>
        <span className={styles.badge}>
          <Trophy size={12} />
          MUFC
        </span>
      </motion.div>
      
      <div className={styles.matches}>
        <AnimatePresence>
          {matches.map((match, index) => (
            <motion.div
              key={match.match_id}
              className={`${styles.match} ${getResultClass(match)}`}
              variants={slideInLeft}
              initial="initial"
              animate="animate"
              custom={index}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.date}>{formatDate(match.utc_date)}</div>
              
              <div className={styles.teams}>
                <motion.div 
                  className={`${styles.team} ${isManchesterUnited(match.home_team) ? styles.muTeam : ''}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <img 
                    src={match.home_team_crest || ''} 
                    alt={match.home_team} 
                    className={styles.crest}
                    onError={handleImageError}
                  />
                  <span>{match.home_team_short || match.home_team}</span>
                </motion.div>
                
                <div className={styles.score}>
                  <span>{match.home_score ?? 0}</span>
                  <span>-</span>
                  <span>{match.away_score ?? 0}</span>
                </div>
                
                <motion.div 
                  className={`${styles.team} ${isManchesterUnited(match.away_team) ? styles.muTeam : ''}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <img 
                    src={match.away_team_crest || ''} 
                    alt={match.away_team} 
                    className={styles.crest}
                    onError={handleImageError}
                  />
                  <span>{match.away_team_short || match.away_team}</span>
                </motion.div>
              </div>
              
              <motion.div 
                className={styles.result}
                variants={staggerItem}
                initial="initial"
                animate="animate"
              >
                {getResultIcon(match)}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
