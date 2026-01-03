import { useState, useCallback, useEffect } from 'react';
import './App.css';
import type { PreloadedWord, CompleteGameResponse } from './types/index';
import { startGame as startGameAPI, submitWordAnswer, completeGame, fetchNextBatch, getUserPreferences, createWordHistory } from './services/api';
import WordDisplay from './components/WordDisplay';
import DefinitionButton from './components/DefinitionButton';
import Timer from './components/Timer';
import StrikeCounter from './components/StrikeCounter';
import DifficultySelection from './components/DifficultySelection';
import GameResults from './components/GameResults';
import GameOver from './components/GameOver';
import StartScreen from './components/StartScreen';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import Menu from './components/Menu';
import Settings from './components/Settings';
import GameHistory from './components/GameHistory';
import WordLookup from './components/WordLookup';

type GameState = 'start' | 'difficulty-selection' | 'playing' | 'game-over' | 'results' | 'history' | 'profile' | 'settings' | 'word-lookup';
type GameMode = 'endless' | 'sprint' | 'categories' | 'daily' | null;
type AuthState = 'login' | 'signup' | 'authenticated' | 'guest';

interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  profilePicture?: string;
}

function App() {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>('login');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Game state
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string>('');
  const [totalWords, setTotalWords] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);

  // Preloaded words
  const [words, setWords] = useState<PreloadedWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);

  // Current word state
  const [selectedDefinition, setSelectedDefinition] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Game progress
  const [strikes, setStrikes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Results
  const [gameResults, setGameResults] = useState<CompleteGameResponse | null>(null);

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);

  // Testing metadata toggle
  const [showMetadata, setShowMetadata] = useState(true);

  const currentWord = words[currentWordIndex];

  // Create history record when word is displayed to user
  useEffect(() => {
    const createHistory = async () => {
      if (!currentWord || !gameId || gameState !== 'playing') return;

      // Skip if history record already exists
      if (currentWord.historyId !== undefined) return;

      try {
        const wrongSenseIds = currentWord.wrongWords.map(w => w.senseid);
        const result = await createWordHistory({
          gameId,
          correctSenseId: currentWord.correctWord.senseid,
          wrongSenseIds,
          defOrder: currentWord.defOrder,
          timeLimit,
        });

        // Update the word in the array with the new historyId
        setWords(prevWords => {
          const updatedWords = [...prevWords];
          updatedWords[currentWordIndex] = {
            ...updatedWords[currentWordIndex],
            historyId: result.historyId,
          };
          return updatedWords;
        });
      } catch (err) {
        console.error('Failed to create history record:', err);
      }
    };

    createHistory();
  }, [currentWord, gameId, gameState, currentWordIndex, timeLimit]);

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('wordigo_access_token');
    const storedUser = localStorage.getItem('wordigo_user');

    if (storedToken && storedUser) {
      try {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthState('authenticated');
      } catch (err) {
        // Invalid stored data, clear it
        localStorage.removeItem('wordigo_access_token');
        localStorage.removeItem('wordigo_user');
      }
    }
  }, []);

  // Auth handlers
  const handleLoginSuccess = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    setAuthState('authenticated');
    localStorage.setItem('wordigo_access_token', token);
    localStorage.setItem('wordigo_user', JSON.stringify(userData));
  };

  const handleSignUpSuccess = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    setAuthState('authenticated');
    localStorage.setItem('wordigo_access_token', token);
    localStorage.setItem('wordigo_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    setAuthState('login');
    localStorage.removeItem('wordigo_access_token');
    localStorage.removeItem('wordigo_user');

    // Reset game state
    resetGame();
  };

  const handleContinueAsGuest = () => {
    setAuthState('guest');
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Start a new game with selected difficulty
  const handleSelectDifficulty = async (selectedDifficulty: string, useTimer: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      const gameData = await startGameAPI(selectedDifficulty, useTimer, user?.id);

      setGameId(gameData.gameId);
      setDifficulty(gameData.difficulty);
      setTotalWords(gameData.totalWords);
      setTimeLimit(gameData.timeLimit);
      setTimerEnabled(gameData.timerEnabled);
      setWords(gameData.words);
      setCurrentWordIndex(0);
      setTimeRemaining(gameData.timeLimit);
      setStrikes(0);
      setCorrectCount(0);
      setSelectedDefinition(null);
      setShowResult(false);
      setIsTimerRunning(gameData.timerEnabled);
      setGameState('playing');
      setIsLoading(false);
    } catch (err) {
      setError('Failed to start game');
      setIsLoading(false);
    }
  };

  // Handle timeout
  const handleTimeout = useCallback(async () => {
    if (!gameId) return;

    setIsTimerRunning(false);

    try {
      const results = await completeGame({
        gameId,
        timeRemaining: 0,
        reason: 'timeout',
      });

      setGameResults(results);
      setGameState('results');
    } catch (err) {
      console.error('Failed to complete game on timeout', err);
    }
  }, [gameId]);

  // Handle answer selection
  const handleSelectDefinition = async (senseId: number) => {
    if (selectedDefinition !== null || !currentWord || !gameId) return;

    // Immediately show feedback
    setSelectedDefinition(senseId);
    setShowResult(true);

    const isCorrect = senseId === currentWord.correctWord.senseid;

    // Optimistically update local state
    const newStrikes = isCorrect ? strikes : strikes + 1;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;

    setStrikes(newStrikes);
    setCorrectCount(newCorrectCount);

    // Check if game should end (locally)
    const isEndlessMode = gameMode === 'endless';
    const isLastWord = currentWordIndex + 1 >= words.length;
    const gameOverByStrikes = newStrikes >= 3;

    // Submit answer in background (fire-and-forget for non-terminal states)
    const submitPromise = submitWordAnswer({
      gameId,
      historyId: currentWord.historyId,
      selectedSenseId: senseId,
      correctSenseId: currentWord.correctWord.senseid,
    });

    if (gameOverByStrikes) {
      // Wait for server confirmation on game over
      try {
        const result = await submitPromise;
        // Sync with server strike count if different
        if (result.strikes !== newStrikes) {
          setStrikes(result.strikes);
        }
      } catch (err) {
        console.error('Failed to submit answer', err);
      }

      // For endless mode: don't auto-advance to results, wait for user to click "Game Over"
      if (isEndlessMode) {
        // Just show the feedback and wait for user to click button
        return;
      }

      // For non-endless modes: brief feedback then show game results
      setTimeout(async () => {
        setIsTimerRunning(false);
        try {
          const results = await completeGame({
            gameId,
            timeRemaining: 0, // No time bonus for striking out
            reason: 'strikes',
          });

          setGameResults(results);
          setGameState('results');
        } catch (err) {
          console.error('Failed to complete game on strikes', err);
        }
      }, 500);
      return;
    }

    // For non-endless modes, check if it's the last word
    if (!isEndlessMode && isLastWord) {
      // Wait for server to complete game
      try {
        await submitPromise;
      } catch (err) {
        console.error('Failed to submit answer', err);
      }

      setTimeout(async () => {
        setIsTimerRunning(false);
        try {
          const results = await completeGame({
            gameId,
            timeRemaining,
            reason: 'completed',
          });

          setGameResults(results);
          setGameState('results');
        } catch (err) {
          console.error('Failed to complete game', err);
        }
      }, 500);
      return;
    }

    // Submit happens in background, no need to wait
    submitPromise.catch(err => {
      console.error('Failed to submit answer in background', err);
      // Could add error handling/retry logic here
    });

    // For endless mode: don't auto-advance, wait for user to click "Next Word"
    if (isEndlessMode) {
      // For endless mode: reset timer to 3 minutes on correct answer
      if (isCorrect) {
        setTimeRemaining(180); // Reset to 3 minutes (180 seconds)
      }
      // Don't advance - user will click "Next Word" button
      return;
    }

    // For non-endless modes: show brief feedback then move to next word
    // Longer delay for wrong answers (750ms) vs correct (500ms)
    const feedbackDelay = isCorrect ? 500 : 750;
    setTimeout(() => {
      setSelectedDefinition(null);
      setShowResult(false);
      setCurrentWordIndex((prev) => prev + 1);
    }, feedbackDelay);
    // Timer keeps running!
  };

  // Handle "Next Word" button click in endless mode
  const handleNextWord = async () => {
    // Check if game is over (3 strikes)
    if (strikes >= 3) {
      setIsTimerRunning(false);
      try {
        const results = await completeGame({
          gameId: gameId!,
          timeRemaining: 0, // No time bonus for striking out
          reason: 'strikes',
        });

        setGameResults(results);
        setGameState('results');
      } catch (err) {
        console.error('Failed to complete game on strikes', err);
      }
      return;
    }

    // Normal next word behavior
    setSelectedDefinition(null);
    setShowResult(false);
    setCurrentWordIndex((prev) => prev + 1);

    // Check if we need to fetch next batch
    const remainingWords = words.length - (currentWordIndex + 1);
    if (remainingWords <= 5 && !isFetchingBatch) {
      fetchMoreWords();
    }
  };

  // Fetch next batch of words for endless mode
  const fetchMoreWords = async () => {
    if (!gameId || isFetchingBatch) return;

    setIsFetchingBatch(true);
    try {
      const batchData = await fetchNextBatch({
        gameId,
        batchSize: 20,
      });

      // Append new words to existing array
      setWords(prevWords => [...prevWords, ...batchData.words]);
      console.log(`Fetched ${batchData.totalFetched} more words for endless mode`);
    } catch (err) {
      console.error('Failed to fetch next batch of words', err);
      // Continue playing with existing words if fetch fails
    } finally {
      setIsFetchingBatch(false);
    }
  };

  // Handle mode selection from start screen
  const handleSelectMode = async (mode: GameMode) => {
    setGameMode(mode);

    if (mode === 'endless') {
      // Start game immediately with user's preferred difficulty (or medium as fallback)
      // Endless mode always starts with 3 minutes (180 seconds)
      try {
        setIsLoading(true);
        setError(null);

        // Load user preferences if logged in, otherwise use 'medium' as default
        let selectedDifficulty = 'medium';
        if (user?.id) {
          try {
            const preferences = await getUserPreferences(user.id);
            selectedDifficulty = preferences.defaultDifficulty;
            console.log(`Using user's preferred difficulty: ${selectedDifficulty}`);
          } catch (err) {
            console.warn('Failed to load user preferences, using medium difficulty', err);
          }
        }

        const gameData = await startGameAPI(selectedDifficulty, true, user?.id);

        setGameId(gameData.gameId);
        setDifficulty(gameData.difficulty);
        setTotalWords(gameData.totalWords);
        setTimeLimit(180); // Override to 3 minutes for endless mode
        setTimerEnabled(true); // Always enabled for endless
        setWords(gameData.words);
        setCurrentWordIndex(0);
        setTimeRemaining(180); // Start with 3 minutes
        setStrikes(0);
        setCorrectCount(0);
        setSelectedDefinition(null);
        setShowResult(false);
        setIsTimerRunning(false); // TODO: Disabled for development - change back to true when ready
        setGameState('playing');
        setIsLoading(false);
      } catch (err) {
        setError('Failed to start game');
        setIsLoading(false);
        setGameState('start');
      }
    } else {
      // For other modes, go to difficulty selection (when implemented)
      setGameState('difficulty-selection');
    }
  };

  // Handle menu click
  const handleMenuClick = () => {
    console.log('handleMenuClick called - toggling showMenu');
    setShowMenu(prev => !prev);
  };


  // Reset game to start screen
  const resetGame = async () => {
    // If there's an active game, complete it to cleanup unplayed records
    if (gameId && gameState === 'playing') {
      try {
        await completeGame({
          gameId,
          timeRemaining,
          reason: 'strikes', // Mark as abandoned
        });
      } catch (err) {
        console.error('Failed to cleanup game on reset:', err);
      }
    }

    setGameState('start');
    setGameMode(null);
    setGameId(null);
    setDifficulty('');
    setTotalWords(0);
    setTimeLimit(0);
    setTimerEnabled(true);
    setWords([]);
    setCurrentWordIndex(0);
    setSelectedDefinition(null);
    setShowResult(false);
    setStrikes(0);
    setCorrectCount(0);
    setTimeRemaining(0);
    setIsTimerRunning(false);
    setGameResults(null);
    setError(null);
  };

  // Render different states

  // Show auth screens if not authenticated or guest
  if (authState === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => setAuthState('signup')}
        onSkip={handleContinueAsGuest}
      />
    );
  }

  if (authState === 'signup') {
    return (
      <SignUp
        onSignUpSuccess={handleSignUpSuccess}
        onSwitchToLogin={() => setAuthState('login')}
      />
    );
  }

  // User is authenticated or guest - show game
  if (gameState === 'start') {
    return (
      <div className="app">
        {isLoading ? (
          <div className="loading-container">
            <p className="loading-text">Starting game...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button onClick={resetGame}>Back to Start</button>
          </div>
        ) : (
          <StartScreen
            onSelectMode={handleSelectMode}
            onMenuClick={handleMenuClick}
          />
        )}

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => {
            console.log('Menu onClose called - setting showMenu to false');
            setShowMenu(false);
          }}
          user={user}
          isGuest={authState === 'guest'}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={() => setAuthState('login')}
        />
      </div>
    );
  }

  if (gameState === 'difficulty-selection') {
    return (
      <div className="app">
        {isLoading ? (
          <div className="loading-container">
            <p className="loading-text">Starting game...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button onClick={resetGame}>Try Again</button>
          </div>
        ) : (
          <DifficultySelection onSelectDifficulty={handleSelectDifficulty} />
        )}
      </div>
    );
  }

  if (gameState === 'game-over') {
    return (
      <div className="app">
        <GameOver onRestart={resetGame} />
      </div>
    );
  }

  if (gameState === 'results' && gameResults) {
    return (
      <div className="app">
        <GameResults results={gameResults} onPlayAgain={resetGame} strikes={strikes} timerEnabled={timerEnabled} />
      </div>
    );
  }

  if (gameState === 'history') {
    return (
      <div className="app">
        <GameHistory
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
          userId={user?.id}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={user}
          isGuest={authState === 'guest'}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={() => setAuthState('login')}
        />
      </div>
    );
  }

  if (gameState === 'word-lookup') {
    return (
      <div className="app">
        <WordLookup
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
          userId={user?.id}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={user}
          isGuest={authState === 'guest'}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={() => setAuthState('login')}
        />
      </div>
    );
  }

  if (gameState === 'profile') {
    return (
      <div className="app">
        <Profile
          user={user}
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={user}
          isGuest={authState === 'guest'}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={() => setAuthState('login')}
        />
      </div>
    );
  }

  if (gameState === 'settings') {
    return (
      <div className="app">
        <Settings
          user={user}
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={user}
          isGuest={authState === 'guest'}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={() => setAuthState('login')}
        />
      </div>
    );
  }

  // Playing state
  return (
    <div className="app">
      <div className="game-container">
        {currentWord && (
          <div key={currentWordIndex}>
            <button className="back-button" onClick={resetGame}>
              ×
            </button>

            <WordDisplay
              word={currentWord.correctWord.word}
              pos={currentWord.correctWord.pos}
              pronunciation={currentWord.correctWord.pronunciation}
            />

            <div className="definitions-container">
              {(() => {
                // Create array of all 4 definitions with metadata
                const definitions = [
                  {
                    text: currentWord.correctWord.goodDefinition,
                    senseId: currentWord.correctWord.senseid,
                    isCorrect: true,
                    strategy: currentWord.correctWord.strategy,
                    difficultyBand: currentWord.correctWord.difficulty_band,
                    overallDifficultyScore: currentWord.correctWord.overall_difficulty_score,
                    wordInDefinition: currentWord.correctWord.word_in_definition,
                    word: currentWord.correctWord.word,
                  },
                  ...currentWord.wrongWords.map(w => ({
                    text: w.badDefinition,
                    senseId: w.senseid,
                    isCorrect: false,
                    strategy: w.strategy,
                    difficultyBand: w.difficulty_band,
                    overallDifficultyScore: w.overall_difficulty_score,
                    wordInDefinition: w.word_in_definition,
                    word: w.word,
                  })),
                ];

                // Shuffle definitions based on defOrder (0-3 indicates correct position)
                const shuffled = [...definitions];
                const correctDef = shuffled.shift()!; // Remove correct from start
                shuffled.splice(currentWord.defOrder, 0, correctDef); // Insert at defOrder position

                return shuffled.map((def, index) => (
                  <DefinitionButton
                    key={index}
                    definition={def.text}
                    onClick={() => handleSelectDefinition(def.senseId)}
                    isSelected={selectedDefinition === def.senseId}
                    isCorrect={showResult && def.isCorrect}
                    isIncorrect={showResult && selectedDefinition === def.senseId && !def.isCorrect}
                    disabled={showResult}
                    strategy={def.strategy}
                    difficultyBand={def.difficultyBand}
                    overallDifficultyScore={def.overallDifficultyScore}
                    wordInDefinition={def.wordInDefinition}
                    word={def.word}
                    showMetadata={showMetadata}
                  />
                ));
              })()}

              {/* Next Word button for endless mode - only show after answer selected */}
              {gameMode === 'endless' && showResult && (
                <div className="next-word-container">
                  <button onClick={handleNextWord} className="next-word-button">
                    {strikes >= 3 ? 'game over →' : 'next word →'}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      <div style={{ display: 'none' }}>
        <Timer
          timeRemaining={timeRemaining}
          isRunning={isTimerRunning}
          onTick={setTimeRemaining}
          onTimeout={handleTimeout}
        />
      </div>

      <StrikeCounter
        strikes={strikes}
        currentWord={currentWordIndex + 1}
        totalWords={gameMode === 'endless' ? undefined : totalWords}
        showMetadata={showMetadata}
        onToggleMetadata={() => setShowMetadata(!showMetadata)}
      />

      {/* Global Menu Overlay */}
      <Menu
        isOpen={showMenu}
        onClose={() => {
          console.log('Menu onClose called (playing state) - setting showMenu to false');
          setShowMenu(false);
        }}
        user={user}
        isGuest={authState === 'guest'}
        onProfile={() => setGameState('profile')}
        onSettings={() => setGameState('settings')}
        onHistory={() => {
          setIsTimerRunning(false);
          setGameState('history');
        }}
        onWordLookup={() => {
          setIsTimerRunning(false);
          setGameState('word-lookup');
        }}
        onLogout={handleLogout}
        onLogin={() => setAuthState('login')}
      />
    </div>
  );
}

export default App;
