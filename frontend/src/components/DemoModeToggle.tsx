import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import styles from './DemoModeToggle.module.css';

export default function DemoModeToggle() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    checkDemoMode();
  }, []);

  const checkDemoMode = async () => {
    try {
      const status = await api.getDemoModeStatus();
      setIsDemoMode(status.demo_mode);
    } catch (err) {
      console.error('Failed to check demo mode:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDemoMode = async () => {
    setSwitching(true);
    try {
      const newState = !isDemoMode;
      await api.setDemoMode(newState);
      setIsDemoMode(newState);
      window.location.reload();
    } catch (err) {
      console.error('Failed to toggle demo mode:', err);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button
        className={`${styles.toggle} ${isDemoMode ? styles.active : ''}`}
        onClick={toggleDemoMode}
        disabled={switching}
      >
        <span className={styles.icon}>{isDemoMode ? '🎮' : '⚽'}</span>
        <span className={styles.label}>
          {isDemoMode ? 'Demo Mode ON' : 'Live Data'}
        </span>
        <span className={styles.status}>
          {isDemoMode ? 'Using simulated data' : 'Using real API'}
        </span>
      </button>
    </div>
  );
}
