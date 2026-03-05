import { motion } from 'framer-motion';
import { Flame, Zap, Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import styles from './StreakTimeline.module.css';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  longestStreakSeason?: string;
  recentForm: string[];
  wins: number;
  draws: number;
  losses: number;
}

interface StreakTimelineProps {
  data: StreakData;
  teamName?: string;
}

export default function StreakTimeline({ data, teamName = 'Manchester United' }: StreakTimelineProps) {
  const { currentStreak, longestStreak, longestStreakSeason, recentForm, wins, draws, losses } = data;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    }
  };

  const getFormResult = (result: string) => {
    switch (result.toUpperCase()) {
      case 'W': return { icon: <Zap size={12} />, class: styles.win, label: 'Win' };
      case 'D': return { icon: <span>−</span>, class: styles.draw, label: 'Draw' };
      case 'L': return { icon: <span>×</span>, class: styles.loss, label: 'Loss' };
      default: return { icon: null, class: '', label: 'Unknown' };
    }
  };

  const winRate = wins + draws + losses > 0 
    ? Math.round((wins / (wins + draws + losses)) * 100) 
    : 0;

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Flame size={18} />
          Streak Timeline
        </h3>
      </div>

      <div className={styles.streakCards}>
        <motion.div 
          className={`${styles.streakCard} ${styles.current}`}
          variants={itemVariants}
        >
          <div className={styles.streakIcon}>
            <Flame size={24} />
          </div>
          <div className={styles.streakInfo}>
            <span className={styles.streakValue}>{currentStreak}</span>
            <span className={styles.streakLabel}>Current Streak</span>
          </div>
          {currentStreak >= 5 && (
            <div className={styles.streakBadge}>
              <Trophy size={12} />
              Goal!
            </div>
          )}
        </motion.div>

        <motion.div 
          className={`${styles.streakCard} ${styles.longest}`}
          variants={itemVariants}
        >
          <div className={styles.streakIcon}>
            <Trophy size={24} />
          </div>
          <div className={styles.streakInfo}>
            <span className={styles.streakValue}>{longestStreak}</span>
            <span className={styles.streakLabel}>Longest Streak</span>
          </div>
          {longestStreakSeason && (
            <span className={styles.seasonTag}>{longestStreakSeason}</span>
          )}
        </motion.div>
      </div>

      <div className={styles.formSection}>
        <h4 className={styles.sectionTitle}>
          <TrendingUp size={14} />
          Recent Form
        </h4>
        <div className={styles.formGrid}>
          {recentForm.map((result, i) => {
            const { icon, class: resultClass, label } = getFormResult(result);
            return (
              <motion.div
                key={i}
                className={`${styles.formItem} ${resultClass}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring' }}
                title={label}
              >
                {icon}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <motion.div className={styles.statBox} variants={itemVariants}>
          <span className={styles.statNumber}>{wins}</span>
          <span className={styles.statLabel}>Wins</span>
        </motion.div>
        <motion.div className={styles.statBox} variants={itemVariants}>
          <span className={styles.statNumber}>{draws}</span>
          <span className={styles.statLabel}>Draws</span>
        </motion.div>
        <motion.div className={styles.statBox} variants={itemVariants}>
          <span className={styles.statNumber}>{losses}</span>
          <span className={styles.statLabel}>Losses</span>
        </motion.div>
        <motion.div className={`${styles.statBox} ${styles.winRate}`} variants={itemVariants}>
          <span className={styles.statNumber}>{winRate}%</span>
          <span className={styles.statLabel}>Win Rate</span>
        </motion.div>
      </div>

      {currentStreak > 0 && (
        <motion.div 
          className={styles.progressSection}
          variants={itemVariants}
        >
          <div className={styles.progressHeader}>
            <Target size={14} />
            <span>Progress to 5 Wins</span>
          </div>
          <div className={styles.progressBar}>
            <motion.div 
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: `${(currentStreak / 5) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className={styles.progressText}>
            {5 - currentStreak} more {5 - currentStreak === 1 ? 'win' : 'wins'} needed
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
