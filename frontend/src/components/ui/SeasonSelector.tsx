import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import styles from './SeasonSelector.module.css';

interface SeasonSelectorProps {
  availableSeasons?: string[];
  currentSeason?: string;
  onSeasonChange?: (season: string) => void;
  disabled?: boolean;
}

export default function SeasonSelector({ 
  availableSeasons = [], 
  currentSeason = '',
  onSeasonChange,
  disabled = false 
}: SeasonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!availableSeasons || availableSeasons.length === 0 || disabled) {
    return null;
  }

  const handleSelect = (season: string) => {
    if (onSeasonChange) {
      onSeasonChange(season);
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Calendar size={16} />
        <span className={styles.currentSeason}>{currentSeason}</span>
        <ChevronDown 
          size={14} 
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.label}>Select Season</div>
            {availableSeasons.map((season) => (
              <button
                key={season}
                className={`${styles.option} ${
                  season === currentSeason ? styles.active : ''
                }`}
                onClick={() => handleSelect(season)}
              >
                <span>{season}</span>
                {season === currentSeason && (
                  <Check size={14} className={styles.checkIcon} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
