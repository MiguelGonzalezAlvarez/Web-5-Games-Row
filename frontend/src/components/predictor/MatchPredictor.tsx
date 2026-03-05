import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import { 
  Target, 
  Plus, 
  Minus, 
  Swords, 
  RotateCcw
} from 'lucide-react';
import { scaleIn, buttonTap } from '../ui/animationConstants';
import styles from './MatchPredictor.module.css';

interface Prediction {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

interface NextMatch {
  match_id: number;
  utc_date: string;
  home_team: string;
  away_team: string;
  home_team_crest?: string;
  away_team_crest?: string;
}

export default function MatchPredictor() {
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<Prediction>({
    homeTeam: 'Manchester United',
    awayTeam: '',
    homeScore: 2,
    awayScore: 1,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchNextMatch() {
      try {
        const data = await api.getNextMatch();
        if (data) {
          setNextMatch(data);
          setPrediction({
            homeTeam: data.home_team,
            awayTeam: data.away_team,
            homeScore: 2,
            awayScore: 1,
          });
        }
      } catch (err) {
        console.error('Failed to load next match:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNextMatch();
  }, []);

  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
    setPrediction({ ...prediction, homeScore: value });
  };

  const handleAwayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
    setPrediction({ ...prediction, awayScore: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  const incrementHome = () => {
    if (prediction.homeScore < 10) {
      setPrediction({ ...prediction, homeScore: prediction.homeScore + 1 });
    }
  };

  const decrementHome = () => {
    if (prediction.homeScore > 0) {
      setPrediction({ ...prediction, homeScore: prediction.homeScore - 1 });
    }
  };

  const incrementAway = () => {
    if (prediction.awayScore < 10) {
      setPrediction({ ...prediction, awayScore: prediction.awayScore + 1 });
    }
  };

  const decrementAway = () => {
    if (prediction.awayScore > 0) {
      setPrediction({ ...prediction, awayScore: prediction.awayScore - 1 });
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23DA291C"/></svg>';
  };

  if (loading) {
    return (
      <motion.div 
        className={styles.predictor}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Target className={styles.headerIcon} size={24} />
          <h3>Match Predictor</h3>
          <p>Loading next match...</p>
        </motion.div>
      </motion.div>
    );
  }

  if (!nextMatch) {
    return (
      <motion.div 
        className={styles.predictor}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <Target className={styles.headerIcon} size={24} />
          <h3>Match Predictor</h3>
          <p>No upcoming match found</p>
        </div>
        <div className={styles.info}>
          <p>Check back later for the next Manchester United match!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={styles.predictor}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Target className={styles.headerIcon} size={24} />
        <h3>Match Predictor</h3>
        <p>Predict the next United match result!</p>
      </motion.div>

      <motion.div 
        className={styles.match}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className={styles.date}>
          <CalendarIcon />
          {new Date(nextMatch.utc_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        <div className={styles.teams}>
          <motion.div 
            className={styles.team}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <img 
              src={nextMatch.home_team_crest || 'https://crests.football-data.org/66.png'} 
              alt={nextMatch.home_team}
              className={styles.crest}
              onError={handleImageError}
            />
            <span className={styles.teamName}>{nextMatch.home_team}</span>
          </motion.div>

          <motion.div 
            className={styles.vs}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Swords size={28} />
          </motion.div>

          <motion.div 
            className={styles.team}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <img 
              src={nextMatch.away_team_crest || 'https://crests.football-data.org/55.png'} 
              alt={nextMatch.away_team}
              className={styles.crest}
              onError={handleImageError}
            />
            <span className={styles.teamName}>{nextMatch.away_team.replace(' FC', '')}</span>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form 
            key="form"
            onSubmit={handleSubmit} 
            className={styles.form}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.scoreInputs}>
              <motion.div 
                className={styles.scoreInput}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.button 
                  type="button" 
                  onClick={decrementHome}
                  className={styles.scoreBtn}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minus size={18} />
                </motion.button>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={prediction.homeScore}
                  onChange={handleHomeChange}
                  className={styles.input}
                />
                <motion.button 
                  type="button" 
                  onClick={incrementHome}
                  className={styles.scoreBtn}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus size={18} />
                </motion.button>
              </motion.div>

              <div className={styles.scoreDivider}>
                <Minus size={24} />
              </div>

              <motion.div 
                className={styles.scoreInput}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.button 
                  type="button" 
                  onClick={decrementAway}
                  className={styles.scoreBtn}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minus size={18} />
                </motion.button>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={prediction.awayScore}
                  onChange={handleAwayChange}
                  className={styles.input}
                />
                <motion.button 
                  type="button" 
                  onClick={incrementAway}
                  className={styles.scoreBtn}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus size={18} />
                </motion.button>
              </motion.div>
            </div>

            <motion.button 
              type="submit" 
              className={styles.submitBtn}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Submit Prediction
            </motion.button>
          </motion.form>
        ) : (
          <motion.div 
            key="result"
            className={styles.result}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div 
              className={styles.predictionResult}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className={styles.resultLabel}>Your Prediction</span>
              <motion.div 
                className={styles.resultScore}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <span className={prediction.homeScore > prediction.awayScore ? styles.winner : ''}>
                  {prediction.homeScore}
                </span>
                <span>-</span>
                <span className={prediction.awayScore > prediction.homeScore ? styles.winner : ''}>
                  {prediction.awayScore}
                </span>
              </motion.div>
              <motion.span 
                className={styles.resultMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {prediction.homeScore > prediction.awayScore 
                  ? "Come on United! 🔴" 
                  : prediction.homeScore === prediction.awayScore 
                    ? "A draw would be... something 😅" 
                    : "We can do better! 💪"}
              </motion.span>
            </motion.div>
            <motion.button 
              onClick={handleReset} 
              className={styles.resetBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw size={16} />
              Change Prediction
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className={styles.info}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p>Make your prediction and track your accuracy over time!</p>
      </motion.div>
    </motion.div>
  );
}

function CalendarIcon() {
  return (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ marginRight: '6px', opacity: 0.7 }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
