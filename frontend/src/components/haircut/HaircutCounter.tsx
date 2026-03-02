import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import type { ChallengeStatus } from '../../utils/types';
import styles from './HaircutCounter.module.css';

export default function HaircutCounter() {
  const [status, setStatus] = useState<ChallengeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await api.getChallengeStatus();
        setStatus(data);
      } catch (err) {
        setError('Failed to load challenge status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <motion.div 
        className={styles.counter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.skeleton}>Loading...</div>
      </motion.div>
    );
  }

  if (error || !status) {
    return (
      <motion.div 
        className={styles.counter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.error}>{error || 'Unable to load'}</div>
      </motion.div>
    );
  }

  const progress = (status.current_streak / status.target_streak) * 100;

  return (
    <motion.div 
      className={styles.counter}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className={styles.header}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <span className={styles.scissors}>✂️</span>
        <h2>The Challenge</h2>
      </motion.div>
      
      <motion.div 
        className={styles.mainCounter}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <motion.div 
          className={styles.daysCircle}
          animate={{ 
            boxShadow: [
              "0 10px 30px rgba(218, 41, 28, 0.3)",
              "0 15px 40px rgba(218, 41, 28, 0.5)",
              "0 10px 30px rgba(218, 41, 28, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.span 
            className={styles.daysNumber}
            key={status.days_since_start}
            initial={{ scale: 1.2, color: "#FBE122" }}
            animate={{ scale: 1, color: "#FFFFFF" }}
            transition={{ duration: 0.5 }}
          >
            {status.days_since_start}
          </motion.span>
          <span className={styles.daysLabel}>Days</span>
        </motion.div>
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.p 
          key={status.current_streak}
          className={styles.message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {status.motivational_message}
        </motion.p>
      </AnimatePresence>
      
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Current Streak</span>
          <span>{status.current_streak} / {status.target_streak}</span>
        </div>
        <div className={styles.progressBar}>
          <motion.div 
            className={styles.progressFill}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          />
          <div className={styles.progressMilestones}>
            {[1, 2, 3, 4, 5].map((num, index) => (
              <motion.div 
                key={num} 
                className={`${styles.milestone} ${status.current_streak >= num ? styles.active : ''}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
              >
                {num}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {status.next_match_date && (
        <motion.div 
          className={styles.nextMatch}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h4>Next Match</h4>
          <p>
            {status.next_match_home_team} vs {status.next_match_away_team}
          </p>
          <time>
            {new Date(status.next_match_date).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </motion.div>
      )}

      <AnimatePresence>
        {status.is_challenge_complete && (
          <motion.div 
            className={styles.celebration}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.span 
              className={styles.celebrationEmoji}
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🎉✂️🎉
            </motion.span>
            <h3>FREEDOM!</h3>
            <p>Frank finally gets his haircut!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
