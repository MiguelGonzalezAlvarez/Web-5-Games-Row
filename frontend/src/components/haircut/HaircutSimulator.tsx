import { useState } from 'react';
import styles from './HaircutSimulator.module.css';

interface HairStyleProps {
  days: number;
}

function HairVisual({ days }: HairStyleProps) {
  const hairLength = Math.min(days / 500, 1);
  const hairHeight = 50 + hairLength * 150;
  const hairWidth = 120 + hairLength * 60;
  
  return (
    <div className={styles.hairVisual}>
      <svg viewBox="0 0 200 250" className={styles.hairSvg}>
        <defs>
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A3728" />
            <stop offset="100%" stopColor="#2D1F14" />
          </linearGradient>
        </defs>
        
        <ellipse cx="100" cy="60" rx="45" ry="50" fill="#E8B89D" />
        
        <ellipse cx="100" cy="50" rx="40" ry="45" fill="#E8B89D" />
        
        <circle cx="80" cy="50" r="6" fill="#3D2817" />
        <circle cx="120" cy="50" r="6" fill="#3D2817" />
        
        <ellipse cx="80" cy="48" rx="3" ry="2" fill="#FFF" />
        <ellipse cx="120" cy="48" rx="3" ry="2" fill="#FFF" />
        
        <path 
          d="M 75 65 Q 100 75 125 65" 
          stroke="#C9977D" 
          strokeWidth="2" 
          fill="none" 
        />
        
        <path 
          d={`
            M ${100 - hairWidth/2} ${60}
            Q ${100 - hairWidth/2 - 20} ${60 - hairHeight/2}
               ${100 - hairWidth/3} ${60 - hairHeight}
            Q 100 ${60 - hairHeight - 20}
               ${100 + hairWidth/3} ${60 - hairHeight}
            Q ${100 + hairWidth/2 + 20} ${60 - hairHeight/2}
               ${100 + hairWidth/2} ${60}
          `}
          fill="url(#hairGradient)"
          style={{
            opacity: 0.7 + hairLength * 0.3,
          }}
        />
        
        {[...Array(Math.floor(hairLength * 8) + 3)].map((_, i) => {
          const angle = -60 + (120 / (Math.floor(hairLength * 8) + 2)) * i;
          const rad = (angle * Math.PI) / 180;
          const startX = 100 + Math.cos(rad) * 40;
          const startY = 60 - Math.sin(rad) * 30;
          const endX = 100 + Math.cos(rad) * (80 + hairLength * 80);
          const endY = 60 - Math.sin(rad) * (60 + hairLength * 80);
          
          return (
            <path
              key={i}
              d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${(startY + endY) / 2 + 20} ${endX} ${endY}`}
              stroke="url(#hairGradient)"
              strokeWidth={3 + hairLength * 4}
              fill="none"
              strokeLinecap="round"
              style={{
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function HaircutSimulator() {
  const [days, setDays] = useState(500);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDays(Number(e.target.value));
  };

  const animateToDay = (targetDay: number) => {
    setIsAnimating(true);
    let current = days;
    const step = targetDay > current ? 10 : -10;
    
    const interval = setInterval(() => {
      current += step;
      if ((step > 0 && current >= targetDay) || (step < 0 && current <= targetDay)) {
        setDays(targetDay);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDays(current);
      }
    }, 20);
  };

  return (
    <div className={styles.simulator}>
      <div className={styles.header}>
        <h2>✂️ Haircut Simulator</h2>
        <p>See how Frank's hair has grown over time</p>
      </div>

      <div className={styles.visual}>
        <HairVisual days={days} />
      </div>

      <div className={styles.controls}>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max="600"
            value={days}
            onChange={handleSliderChange}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}>
            <span>Day 0</span>
            <span>Day 300</span>
            <span>Day 600</span>
          </div>
        </div>

        <div className={styles.dayInput}>
          <label>Or enter a specific day:</label>
          <div className={styles.inputGroup}>
            <input
              type="number"
              min="0"
              max="1000"
              value={days}
              onChange={handleSliderChange}
              className={styles.numberInput}
            />
            <button 
              onClick={() => animateToDay(500)}
              className={styles.presetBtn}
            >
              500 (Current)
            </button>
          </div>
        </div>

        <div className={styles.presetButtons}>
          <button onClick={() => animateToDay(100)} className={styles.presetBtn}>
            100 days
          </button>
          <button onClick={() => animateToDay(250)} className={styles.presetBtn}>
            250 days
          </button>
          <button onClick={() => animateToDay(400)} className={styles.presetBtn}>
            400 days
          </button>
          <button onClick={() => animateToDay(500)} className={styles.presetBtn}>
            500 days
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{days}</span>
          <span className={styles.statLabel}>Days waiting</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{(days / 365).toFixed(1)}</span>
          <span className={styles.statLabel}>Years</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{Math.floor(days / 7)}</span>
          <span className={styles.statLabel}>Weeks</span>
        </div>
      </div>

      {days >= 500 && (
        <div className={styles.message}>
          <p>Over 500 days! Frank's hair has grown tremendously. Will the haircut ever happen?</p>
        </div>
      )}
    </div>
  );
}
