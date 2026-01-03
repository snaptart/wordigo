import React from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onSelectMode: (mode: 'endless' | 'sprint' | 'categories' | 'daily') => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onSelectMode,
  onMenuClick,
  onProfileClick
}) => {
  return (
    <div className="start-screen">
      <header className="start-screen-header">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>

        <h1 className="app-title">defindable</h1>

        <button
          className="profile-button"
          onClick={onProfileClick}
          aria-label="Profile"
        >
          <div className="profile-icon"></div>
        </button>
      </header>

      <main className="start-screen-content">
        <div className="game-modes">
          <button
            className="game-mode-card"
            onClick={() => onSelectMode('endless')}
          >
            <span className="mode-title">Endless</span>
          </button>

          <button
            className="game-mode-card game-mode-disabled"
            disabled
          >
            <span className="mode-title">Sprint</span>
          </button>

          <button
            className="game-mode-card game-mode-disabled"
            disabled
          >
            <span className="mode-title">Categories</span>
          </button>
        </div>

        <button
          className="daily-challenge daily-challenge-disabled"
          disabled
        >
          <span className="daily-title">Daily Challenge</span>
        </button>
      </main>
    </div>
  );
};

export default StartScreen;
