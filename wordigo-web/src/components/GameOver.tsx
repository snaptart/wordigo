import './GameOver.css';

interface GameOverProps {
  onRestart: () => void;
}

export default function GameOver({ onRestart }: GameOverProps) {
  return (
    <div className="game-over-container">
      <div className="game-over-content">
        <h1 className="game-over-title">XXX</h1>
        <p className="game-over-subtitle">Game Over!</p>
        <button className="restart-button" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}
