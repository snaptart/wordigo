import React, { useState } from 'react';
import './WordLookup.css';
import PageHeader from './PageHeader';
import { lookupWord } from '../services/api';
import type { WordLookupResponse } from '../services/api';

interface WordLookupProps {
  onBack: () => void;
  onMenuClick: () => void;
  userId?: number;
}

const WordLookup: React.FC<WordLookupProps> = ({ onBack, onMenuClick, userId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [wordDetails, setWordDetails] = useState<WordLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a word to search');
      return;
    }

    setIsSearching(true);
    setError(null);
    setWordDetails(null);

    try {
      const response = await lookupWord(searchQuery.trim(), userId);
      setWordDetails(response);
      setIsSearching(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Word not found in our dictionary. Please try another word.');
      } else {
        setError('Failed to find word. Please try again.');
      }
      setIsSearching(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const groupDefinitionsByPOS = (definitions: WordLookupResponse['definitions']) => {
    const grouped: Record<string, typeof definitions> = {};

    definitions.forEach(def => {
      if (!grouped[def.pos]) {
        grouped[def.pos] = [];
      }
      grouped[def.pos].push(def);
    });

    // Sort by POS order: noun, verb, adjective, adverb
    const posOrder = ['n', 'v', 'a', 's', 'r'];
    const sorted: Record<string, typeof definitions> = {};

    posOrder.forEach(pos => {
      if (grouped[pos]) {
        sorted[pos] = grouped[pos];
      }
    });

    // Add any remaining POS types
    Object.keys(grouped).forEach(pos => {
      if (!sorted[pos]) {
        sorted[pos] = grouped[pos];
      }
    });

    return sorted;
  };

  return (
    <div className="word-lookup-page">
      <PageHeader
        title="Word Lookup"
        onBack={onBack}
        onMenuClick={onMenuClick}
      />

      <main className="word-lookup-main">
        {error && (
          <div className="word-lookup-content">
            <div className="message error-message">
              {error}
            </div>
          </div>
        )}

        {isSearching ? (
          <div className="word-lookup-content">
            <div className="word-lookup-loading">
              <div className="word-lookup-spinner"></div>
              <p>Looking up word...</p>
            </div>
          </div>
        ) : (
          <div className="word-lookup-content">
            {/* Search Section */}
            <div className="word-lookup-section">
              <h2 className="section-title">Search Dictionary</h2>
              <p className="section-description">
                Look up any word to see its definition, examples, and your game history with it.
              </p>
              <form className="word-lookup-search-form" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="word-lookup-input"
                  placeholder="Enter a word..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            {/* Word Details */}
            {wordDetails && (
              <div className="word-lookup-details">
                {/* User History - moved to top */}
                {wordDetails.userHistory && (
                  <div className="word-lookup-history">
                    <h3 className="word-lookup-subsection-title">Your History with this Word</h3>
                    <div className="word-lookup-history-stats">
                      <div className="word-lookup-stat">
                        <span className="word-lookup-stat-label">Times Encountered</span>
                        <span className="word-lookup-stat-value">{wordDetails.userHistory.timesEncountered}</span>
                      </div>
                      <div className="word-lookup-stat">
                        <span className="word-lookup-stat-label">Times Correct</span>
                        <span className="word-lookup-stat-value">{wordDetails.userHistory.timesCorrect}</span>
                      </div>
                      <div className="word-lookup-stat">
                        <span className="word-lookup-stat-label">Success Rate</span>
                        <span className="word-lookup-stat-value">
                          {Math.round((wordDetails.userHistory.timesCorrect / wordDetails.userHistory.timesEncountered) * 100)}%
                        </span>
                      </div>
                      {wordDetails.userHistory.lastSeen && (
                        <div className="word-lookup-stat">
                          <span className="word-lookup-stat-label">Last Seen</span>
                          <span className="word-lookup-stat-value">
                            {new Date(wordDetails.userHistory.lastSeen).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dictionary Entry - Dictionary Style */}
                <div className="dictionary-entry">
                  {Object.entries(groupDefinitionsByPOS(wordDetails.definitions)).map(([pos, defs]) => (
                    <div key={pos} className="dictionary-pos-section">
                      {/* Headword with POS inline */}
                      <div className="dictionary-headword-line">
                        <span className="dictionary-word">{wordDetails.word}</span>
                        {wordDetails.pronunciation?.ipa && (
                          <span className="dictionary-pronunciation">{wordDetails.pronunciation.ipa}</span>
                        )}
                        <span className="dictionary-pos"> {defs[0].posName}</span>
                        {wordDetails.difficulty && (
                          <span
                            className="dictionary-difficulty"
                            style={{ backgroundColor: getDifficultyColor(wordDetails.difficulty) }}
                          >
                            {wordDetails.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Syllables if available */}
                      {wordDetails.pronunciation?.formattedSyllables && (
                        <div className="dictionary-syllables">
                          {wordDetails.pronunciation.formattedSyllables}
                        </div>
                      )}

                      {/* Definitions for this POS */}
                      <div className="dictionary-definitions">
                        {defs.map((def, index) => (
                          <div key={def.id} className="dictionary-definition-item">
                            <span className="dictionary-def-number">{index + 1}</span>
                            <span className="dictionary-def-separator"> : </span>
                            <span className="dictionary-def-text">{def.definition}</span>
                            {def.example && (
                              <div className="dictionary-def-example">
                                <span className="dictionary-example-text">{def.example}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!wordDetails && !error && (
              <div className="word-lookup-empty">
                <div className="word-lookup-empty-icon">📖</div>
                <h3>Search for a Word</h3>
                <p>Enter a word above to see its definition, examples, and your game history with it.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WordLookup;
