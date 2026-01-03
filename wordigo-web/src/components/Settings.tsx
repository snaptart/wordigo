import React, { useState, useEffect } from 'react';
import './Settings.css';
import PageHeader from './PageHeader';
import {
  getUserPreferences,
  updateUserPreferences,
  getAvailableCategories,
  type UserPreferences,
  type Category
} from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
}

interface SettingsProps {
  user: User | null;
  onBack: () => void;
  onMenuClick: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onBack, onMenuClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [defaultDifficulty, setDefaultDifficulty] = useState<UserPreferences['defaultDifficulty']>('adaptive');
  const [wordLengthFilter, setWordLengthFilter] = useState<UserPreferences['wordLengthFilter']>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState(true);

  // Load preferences and categories on mount
  useEffect(() => {
    if (user) {
      loadPreferencesAndCategories();
    }
  }, [user]);

  const loadPreferencesAndCategories = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const [prefsData, catsData] = await Promise.all([
        getUserPreferences(user.id),
        getAvailableCategories()
      ]);

      setCategories(catsData);

      // Set form state from loaded preferences
      setDefaultDifficulty(prefsData.defaultDifficulty);
      setWordLengthFilter(prefsData.wordLengthFilter);
      setSelectedCategories(prefsData.categoryPreferences || []);
      setSoundEnabled(prefsData.soundEnabled);
      setHapticFeedbackEnabled(prefsData.hapticFeedbackEnabled);
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedPreferences: Partial<UserPreferences> = {
        defaultDifficulty,
        wordLengthFilter,
        allowObscureWords: true, // Always set to true, already accounted for in difficulty band
        categoryPreferences: selectedCategories.length > 0 ? selectedCategories : null,
        soundEnabled,
        hapticFeedbackEnabled
      };

      await updateUserPreferences(user.id, updatedPreferences);
      setSuccess('Settings saved successfully!');

      // Auto-close success message after 2 seconds
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setDefaultDifficulty('adaptive');
    setWordLengthFilter('all');
    setSelectedCategories([]);
    setSoundEnabled(true);
    setHapticFeedbackEnabled(true);
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(c => c !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="settings-page">
      <PageHeader title="Settings" onBack={onBack} onMenuClick={onMenuClick} />

      <main className="settings-main">
        {error && (
          <div className="message error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="settings-content">
            <div className="loading-state">Loading preferences...</div>
          </div>
        ) : (
          <div className="settings-content">
            {/* Difficulty Settings */}
            <div className="settings-section">
              <h2 className="section-title">Difficulty Settings</h2>

              <div className="form-group">
                <label className="form-label">Default Difficulty</label>
                <div className="radio-group">
                  {[
                    { value: 'easy', label: 'Easy', desc: 'Easiest words' },
                    { value: 'less_easy', label: 'Less Easy', desc: 'Slightly harder' },
                    { value: 'medium', label: 'Medium', desc: 'Moderate challenge' },
                    { value: 'hard', label: 'Hard', desc: 'Difficult words' },
                    { value: 'hardest', label: 'Hardest', desc: 'Most challenging' },
                    { value: 'adaptive', label: 'Adaptive', desc: 'Adjusts to your skill' }
                  ].map(option => (
                    <label key={option.value} className="radio-option">
                      <input
                        type="radio"
                        name="difficulty"
                        value={option.value}
                        checked={defaultDifficulty === option.value}
                        onChange={(e) => setDefaultDifficulty(e.target.value as UserPreferences['defaultDifficulty'])}
                      />
                      <div className="radio-label">
                        <span className="radio-label-main">{option.label}</span>
                        <span className="radio-label-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Word Length Filter</label>
                <div className="radio-group-inline">
                  {[
                    { value: 'short', label: 'Short', desc: '≤6 letters' },
                    { value: 'medium', label: 'Medium', desc: '7-12 letters' },
                    { value: 'long', label: 'Long', desc: '≥13 letters' },
                    { value: 'all', label: 'All Lengths', desc: 'No filter' }
                  ].map(option => (
                    <label key={option.value} className="radio-option-inline">
                      <input
                        type="radio"
                        name="wordLength"
                        value={option.value}
                        checked={wordLengthFilter === option.value}
                        onChange={(e) => setWordLengthFilter(e.target.value as UserPreferences['wordLengthFilter'])}
                      />
                      <div className="radio-label">
                        <span className="radio-label-main">{option.label}</span>
                        <span className="radio-label-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Preferences */}
            <div className="settings-section">
              <h2 className="section-title">Word Categories</h2>
              <p className="section-description">
                Select specific word categories to focus on. Leave empty to include all categories.
              </p>

              <div className="category-grid">
                {categories.map(category => {
                  const categoryKey = category.groupKey || category.name || '';
                  return (
                    <label key={category.id} className="category-chip">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(categoryKey)}
                        onChange={() => toggleCategory(categoryKey)}
                      />
                      <span className="category-chip-label">
                        {category.icon && <span className="category-icon">{category.icon}</span>}
                        {category.displayName}
                      </span>
                    </label>
                  );
                })}
              </div>

              {selectedCategories.length > 0 && (
                <button
                  className="clear-categories-button"
                  onClick={() => setSelectedCategories([])}
                >
                  Clear All Categories
                </button>
              )}
            </div>

            {/* UI Preferences */}
            <div className="settings-section">
              <h2 className="section-title">Interface</h2>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    className="toggle-checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    <span className="toggle-text-main">Sound Effects</span>
                    <span className="toggle-text-desc">Play audio feedback during gameplay</span>
                  </span>
                </label>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    className="toggle-checkbox"
                    checked={hapticFeedbackEnabled}
                    onChange={(e) => setHapticFeedbackEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    <span className="toggle-text-main">Haptic Feedback</span>
                    <span className="toggle-text-desc">Vibration feedback on mobile devices</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="settings-actions">
              <button
                className="secondary-button"
                onClick={handleResetToDefaults}
                disabled={isSaving}
              >
                Reset to Defaults
              </button>
              <button
                className="primary-button"
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
