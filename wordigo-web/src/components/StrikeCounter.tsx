import './StrikeCounter.css';

interface StrikeCounterProps {
  strikes: number;
  currentWord?: number;
  totalWords?: number;
  timeRemaining?: number;
}

export default function StrikeCounter({ strikes, currentWord, totalWords, timeRemaining }: StrikeCounterProps) {
  // Color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining === undefined) return '#333';
    if (timeRemaining <= 15) return '#dc3545'; // Red
    if (timeRemaining <= 30) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };

  return (
    <div className="strike-counter">
      {currentWord !== undefined && (
        <div className="word-progress">
          {totalWords !== undefined
            ? `Word ${currentWord} / ${totalWords}`
            : `Word ${currentWord}`
          }
        </div>
      )}
      {timeRemaining !== undefined && (
        <div className="timer-display" style={{ color: getTimerColor() }}>
          {timeRemaining}s
        </div>
      )}
      <div className="strike-section">
        <div className="strike-text">
          Strikes: {strikes}/3
        </div>
        <div className="strike-dots">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`strike-dot ${index < strikes ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
