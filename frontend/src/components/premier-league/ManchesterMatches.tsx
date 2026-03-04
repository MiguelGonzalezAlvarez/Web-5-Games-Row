import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import type { Match } from '../../utils/types';
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
    return <div className={styles.container}>Loading matches...</div>;
  }

  if (error) {
    return <div className={styles.container}>{error}</div>;
  }

  const getResultClass = (match: Match) => {
    const muIsHome = isManchesterUnited(match.home_team);
    const muWon = muIsHome ? match.home_score > match.away_score : match.away_score > match.home_score;
    const muDrew = match.home_score === match.away_score;
    
    if (muWon) return styles.win;
    if (muDrew) return styles.draw;
    return styles.loss;
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
      <div className={styles.header}>
        <h3>Recent Matches</h3>
        <span className={styles.badge}>MUFC</span>
      </div>
      
      <div className={styles.matches}>
        {matches.map((match) => (
          <div key={match.match_id} className={`${styles.match} ${getResultClass(match)}`}>
            <div className={styles.date}>{formatDate(match.utc_date)}</div>
            
            <div className={styles.teams}>
              <div className={`${styles.team} ${isManchesterUnited(match.home_team) ? styles.muTeam : ''}`}>
                <img 
                  src={match.home_team_crest || ''} 
                  alt={match.home_team} 
                  className={styles.crest}
                  onError={handleImageError}
                />
                <span>{match.home_team_short || match.home_team}</span>
              </div>
              
              <div className={styles.score}>
                <span>{match.home_score ?? 0}</span>
                <span>-</span>
                <span>{match.away_score ?? 0}</span>
              </div>
              
              <div className={`${styles.team} ${isManchesterUnited(match.away_team) ? styles.muTeam : ''}`}>
                <img 
                  src={match.away_team_crest || ''} 
                  alt={match.away_team} 
                  className={styles.crest}
                  onError={handleImageError}
                />
                <span>{match.away_team_short || match.away_team}</span>
              </div>
            </div>
            
            <div className={styles.result}>
              {isManchesterUnited(match.home_team) 
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
