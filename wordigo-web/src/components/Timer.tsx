import { useEffect } from 'react';
import './Timer.css';

interface TimerProps {
  timeRemaining: number;
  isRunning: boolean;
  onTick: (time: number) => void;
  onTimeout: () => void;
}

export default function Timer({ timeRemaining, isRunning, onTick, onTimeout }: TimerProps) {
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newTime = timeRemaining - 1;

      if (newTime <= 0) {
        onTimeout();
        return;
      }

      onTick(newTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isRunning, onTick, onTimeout]);

  // Color based on remaining time (DEF_NUM_CHAR_BAND_MULTIPLIER = 15)
  const getTimerColor = () => {
    if (timeRemaining <= 15) return '#dc3545'; // Red
    if (timeRemaining <= 30) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };

  return (
    <div className="timer-container">
      <div className="timer-time" style={{ color: getTimerColor() }}>
        {timeRemaining}s
      </div>
    </div>
  );
}
