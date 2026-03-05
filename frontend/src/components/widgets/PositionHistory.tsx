import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import styles from './PositionHistory.module.css';

interface PositionHistoryProps {
  positions: Array<{
    matchday: number;
    position: number;
    points: number;
    change?: 'up' | 'down' | 'same';
  }>;
  teamName?: string;
  currentPosition?: number;
}

export default function PositionHistory({ 
  positions, 
  teamName = 'Manchester United',
  currentPosition 
}: PositionHistoryProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    }
  };

  const getPositionClass = (pos: number) => {
    if (pos <= 4) return styles.championsLeague;
    if (pos <= 6) return styles.europaLeague;
    if (pos >= 18) return styles.relegation;
    return styles.midTable;
  };

  const getTrendIcon = (change?: 'up' | 'down' | 'same') => {
    switch (change) {
      case 'up': return <TrendingUp size={14} className={styles.trendUp} />;
      case 'down': return <TrendingDown size={14} className={styles.trendDown} />;
      default: return <Minus size={14} className={styles.trendSame} />;
    }
  };

  const maxPosition = Math.max(...positions.map(p => p.position));
  const minPosition = Math.min(...positions.map(p => p.position));
  const positionRange = maxPosition - minPosition;

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Target size={18} />
          Position History
        </h3>
        {currentPosition && (
          <span className={`${styles.currentPosition} ${getPositionClass(currentPosition)}`}>
            Current: #{currentPosition}
          </span>
        )}
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.yAxis}>
          <span>1</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
        </div>
        
        <div className={styles.chart}>
          <svg viewBox="0 0 300 120" className={styles.svg}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {positions.map((pos, i) => {
              const x = (i / (positions.length - 1)) * 280 + 10;
              const y = ((pos.position - 1) / 19) * 100 + 10;
              
              return (
                <g key={pos.matchday}>
                  {i > 0 && (
                    <>
                      <line
                        x1={( (i-1) / (positions.length - 1)) * 280 + 10}
                        y1={((positions[i-1].position - 1) / 19) * 100 + 10}
                        x2={x}
                        y2={y}
                        stroke="var(--theme-primary)"
                        strokeWidth="2"
                        strokeOpacity="0.6"
                      />
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="var(--theme-primary)"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot + ' ' + styles.championsLeagueDot} />
          <span>Champions League (1-4)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot + ' ' + styles.europaLeagueDot} />
          <span>Europa League (5-6)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot + ' ' + styles.relegationDot} />
          <span>Relegation Zone (18-20)</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Best Position</span>
          <span className={styles.statValue + ' ' + styles.best}> #{minPosition}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Worst Position</span>
          <span className={styles.statValue + ' ' + styles.worst}>#{maxPosition}</span>
        </div>
      </div>
    </motion.div>
  );
}
