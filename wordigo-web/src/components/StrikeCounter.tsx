import './StrikeCounter.css';

interface StrikeCounterProps {
  strikes: number;
  currentWord?: number;
  totalWords?: number;
  timeRemaining?: number;
  showMetadata?: boolean;
  onToggleMetadata?: () => void;
}

export default function StrikeCounter({ strikes, currentWord, totalWords, showMetadata, onToggleMetadata }: StrikeCounterProps) {
  return (
    <div className="strike-counter">
      {currentWord !== undefined && (
        <div className="word-progress">
          {totalWords !== undefined
            ? `word ${currentWord} / ${totalWords}`
            : `word ${currentWord}`
          }
        </div>
      )}
      {onToggleMetadata && (
        <button
          onClick={onToggleMetadata}
          className={`metadata-toggle-button ${showMetadata ? 'active' : ''}`}
          disabled={showMetadata}
        >
          {showMetadata ? 'no points' : 'show answer'}
        </button>
      )}
      <div className="strike-section">
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
