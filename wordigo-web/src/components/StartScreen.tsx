import React from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onSelectMode: (mode: 'endless' | 'sprint' | 'categories' | 'daily') => void;
  onMenuClick: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onSelectMode,
  onMenuClick
}) => {
  return (
    <div className="start-screen">
      <header className="start-screen-header">
        <div className="header-spacer"></div>

        <h1 className="app-title">de·find·able</h1>

        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>
      </header>

      <main className="start-screen-content">
        <div className="game-modes">
          <button
            className="game-mode-card"
            onClick={() => onSelectMode('endless')}
          >
            <div className="mode-content dictionary-style">
              <span className="mode-word">end·less</span>
              <span className="mode-pronunciation">/ ˈendləs /</span>
              <span className="mode-pos">adjective</span>
              <span className="mode-metadata">[MODE - Leisurely; DIFFICULTY - Player choice, Adaptive]</span>
              <span className="mode-definition">: play continuously with no time limit; three strikes and you're out</span>
            </div>
          </button>

          <button
            className="game-mode-card game-mode-disabled"
            disabled
          >
            <div className="mode-content dictionary-style">
              <span className="mode-word">sprint</span>
              <span className="mode-pronunciation">/ sprɪnt /</span>
              <span className="mode-pos">noun</span>
              <span className="mode-metadata">[MODE - Timed; DURATION - Player choice; DIFFICULTY - Player choice, Adaptive]</span>
              <span className="mode-definition">: race against the clock; three strikes and you're out</span>
            </div>
          </button>
        </div>

        <button
          className="daily-challenge daily-challenge-disabled"
          disabled
        >
          <div className="mode-content dictionary-style">
            <span className="mode-word">dai·ly chal·lenge</span>
            <span className="mode-pronunciation">/ ˈdeɪli ˈtʃælɪndʒ /</span>
            <span className="mode-pos">noun phrase</span>
            <span className="mode-metadata">[MODE - Timed; DURATION - 2 minutes, COMPETITION - The entire planet]</span>
            <span className="mode-definition">: a unique game refreshed every day; compete with players worldwide for the best score</span>
          </div>
        </button>
      </main>
    </div>
  );
};

export default StartScreen;
