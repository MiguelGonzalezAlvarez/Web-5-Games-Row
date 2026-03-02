import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import type { Match } from '../../utils/types';
import styles from './ManchesterMatches.module.css';

export default function ManchesterMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  if (loading) {
    return <div className={styles.container}>Loading matches...</div>;
  }

  if (error) {
    return <div className={styles.container}>{error}</div>;
  }

  const getResultClass = (match: Match) => {
    const muIsHome = match.home_team === 'Manchester United';
    const muWon = muIsHome ? match.home_score > match.away_score : match.away_score > match.home_score;
    const muDrew = match.home_score === match.away_score;
    
    if (muWon) return styles.win;
    if (muDrew) return styles.draw;
    return styles.loss;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Recent Matches</h3>
        <span className={styles.badge}>MUFC</span>
      </div>
      
      <div className={styles.matches}>
        {matches.map((match) => (
          <div key={match.match_id} className={`${styles.match} ${getResultClass(match)}`}>
            <div className={styles.date}>{formatDate(match.utc_date)}</div>
            
            <div className={styles.teams}>
              <div className={`${styles.team} ${match.home_team === 'Manchester United' ? styles.muTeam : ''}`}>
                <img src={match.home_team_crest} alt={match.home_team} className={styles.crest} />
                <span>{match.home_team_short}</span>
              </div>
              
              <div className={styles.score}>
                <span>{match.home_score}</span>
                <span>-</span>
                <span>{match.away_score}</span>
              </div>
              
              <div className={`${styles.team} ${match.away_team === 'Manchester United' ? styles.muTeam : ''}`}>
                <img src={match.away_team_crest} alt={match.away_team} className={styles.crest} />
                <span>{match.away_team_short}</span>
              </div>
            </div>
            
            <div className={styles.result}>
              {match.home_team === 'Manchester United' 
                ? (match.home_score > match.away_score ? 'W' : match.home_score < match.away_score ? 'L' : 'D')
                : (match.away_score > match.home_score ? 'W' : match.away_score < match.home_score ? 'L' : 'D')
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
