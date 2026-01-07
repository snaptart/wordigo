import React, { useState, useEffect } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
}

interface LandingWordData {
  wrongDefinition: string;
  defOrder: number; // 0 = correct first, 1 = wrong first
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [wordData, setWordData] = useState<LandingWordData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Hardcoded data for "definable"
  const DEFINABLE_WORD = {
    word: 'de·find·able',
    ipa: '/dɪˈfaɪndəbəɫ/',
    posName: 'noun',
    correctDefinition: 'a highly addictive online dictionary game'
  };

  useEffect(() => {
    fetchLandingWord();
  }, []);

  const fetchLandingWord = async (isRefresh = false) => {
    try {
      // Only show full loading on initial load, not on refresh
      if (isRefresh) {
        setLoadingDefinition(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/landing-word`);
      const result = await response.json();

      if (result.success && result.data) {
        setWordData({
          wrongDefinition: result.data.wrongDefinition,
          defOrder: Math.floor(Math.random() * 2) // Randomize order
        });
      } else {
        setError('Failed to load word');
      }
    } catch (err) {
      console.error('Error fetching landing word:', err);
      setError('Failed to load word');
    } finally {
      setLoading(false);
      setLoadingDefinition(false);
    }
  };

  const handleDefinitionClick = (index: number) => {
    if (showFeedback) return; // Already answered

    setSelectedIndex(index);
    setShowFeedback(true);

    // If correct answer, wait a moment then navigate to start
    const isCorrect = wordData && index === wordData.defOrder;
    if (isCorrect) {
      setTimeout(() => {
        setIsFadingOut(true);
      }, 1200); // Start fade out after 1.2s

      setTimeout(() => {
        onStart();
      }, 1500); // Navigate after 1.5s total
    }
    // If incorrect, show "next word" button (no auto-navigation)
  };

  const handleNextWord = () => {
    // Reset state and fetch new word
    setSelectedIndex(null);
    setShowFeedback(false);
    fetchLandingWord(true); // Pass true to indicate this is a refresh
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="landing-content">
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !wordData) {
    return (
      <div className="landing-page">
        <div className="landing-content">
          <p className="error-text">{error || 'Failed to load word'}</p>
          <button className="retry-button" onClick={() => fetchLandingWord()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Arrange definitions based on defOrder
  const definitions = wordData.defOrder === 0
    ? [DEFINABLE_WORD.correctDefinition, wordData.wrongDefinition]
    : [wordData.wrongDefinition, DEFINABLE_WORD.correctDefinition];

  return (
    <div className={`landing-page ${isFadingOut ? 'fade-out' : ''}`}>
      {/* Dictionary Tab */}
      <div className="dictionary-tab">
        <img src="/src/assets/EF-Tab.png" alt="Dictionary tab" />
      </div>
      <div className="landing-content">
        {/* Word Display */}
        <div className="landing-word-display">
          <div className="word-headword-line">
            <span className="word-text">{DEFINABLE_WORD.word}</span>
            <span className="word-pronunciation">{DEFINABLE_WORD.ipa}</span>
            <span className="word-pos">{DEFINABLE_WORD.posName}</span>
          </div>
        </div>

        {/* Definition Buttons */}
        <div className="landing-definitions">
          {loadingDefinition ? (
            <div className="definitions-loading">
              <p className="loading-text">Loading...</p>
            </div>
          ) : (
            definitions.map((definition, index) => {
              const isCorrect = index === wordData.defOrder;
              const isSelected = selectedIndex === index;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  className={`landing-definition-button ${showCorrect ? 'correct' : ''} ${showIncorrect ? 'incorrect' : ''}`}
                  onClick={() => handleDefinitionClick(index)}
                  disabled={showFeedback || loadingDefinition}
                >
                  <div className="definition-content">
                    <span className="definition-text">: {definition}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Next Word Button or Prompt - show prompt initially, button after wrong answer */}
        {!showFeedback ? (
          <p className="choose-prompt">(choose a definition!)</p>
        ) : showFeedback && selectedIndex !== null && selectedIndex !== wordData.defOrder ? (
          <button className="next-word-button" onClick={handleNextWord}>
            next word →
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default LandingPage;
