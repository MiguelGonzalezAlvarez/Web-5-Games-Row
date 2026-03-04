import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import type { Standing } from '../../utils/types';
import styles from './LeagueTable.module.css';

const MANCHESTER_UNITED_NAMES = ['Manchester United', 'Man United'];

export default function LeagueTable() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    async function fetchStandings() {
      try {
        const [data, providersData] = await Promise.all([
          api.getStandings(),
          api.getProviders()
        ]);
        setStandings(data);
        setProvider(providersData.current_provider);
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
        <div className={styles.header}>
          <h3>Premier League Table</h3>
          <div className={styles.headerRight}>
            <span className={styles.updateBadge}>Loading</span>
          </div>
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
              {[...Array(10)].map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  <td><div className={styles.skeleton} style={{width: 24}} /></td>
                  <td>
                    <div className={styles.skeletonTeam}>
                      <div className={styles.skeleton} style={{width: 32, height: 32, borderRadius: '50%'}} />
                      <div className={styles.skeleton} style={{width: 100}} />
                    </div>
                  </td>
                  <td><div className={styles.skeleton} style={{width: 20}} /></td>
                  <td><div className={styles.skeleton} style={{width: 20}} /></td>
                  <td><div className={styles.skeleton} style={{width: 20}} /></td>
                  <td><div className={styles.skeleton} style={{width: 20}} /></td>
                  <td><div className={styles.skeleton} style={{width: 30}} /></td>
                  <td><div className={styles.skeleton} style={{width: 32}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

  const muTeam = standings.find(isManchesterUnited);
  const showStats = standings.some(hasStats);

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <h3>Premier League Table</h3>
        <div className={styles.headerRight}>
          {!showStats && (
            <span className={styles.infoBadge}>Teams Only</span>
          )}
          <span className={styles.updateBadge}>Live</span>
        </div>
      </div>
      
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
            {standings.map((team) => {
              const isMU = isManchesterUnited(team);
              return (
                <tr 
                  key={team.team_id}
                  className={isMU ? styles.highlight : ''}
                >
                  <td className={styles.position}>{team.position}</td>
                  <td className={styles.team}>
                    <img 
                      src={team.team_crest || '/placeholder-badge.png'} 
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {muTeam && (
        <div className={styles.muHighlight}>
          <span className={styles.muEmoji}>🔴</span>
          <span>Manchester United is highlighted in red</span>
        </div>
      )}
    </div>
  );
}
