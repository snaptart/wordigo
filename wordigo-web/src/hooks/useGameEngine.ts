import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { EndlessMode } from '../game/EndlessMode';
import { SprintMode } from '../game/SprintMode';
import { startGame as startGameAPI, fetchNextBatch, getUserPreferences } from '../services/api';
import type { PreloadedWord } from '../types/index';

export type GameMode = 'endless' | 'sprint' | 'categories' | 'daily' | null;

interface UseGameEngineResult {
  engine: GameEngine | null;
  currentWord: PreloadedWord | null;
  selectedDefinition: number | null;
  showResult: boolean;
  strikes: number;
  correctCount: number;
  currentWordIndex: number;
  totalWords: number;
  isLoading: boolean;
  error: string | null;
  isFetchingBatch: boolean;
  hintsRemaining: number;           // NEW: Current hint count (3 for logged-in, 0 for guests)
  sessionScore: number;             // NEW: Running session score
  hintsUsedThisWord: number;        // NEW: Hints used on current word
  divulgedThisWord: boolean;        // NEW: Whether divulge was clicked
  handleSelectDefinition: (senseId: number, timeRemaining: number) => Promise<void>;
  handleNextWord: () => void;
  handleWinnowClick: () => void;    // NEW: Handle winnow/hint usage
  handleDivulgeClick: () => void;   // NEW: Handle divulge click
  startGame: (mode: GameMode, userId?: number, difficulty?: string, useTimer?: boolean) => Promise<void>;
  resetGame: () => Promise<void>;
}

export function useGameEngine(): UseGameEngineResult {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const lastProcessedIndex = useRef<number>(-1);

  // Scoring system state
  const [hintsRemaining, setHintsRemaining] = useState<number>(0);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [hintsUsedThisWord, setHintsUsedThisWord] = useState<number>(0);
  const [divulgedThisWord, setDivulgedThisWord] = useState<boolean>(false);

  // Create history record when word is displayed
  useEffect(() => {
    if (engine && engine.currentWord && currentWordIndex !== lastProcessedIndex.current) {
      lastProcessedIndex.current = currentWordIndex;
      engine.createHistoryForCurrentWord();
    }
  }, [engine, currentWordIndex]);

  const startGame = useCallback(async (
    mode: GameMode,
    userId?: number,
    difficulty?: string,
    useTimer: boolean = true
  ) => {
    if (!mode) return;

    try {
      setIsLoading(true);
      setError(null);

      let selectedDifficulty = difficulty || 'medium';

      // For endless mode, load user's preferred difficulty if logged in
      if (mode === 'endless' && userId && !difficulty) {
        try {
          const preferences = await getUserPreferences(userId);
          selectedDifficulty = preferences.defaultDifficulty;
          console.log(`Using user's preferred difficulty: ${selectedDifficulty}`);
        } catch (err) {
          console.warn('Failed to load user preferences, using medium difficulty', err);
        }
      }

      const gameData = await startGameAPI(selectedDifficulty, useTimer, userId);

      // Create appropriate game engine based on mode
      let gameEngine: GameEngine;

      if (mode === 'endless') {
        gameEngine = new EndlessMode(
          gameData.gameId,
          gameData.words,
          selectedDifficulty
        );
      } else if (mode === 'sprint') {
        gameEngine = new SprintMode(
          gameData.gameId,
          gameData.words,
          gameData.timeLimit,
          selectedDifficulty
        );
      } else {
        // For now, default to sprint mode for other modes
        gameEngine = new SprintMode(
          gameData.gameId,
          gameData.words,
          gameData.timeLimit,
          selectedDifficulty
        );
      }

      setEngine(gameEngine);
      setStrikes(0);
      setCorrectCount(0);
      setCurrentWordIndex(0);
      setTotalWords(gameData.totalWords);
      setSelectedDefinition(null);
      setShowResult(false);
      setIsLoading(false);
      lastProcessedIndex.current = -1; // Reset tracking for new game

      // Initialize scoring system
      setHintsRemaining(userId ? 3 : 0);  // 3 hints for logged-in users, 0 for guests
      setSessionScore(0);
      setHintsUsedThisWord(0);
      setDivulgedThisWord(false);
    } catch (err) {
      setError('Failed to start game');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const handleSelectDefinition = useCallback(async (senseId: number, timeRemaining: number) => {
    if (!engine || selectedDefinition !== null) return;

    // Immediately show feedback
    setSelectedDefinition(senseId);
    setShowResult(true);

    try {
      const result = await engine.submitAnswer(
        senseId,
        timeRemaining,
        hintsUsedThisWord,
        divulgedThisWord
      );

      // Update state from result
      setStrikes(result.strikes);
      setCorrectCount(result.correctCount);

      // Update scoring state from server response
      if (result.sessionScore !== undefined) {
        setSessionScore(result.sessionScore);
        setHintsRemaining(result.hintsRemaining ?? 0);
        console.log('Score updated:', result.sessionScore, 'Points earned:', result.pointsEarned);
      }

      if (result.shouldEndGame) {
        // Game is ending, parent component should handle transition to results
        return;
      }

      // Handle auto-advance for sprint mode
      if (result.shouldAdvance) {
        const delay = engine.getDelayBeforeAdvance(result.isCorrect);
        setTimeout(() => {
          setSelectedDefinition(null);
          setShowResult(false);
          // Reset per-word tracking
          setHintsUsedThisWord(0);
          setDivulgedThisWord(false);
          engine.advanceToNextWord();
          setCurrentWordIndex(engine.state.currentWordIndex);
        }, delay);
      }

      // For endless mode, timer reset happens in parent component
    } catch (err) {
      console.error('Failed to handle answer selection:', err);
      setError('Failed to submit answer');
    }
  }, [engine, selectedDefinition, hintsUsedThisWord, divulgedThisWord]);

  const handleNextWord = useCallback(async () => {
    if (!engine) return;

    // Check if game should end (3 strikes)
    if (engine.state.strikes >= 3) {
      // Let parent component handle game end
      return;
    }

    // Advance to next word
    setSelectedDefinition(null);
    setShowResult(false);
    // Reset per-word tracking
    setHintsUsedThisWord(0);
    setDivulgedThisWord(false);
    engine.advanceToNextWord();
    setCurrentWordIndex(engine.state.currentWordIndex);

    // Check if we need to fetch next batch (for endless mode)
    if (engine.shouldFetchMoreWords() && !isFetchingBatch) {
      setIsFetchingBatch(true);
      try {
        const batchData = await fetchNextBatch({
          gameId: engine.id,
          batchSize: 20,
        });

        engine.addWords(batchData.words);
        setTotalWords(engine.totalWords);
        console.log(`Fetched ${batchData.totalFetched} more words for endless mode`);
      } catch (err) {
        console.error('Failed to fetch next batch of words', err);
      } finally {
        setIsFetchingBatch(false);
      }
    }
  }, [engine, isFetchingBatch]);

  const handleWinnowClick = useCallback(() => {
    if (hintsRemaining <= 0 || showResult) return;

    setHintsUsedThisWord(prev => prev + 1);
    setHintsRemaining(prev => prev - 1);
  }, [hintsRemaining, showResult]);

  const handleDivulgeClick = useCallback(() => {
    if (showResult) return;

    setDivulgedThisWord(true);
  }, [showResult]);

  const resetGame = useCallback(async () => {
    if (engine && !engine.state.isComplete) {
      try {
        // Complete game on server to cleanup
        await engine.handleTimeout(0);
      } catch (err) {
        console.error('Failed to cleanup game on reset:', err);
      }
    }

    setEngine(null);
    setSelectedDefinition(null);
    setShowResult(false);
    setStrikes(0);
    setCorrectCount(0);
    setCurrentWordIndex(0);
    setTotalWords(0);
    setError(null);
    // Reset scoring state
    setHintsRemaining(0);
    setSessionScore(0);
    setHintsUsedThisWord(0);
    setDivulgedThisWord(false);
  }, [engine]);

  return {
    engine,
    currentWord: engine?.currentWord || null,
    selectedDefinition,
    showResult,
    strikes,
    correctCount,
    currentWordIndex,
    totalWords,
    isLoading,
    error,
    isFetchingBatch,
    hintsRemaining,
    sessionScore,
    hintsUsedThisWord,
    divulgedThisWord,
    handleSelectDefinition,
    handleNextWord,
    handleWinnowClick,
    handleDivulgeClick,
    startGame,
    resetGame,
  };
}
