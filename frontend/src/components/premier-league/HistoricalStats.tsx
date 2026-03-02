import { useState, useEffect } from 'react';
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

const mockStats: Stats = {
  longest_streak: 4,
  total_streaks: 12,
  top_streaks: [
    { length: 4, start: '2026-02-01', end: '2026-02-10' },
    { length: 3, start: '2025-12-15', end: '2025-12-26' },
    { length: 3, start: '2025-08-20', end: '2025-09-01' },
    { length: 2, start: '2025-05-10', end: '2025-05-15' },
    { length: 2, start: '2025-03-01', end: '2025-03-08' },
  ],
  streaks_of_3_or_more: 2,
};

export default function HistoricalStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading stats...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📊 Historical Streaks</h3>
        <p>Manchester United's winning streak history</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🏆</span>
          <span className={styles.statValue}>{stats.longest_streak}</span>
          <span className={styles.statLabel}>Longest Streak</span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📈</span>
          <span className={styles.statValue}>{stats.total_streaks}</span>
          <span className={styles.statLabel}>Total Streaks</span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎯</span>
          <span className={styles.statValue}>{stats.streaks_of_3_or_more}</span>
          <span className={styles.statLabel}>3+ Wins</span>
        </div>
      </div>

      <div className={styles.streaksList}>
        <h4>Top Streaks</h4>
        {stats.top_streaks.map((streak, index) => (
          <div 
            key={index} 
            className={`${styles.streakItem} ${streak.length >= 3 ? styles.highlight : ''}`}
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
              <div className={styles.streakBadge}>🔥</div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.funFact}>
        <h4>💡 Did You Know?</h4>
        <p>
          Manchester United has only achieved a 5-game winning streak {stats.longest_streak >= 5 ? 'once!' : 'never'} in recent history.
          That's why Frank's haircut is taking so long!
        </p>
      </div>
    </div>
  );
}
