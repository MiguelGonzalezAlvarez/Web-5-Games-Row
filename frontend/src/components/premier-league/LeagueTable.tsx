import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import type { Standing } from '../../utils/types';
import { Trophy, Radio, Info } from 'lucide-react';
import { SkeletonList } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { staggerItem } from '../ui/animationConstants';
import styles from './LeagueTable.module.css';

const MANCHESTER_UNITED_NAMES = ['Manchester United', 'Man United'];

export default function LeagueTable() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provider, setProvider] = useState<string>('unknown');

  const isManchesterUnited = (team: Standing) => {
    return MANCHESTER_UNITED_NAMES.some(name => 
      team.team_name.toLowerCase().includes('manchester united') ||
      team.team_short_name?.toLowerCase().includes('man united')
    );
  };

  const hasStats = (team: Standing) => {
    return team.played_games > 0 || team.points > 0;
  };

  const fetchStandings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, providersData] = await Promise.all([
        api.getStandings(),
        api.getProviders()
      ]);
      setStandings(data);
      setProvider(providersData.current_provider);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load standings'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
    const interval = setInterval(fetchStandings, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.table}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.headerTitle}>
            <Trophy className={styles.headerIcon} size={22} />
            <h3>Premier League</h3>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.loadingBadge}>Loading</span>
          </div>
        </motion.div>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th className={styles.posCol}>#</th>
                <th className={styles.teamCol}>Team</th>
                <th className={styles.statCol}>P</th>
                <th className={styles.statCol}>W</th>
                <th className={styles.statCol}>D</th>
                <th className={styles.statCol}>L</th>
                <th className={styles.statCol}>GD</th>
                <th className={styles.statCol}>Pts</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonList count={10} skeleton="table" />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.table}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.headerTitle}>
            <Trophy className={styles.headerIcon} size={22} />
            <h3>Premier League</h3>
          </div>
        </motion.div>
        <ErrorState 
          title="Unable to load standings"
          message="We couldn't get the latest Premier League standings. Please try again."
          error={error}
          onRetry={fetchStandings}
        />
      </div>
    );
  }

  const muTeam = standings.find(isManchesterUnited);
  const showStats = standings.some(hasStats);

  return (
    <div className={styles.table}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className={styles.headerTitle}>
          <Trophy className={styles.headerIcon} size={22} />
          <h3>Premier League</h3>
        </div>
        <div className={styles.headerRight}>
          {!showStats && (
            <span className={styles.infoBadge}>
              <Info size={12} />
              Teams Only
            </span>
          )}
          <span className={styles.liveBadge}>
            <Radio size={12} className={styles.pulseIcon} />
            Live
          </span>
        </div>
      </motion.div>
      
      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th className={styles.posCol}>#</th>
              <th className={styles.teamCol}>Team</th>
              {showStats && (
                <>
                  <th className={styles.statCol}>P</th>
                  <th className={styles.statCol}>W</th>
                  <th className={styles.statCol}>D</th>
                  <th className={styles.statCol}>L</th>
                  <th className={styles.statCol}>GD</th>
                  <th className={styles.statCol}>Pts</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {standings.map((team, index) => {
                const isMU = isManchesterUnited(team);
                return (
                  <motion.tr 
                    key={team.team_id}
                    className={isMU ? styles.highlight : ''}
                    variants={staggerItem}
                    initial="initial"
                    animate="animate"
                    custom={index}
                    whileHover={{ scale: 1.01, backgroundColor: isMU ? 'rgba(218, 41, 28, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className={styles.position}>{team.position}</td>
                    <td className={styles.team}>
                      <img 
                        src={team.team_crest || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23DA291C"/></svg>'} 
                        alt={team.team_name}
                        className={styles.crest}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23DA291C"/></svg>';
                        }}
                      />
                      <span className={styles.teamName}>{team.team_short_name || team.team_name}</span>
                    </td>
                    {showStats && (
                      <>
                        <td className={styles.stat}>{team.played_games}</td>
                        <td className={styles.stat}>{team.won}</td>
                        <td className={styles.stat}>{team.draw}</td>
                        <td className={styles.stat}>{team.lost}</td>
                        <td className={styles.stat}>
                          <span className={team.goal_difference >= 0 ? styles.positive : styles.negative}>
                            {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                          </span>
                        </td>
                        <td className={styles.points}>{team.points}</td>
                      </>
                    )}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {muTeam && (
        <motion.div 
          className={styles.muHighlight}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className={styles.muEmoji}>🔴</span>
          <span>Manchester United is highlighted in red</span>
        </motion.div>
      )}
    </div>
  );
}
