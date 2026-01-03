import type { CompleteGameResponse } from '../types';
import './GameResults.css';

interface GameResultsProps {
  results: CompleteGameResponse;
  onPlayAgain: () => void;
  strikes?: number;
  timerEnabled?: boolean;
}

function GameResults({ results, onPlayAgain, strikes, timerEnabled = true }: GameResultsProps) {
  const accuracy = results.totalWords > 0
    ? Math.round((results.correctWords / results.totalWords) * 100)
    : 0;

  const isStrikeOut = strikes !== undefined && strikes >= 3;

  return (
    <div className="game-results">
      <div className="results-container">
        <h1 className="results-title">Game Complete!</h1>

        {!timerEnabled && (
          <div className="game-mode-badge">
            <span className="badge-text">Untimed Mode</span>
          </div>
        )}

        <div className="final-score">
          <div className="score-label">Final Score</div>
          <div className="score-value">{results.finalScore}</div>
        </div>

        <div className="results-breakdown">
          <div className="breakdown-item">
            <div className="breakdown-label">Words Correct</div>
            <div className="breakdown-value">
              {results.correctWords} / {results.totalWords}
            </div>
            <div className="breakdown-points">+{results.wordPoints} pts</div>
          </div>

          {timerEnabled && (
            <>
              <div className="breakdown-divider"></div>

              <div className="breakdown-item">
                <div className="breakdown-label">Time Bonus</div>
                <div className="breakdown-value">
                  {isStrikeOut ? '3 strikes; forfeited' : `${results.timeBonus}s remaining`}
                </div>
                <div className="breakdown-points">+{results.timeBonus} pts</div>
              </div>
            </>
          )}

          <div className="breakdown-divider"></div>

          <div className="breakdown-item">
            <div className="breakdown-label">Accuracy</div>
            <div className="breakdown-value">{accuracy}%</div>
          </div>
        </div>

        <button className="play-again-button" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameResults;
