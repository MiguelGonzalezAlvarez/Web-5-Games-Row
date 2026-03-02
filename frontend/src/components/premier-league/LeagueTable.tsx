import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import type { Standing } from '../../utils/types';
import styles from './LeagueTable.module.css';

const MANCHESTER_UNITED_ID = 66;

export default function LeagueTable() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const data = await api.getStandings();
        setStandings(data);
      } catch (err) {
        setError('Failed to load standings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
    const interval = setInterval(fetchStandings, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.table}>
        <div className={styles.loading}>Loading standings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.table}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <h3>Premier League Table</h3>
        <span className={styles.updateBadge}>Live</span>
      </div>
      
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
            {standings.map((team) => (
              <tr 
                key={team.team_id}
                className={team.team_id === MANCHESTER_UNITED_ID ? styles.highlight : ''}
              >
                <td className={styles.position}>{team.position}</td>
                <td className={styles.team}>
                  <img 
                    src={team.team_crest} 
                    alt={team.team_name}
                    className={styles.crest}
                  />
                  <span className={styles.teamName}>{team.team_short_name}</span>
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {standings.find(s => s.team_id === MANCHESTER_UNITED_ID) && (
        <div className={styles.muHighlight}>
          <span className={styles.muEmoji}>🔴</span>
          <span>Manchester United is highlighted in red</span>
        </div>
      )}
    </div>
  );
}
