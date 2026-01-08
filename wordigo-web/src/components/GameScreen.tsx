import { useEffect, useState, useRef } from 'react';
import { useGameEngine, type GameMode } from '../hooks/useGameEngine';
import { useTimer as useGameTimer } from '../hooks/useTimer';
import type { CompleteGameResponse } from '../types/index';
import WordDisplay from './WordDisplay';
import DefinitionButton from './DefinitionButton';
import Timer from './Timer';
import StrikeCounter from './StrikeCounter';
import Menu from './Menu';
import type { User } from '../hooks/useAuth';

interface GameScreenProps {
  mode: GameMode;
  userId?: number;
  user: User | null;
  isGuest: boolean;
  difficulty?: string;
  useTimer?: boolean;
  onGameComplete: (results: CompleteGameResponse) => void;
  onExit: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onWordLookup: () => void;
  onLogout: () => void;
  onLogin: () => void;
}

function GameScreen({
  mode,
  userId,
  user,
  isGuest,
  difficulty,
  useTimer = true,
  onGameComplete,
  onExit,
  onProfile,
  onSettings,
  onHistory,
  onWordLookup,
  onLogout,
  onLogin,
}: GameScreenProps) {
  const {
    engine,
    currentWord,
    selectedDefinition,
    showResult,
    strikes,
    currentWordIndex,
    totalWords,
    isLoading,
    error,
    handleSelectDefinition,
    handleNextWord,
    startGame,
  } = useGameEngine();

  const [showMenu, setShowMenu] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(useTimer);
  const [initialTimeLimit, setInitialTimeLimit] = useState(180);
  const [winnowedIndices, setWinnowedIndices] = useState<number[]>([]);
  const hasStartedGame = useRef(false);

  const handleTimeout = async () => {
    if (engine) {
      timer.stop();
      const results = await engine.handleTimeout(timer.timeRemaining);
      onGameComplete(results);
    }
  };

  const timer = useGameTimer(initialTimeLimit, timerEnabled, handleTimeout);

  // Start the game when component mounts
  useEffect(() => {
    if (hasStartedGame.current) return;
    hasStartedGame.current = true;

    startGame(mode, userId, difficulty, useTimer).then(() => {
      if (mode === 'endless') {
        setInitialTimeLimit(180);
        timer.reset(180);
        setTimerEnabled(true);
        // TODO: Change this back to true when timer is ready for production
        // timer.start();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, userId, difficulty, useTimer]);

  // Handle answer selection
  const handleAnswer = async (senseId: number) => {
    if (selectedDefinition !== null || !currentWord || !engine) return;

    await handleSelectDefinition(senseId, timer.timeRemaining);

    // Reset winnowed definitions when answer is selected
    setWinnowedIndices([]);

    // Check if game ended
    if (engine.state.isComplete && engine.state.gameResults) {
      timer.stop();
      onGameComplete(engine.state.gameResults);
      return;
    }

    // For endless mode, reset timer on correct answer
    if (mode === 'endless' && selectedDefinition === currentWord.correctWord.senseid) {
      const isCorrect = senseId === currentWord.correctWord.senseid;
      if (isCorrect) {
        timer.setTime(180); // Reset to 3 minutes
      }
    }
  };

  // Handle next word for endless mode
  const handleNext = async () => {
    if (!engine) return;

    // Check if game is over (3 strikes)
    if (strikes >= 3) {
      timer.stop();
      const results = await engine.handleTimeout(0);
      onGameComplete(results);
      return;
    }

    // Reset metadata visibility and winnowed definitions when moving to next word
    setShowMetadata(false);
    setWinnowedIndices([]);
    handleNextWord();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <p className="loading-text">Starting game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button onClick={onExit}>Back to Start</button>
      </div>
    );
  }

  if (!currentWord || !engine) {
    return (
      <div className="loading-container">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  // Handle winnow - remove a random wrong definition
  const handleWinnow = () => {
    if (!currentWord || winnowedIndices.length >= 3) return;

    // Create array of all 4 definitions
    const definitions = [
      { isCorrect: true, index: 0 },
      ...currentWord.wrongWords.map((_, i) => ({ isCorrect: false, index: i + 1 })),
    ];

    // Shuffle based on defOrder to match displayed order
    const shuffled = [...definitions];
    const correctDef = shuffled.shift()!;
    shuffled.splice(currentWord.defOrder, 0, correctDef);

    // Find indices of wrong definitions that haven't been winnowed
    const availableWrongIndices = shuffled
      .map((def, index) => ({ ...def, displayIndex: index }))
      .filter(def => !def.isCorrect && !winnowedIndices.includes(def.displayIndex))
      .map(def => def.displayIndex);

    if (availableWrongIndices.length === 0) return;

    // Pick a random wrong definition to winnow
    const randomIndex = Math.floor(Math.random() * availableWrongIndices.length);
    const indexToWinnow = availableWrongIndices[randomIndex];

    setWinnowedIndices([...winnowedIndices, indexToWinnow]);
  };

  const handleToggleMetadata = () => {
    // Reset winnowed definitions when divulge is clicked
    setWinnowedIndices([]);
    setShowMetadata(!showMetadata);
  };

  return (
    <div className="app">
      <div className="game-container">
        <div key={currentWordIndex}>
          <button className="exit-button" onClick={onExit}>
            ×
          </button>

          <WordDisplay
            word={currentWord.correctWord.word}
            simpleCategory={currentWord.correctWord.simpleCategory}
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
                  simpleCategory: currentWord.correctWord.simpleCategory,
                  word: currentWord.correctWord.word,
                  syllables: currentWord.correctWord.pronunciation?.syllables,
                  pos: currentWord.correctWord.pos,
                  posName: currentWord.correctWord.posName,
                  ipa: currentWord.correctWord.pronunciation?.ipa,
                },
                ...currentWord.wrongWords.map((w) => ({
                  text: w.badDefinition,
                  senseId: w.senseid,
                  isCorrect: false,
                  strategy: w.strategy,
                  difficultyBand: w.difficulty_band,
                  overallDifficultyScore: w.overall_difficulty_score,
                  wordInDefinition: w.word_in_definition,
                  simpleCategory: w.simpleCategory,
                  word: w.word,
                  syllables: w.pronunciation?.syllables,
                  pos: w.pos,
                  posName: w.posName,
                  ipa: w.pronunciation?.ipa,
                })),
              ];

              // Shuffle definitions based on defOrder
              const shuffled = [...definitions];
              const correctDef = shuffled.shift()!;
              shuffled.splice(currentWord.defOrder, 0, correctDef);

              return shuffled.map((def, index) => (
                <DefinitionButton
                  key={index}
                  definition={def.text}
                  onClick={() => handleAnswer(def.senseId)}
                  isSelected={selectedDefinition === def.senseId}
                  isCorrect={showResult && def.isCorrect}
                  isIncorrect={
                    showResult && selectedDefinition === def.senseId && !def.isCorrect
                  }
                  disabled={showResult}
                  strategy={def.strategy}
                  difficultyBand={def.difficultyBand}
                  overallDifficultyScore={def.overallDifficultyScore}
                  wordInDefinition={def.wordInDefinition}
                  simpleCategory={def.simpleCategory}
                  word={def.word}
                  syllables={def.syllables}
                  pos={def.pos}
                  posName={def.posName}
                  ipa={def.ipa}
                  showMetadata={showMetadata}
                  isWinnowed={winnowedIndices.includes(index)}
                />
              ));
            })()}

            {/* Next Word button for endless mode - only show after answer selected */}
            {mode === 'endless' && showResult && (
              <div className="next-word-container">
                <button onClick={handleNext} className="next-word-button">
                  {strikes >= 3 ? 'game over →' : 'next word →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'none' }}>
        <Timer
          timeRemaining={timer.timeRemaining}
          isRunning={timer.isRunning}
          onTick={timer.setTime}
          onTimeout={handleTimeout}
        />
      </div>

      <StrikeCounter
        strikes={strikes}
        currentWord={currentWordIndex + 1}
        totalWords={mode === 'endless' ? undefined : totalWords}
        showMetadata={showMetadata}
        onToggleMetadata={handleToggleMetadata}
        onWinnow={handleWinnow}
        winnowDisabled={winnowedIndices.length >= 3 || showResult}
      />

      {/* Global Menu Overlay */}
      <Menu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        user={user}
        isGuest={isGuest}
        onProfile={onProfile}
        onSettings={onSettings}
        onHistory={() => {
          timer.stop();
          onHistory();
        }}
        onWordLookup={() => {
          timer.stop();
          onWordLookup();
        }}
        onLogout={onLogout}
        onLogin={onLogin}
      />
    </div>
  );
}

export default GameScreen;
