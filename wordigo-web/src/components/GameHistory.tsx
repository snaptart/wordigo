import { useState, useEffect } from 'react';
import { getGameHistory } from '../services/api';
import type { GameHistoryEntry, WordHistoryEntry } from '../types/index';
import './GameHistory.css';
import PageHeader from './PageHeader';

interface GameHistoryProps {
  onBack: () => void;
  onMenuClick: () => void;
  userId?: number;
}

function GameHistory({ onBack, onMenuClick, userId }: GameHistoryProps) {
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch game history when component mounts
  useEffect(() => {
    if (userId) {
      fetchHistory(1);
    }
  }, [userId]);

  const fetchHistory = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getGameHistory(userId, page, 10);
      setGames(response.games);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch game history:', err);
      setError('Failed to load game history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const toggleGameExpansion = (gameId: number) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (timeLimit: number, timeRemaining: number) => {
    const timeUsed = timeLimit - timeRemaining;
    const minutes = Math.floor(timeUsed / 60);
    const seconds = timeUsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: '#4ade80',
      less_easy: '#86efac',
      medium: '#fbbf24',
      hard: '#fb923c',
      hardest: '#ef4444',
      adaptive: '#8b5cf6',
    };
    return colors[difficulty] || '#9ca3af';
  };

  const getStatusBadge = (game: GameHistoryEntry) => {
    if (game.gameStatus === 'completed') {
      return <span className="status-badge completed">Completed</span>;
    }
    if (game.failReason === 'strikes') {
      return <span className="status-badge failed">Failed - 3 Strikes</span>;
    }
    if (game.failReason === 'timeout') {
      return <span className="status-badge failed">Failed - Timeout</span>;
    }
    return <span className="status-badge">{game.gameStatus}</span>;
  };

  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      difficulty_matched: 'Difficulty Matched',
      random: 'Random',
      unknown: 'Unknown',
    };
    return labels[strategy] || strategy;
  };

  return (
    <div className="game-history-page">
      <PageHeader title="Game History" onBack={onBack} onMenuClick={onMenuClick} />

      <main className="game-history-main">
          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading game history...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={() => fetchHistory(currentPage)}>Retry</button>
            </div>
          )}

          {!isLoading && !error && games.length === 0 && (
            <div className="empty-state">
              <p>No game history yet. Start playing to see your games here!</p>
            </div>
          )}

          {!isLoading && !error && games.length > 0 && (
            <div className="games-list">
              {games.map((game) => (
                <div key={game.gameId} className="game-card">
                  <div
                    className="game-summary"
                    onClick={() => toggleGameExpansion(game.gameId)}
                  >
                    <div className="game-summary-header">
                      <div className="game-info">
                        <div className="game-date">{formatDate(game.createdAt)}</div>
                        <div
                          className="difficulty-badge"
                          style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
                        >
                          {game.difficulty.replace('_', ' ')}
                        </div>
                        {getStatusBadge(game)}
                      </div>
                      <div className="expand-icon">
                        {expandedGameId === game.gameId ? '▼' : '▶'}
                      </div>
                    </div>

                    <div className="game-stats">
                      <div className="stat">
                        <span className="stat-label">Score:</span>
                        <span className="stat-value">{game.finalScore}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Accuracy:</span>
                        <span className="stat-value">{game.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Words:</span>
                        <span className="stat-value">
                          {game.correctWords}/{game.wordsCompleted}
                        </span>
                      </div>
                      {game.timerEnabled && (
                        <div className="stat">
                          <span className="stat-label">Time:</span>
                          <span className="stat-value">
                            {formatDuration(game.timeLimit, game.timeRemaining)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedGameId === game.gameId && (
                    <div className="game-details">
                      <h3>Words Played</h3>
                      <div className="words-list">
                        {game.words.map((word: WordHistoryEntry) => (
                          <div
                            key={word.historyId}
                            className={`word-entry ${word.isCorrect ? 'correct' : 'incorrect'}`}
                          >
                            <div className="word-header">
                              <div className="word-title">
                                <span className="word-number">#{word.defOrder}</span>
                                <span className="word-text">{word.correctWord.word}</span>
                                <span className={`result-icon ${word.isCorrect ? 'correct' : 'incorrect'}`}>
                                  {word.isCorrect ? '✓' : '✗'}
                                </span>
                              </div>
                              <div className="word-meta">
                                <span className="strategy-badge">
                                  {getStrategyLabel(word.selectionStrategy)}
                                </span>
                                {word.correctWord.difficultyBand && (
                                  <span className="difficulty-band">
                                    Band {word.correctWord.difficultyBand}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="word-definitions">
                              <div className="correct-definition">
                                <div className="definition-label">
                                  <strong>Correct Definition:</strong>
                                </div>
                                <div className="definition-text">
                                  {word.correctWord.definition}
                                </div>
                              </div>

                              {word.userSelection && !word.isCorrect && (
                                <div className="selected-definition">
                                  <div className="definition-label">
                                    <strong>Your Selection (Wrong):</strong>
                                  </div>
                                  <div className="definition-text wrong">
                                    <strong>{word.userSelection.word}:</strong>{' '}
                                    {word.userSelection.definition}
                                  </div>
                                </div>
                              )}

                              <div className="wrong-definitions">
                                <div className="definition-label">
                                  <strong>Wrong Options Shown:</strong>
                                </div>
                                {word.wrongDefinitions.map((wrongDef, idx) => (
                                  <div key={idx} className="definition-text">
                                    <strong>{wrongDef.word}:</strong> {wrongDef.definition}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => fetchHistory(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => fetchHistory(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
      </main>
    </div>
  );
}

export default GameHistory;
