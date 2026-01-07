import './StrikeCounter.css';

interface StrikeCounterProps {
  strikes: number;
  currentWord?: number;
  totalWords?: number;
  timeRemaining?: number;
  showMetadata?: boolean;
  onToggleMetadata?: () => void;
  onWinnow?: () => void;
  winnowDisabled?: boolean;
}

export default function StrikeCounter({ strikes, currentWord, totalWords, showMetadata, onToggleMetadata, onWinnow, winnowDisabled }: StrikeCounterProps) {
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
      <div className="button-group">
        {onToggleMetadata && (
          <button
            onClick={onToggleMetadata}
            className={`metadata-toggle-button ${showMetadata ? 'active' : ''}`}
            disabled={showMetadata}
          >
            {showMetadata ? 'ineligible' : 'divulge'}
          </button>
        )}
        {onWinnow && (
          <button
            className="winnow-button"
            onClick={onWinnow}
            disabled={winnowDisabled}
          >
            winnow
          </button>
        )}
      </div>
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
