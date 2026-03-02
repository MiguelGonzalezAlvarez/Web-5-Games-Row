import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
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

  if (loading) {
    return (
      <div className={styles.predictor}>
        <div className={styles.header}>
          <h3>🎯 Match Predictor</h3>
          <p>Loading next match...</p>
        </div>
      </div>
    );
  }

  if (!nextMatch) {
    return (
      <div className={styles.predictor}>
        <div className={styles.header}>
          <h3>🎯 Match Predictor</h3>
          <p>No upcoming match found</p>
        </div>
        <div className={styles.info}>
          <p>Check back later for the next Manchester United match!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.predictor}>
      <div className={styles.header}>
        <h3>🎯 Match Predictor</h3>
        <p>Predict the next United match result!</p>
      </div>

      <div className={styles.match}>
        <div className={styles.date}>
          {new Date(nextMatch.utc_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        <div className={styles.teams}>
          <div className={styles.team}>
            <img 
              src={nextMatch.home_team_crest || 'https://crests.football-data.org/66.png'} 
              alt={nextMatch.home_team}
              className={styles.crest}
            />
            <span className={styles.teamName}>Man United</span>
          </div>

          <div className={styles.vs}>VS</div>

          <div className={styles.team}>
            <img 
              src={nextMatch.away_team_crest || 'https://crests.football-data.org/55.png'} 
              alt={nextMatch.away_team}
              className={styles.crest}
            />
            <span className={styles.teamName}>{nextMatch.away_team.replace(' FC', '')}</span>
          </div>
        </div>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.scoreInputs}>
            <div className={styles.scoreInput}>
              <button 
                type="button" 
                onClick={decrementHome}
                className={styles.scoreBtn}
              >-</button>
              <input
                type="number"
                min="0"
                max="10"
                value={prediction.homeScore}
                onChange={handleHomeChange}
                className={styles.input}
              />
              <button 
                type="button" 
                onClick={incrementHome}
                className={styles.scoreBtn}
              >+</button>
            </div>

            <div className={styles.scoreDivider}>-</div>

            <div className={styles.scoreInput}>
              <button 
                type="button" 
                onClick={decrementAway}
                className={styles.scoreBtn}
              >-</button>
              <input
                type="number"
                min="0"
                max="10"
                value={prediction.awayScore}
                onChange={handleAwayChange}
                className={styles.input}
              />
              <button 
                type="button" 
                onClick={incrementAway}
                className={styles.scoreBtn}
              >+</button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Submit Prediction
          </button>
        </form>
      ) : (
        <div className={styles.result}>
          <div className={styles.predictionResult}>
            <span className={styles.resultLabel}>Your Prediction</span>
            <div className={styles.resultScore}>
              <span className={prediction.homeScore > prediction.awayScore ? styles.winner : ''}>
                {prediction.homeScore}
              </span>
              <span>-</span>
              <span className={prediction.awayScore > prediction.homeScore ? styles.winner : ''}>
                {prediction.awayScore}
              </span>
            </div>
            <span className={styles.resultMessage}>
              {prediction.homeScore > prediction.awayScore 
                ? "Come on United! 🔴" 
                : prediction.homeScore === prediction.awayScore 
                  ? "A draw would be... something 😅" 
                  : "We can do better! 💪"}
            </span>
          </div>
          <button onClick={handleReset} className={styles.resetBtn}>
            Change Prediction
          </button>
        </div>
      )}

      <div className={styles.info}>
        <p>Make your prediction and track your accuracy over time!</p>
      </div>
    </div>
  );
}
