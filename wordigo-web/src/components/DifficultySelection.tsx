import { useState, useEffect } from 'react';
import type { DifficultyPreset } from '../types';
import { getDifficultyPresets } from '../services/api';
import './DifficultySelection.css';

interface DifficultySelectionProps {
  onSelectDifficulty: (difficulty: string, timerEnabled: boolean) => void;
}

function DifficultySelection({ onSelectDifficulty }: DifficultySelectionProps) {
  const [presets, setPresets] = useState<DifficultyPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('wordigo_timer_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const data = await getDifficultyPresets();
        setPresets(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load difficulty options');
        setLoading(false);
      }
    };

    loadPresets();
  }, []);

  const handleTimerToggle = (enabled: boolean) => {
    setTimerEnabled(enabled);
    localStorage.setItem('wordigo_timer_enabled', JSON.stringify(enabled));
  };

  if (loading) {
    return (
      <div className="difficulty-selection">
        <h1 className="game-title">defindable</h1>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="difficulty-selection">
        <h1 className="game-title">defindable</h1>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="difficulty-selection">
      <h1 className="game-title">defindable</h1>

      <div className="timer-toggle-container">
        <label className="timer-toggle-label">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => handleTimerToggle(e.target.checked)}
            className="timer-toggle-checkbox"
          />
          <span className="timer-toggle-text">
            Use Timer {timerEnabled ? '✓' : ''}
          </span>
        </label>
      </div>

      <div className="difficulty-options">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`difficulty-button difficulty-${preset.name}`}
            onClick={() => onSelectDifficulty(preset.name, timerEnabled)}
          >
            <div className="difficulty-name">{preset.displayName}</div>
            <div className="difficulty-details">
              {preset.wordCount} words{timerEnabled ? ` • ${preset.timeLimit}s` : ''}
            </div>
            {preset.description && (
              <div className="difficulty-description">{preset.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DifficultySelection;
