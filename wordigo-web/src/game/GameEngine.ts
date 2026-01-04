import type { PreloadedWord, CompleteGameResponse } from '../types/index';
import { submitWordAnswer, completeGame, createWordHistory } from '../services/api';

export interface AnswerResult {
  isCorrect: boolean;
  strikes: number;
  correctCount: number;
  shouldEndGame: boolean;
  shouldAdvance: boolean;
  gameResults?: CompleteGameResponse;
}

export interface GameState {
  words: PreloadedWord[];
  currentWordIndex: number;
  strikes: number;
  correctCount: number;
  isComplete: boolean;
  gameResults: CompleteGameResponse | null;
}

export abstract class GameEngine {
  protected gameId: number;
  protected words: PreloadedWord[] = [];
  protected currentWordIndex: number = 0;
  protected strikes: number = 0;
  protected correctCount: number = 0;
  protected isComplete: boolean = false;
  protected gameResults: CompleteGameResponse | null = null;
  protected timeLimit: number;
  protected difficulty: string;

  constructor(
    gameId: number,
    initialWords: PreloadedWord[],
    timeLimit: number,
    difficulty: string
  ) {
    this.gameId = gameId;
    this.words = initialWords;
    this.timeLimit = timeLimit;
    this.difficulty = difficulty;
  }

  // Abstract methods that each game mode must implement
  abstract shouldEndGameOnStrikes(): boolean;
  abstract shouldAutoAdvance(): boolean;
  abstract getDelayBeforeAdvance(isCorrect: boolean): number;
  abstract shouldFetchMoreWords(): boolean;

  // Core game logic
  async submitAnswer(
    senseId: number,
    timeRemaining: number
  ): Promise<AnswerResult> {
    const currentWord = this.currentWord;
    if (!currentWord) {
      throw new Error('No current word available');
    }

    const isCorrect = senseId === currentWord.correctWord.senseid;

    // Update local state
    if (!isCorrect) {
      this.strikes++;
    } else {
      this.correctCount++;
    }

    // Check if game should end
    const shouldEndGame = this.strikes >= 3 && this.shouldEndGameOnStrikes();

    // Submit answer to server (fire-and-forget for non-terminal states)
    const submitPromise = submitWordAnswer({
      gameId: this.gameId,
      historyId: currentWord.historyId,
      selectedSenseId: senseId,
      correctSenseId: currentWord.correctWord.senseid,
    });

    // If game is ending, wait for server confirmation
    if (shouldEndGame) {
      try {
        const result = await submitPromise;
        // Sync with server strike count if different
        if (result.strikes !== this.strikes) {
          this.strikes = result.strikes;
        }
      } catch (err) {
        console.error('Failed to submit answer', err);
      }

      // Complete the game
      const results = await this.completeGameOnServer(0, 'strikes');
      this.gameResults = results;
      this.isComplete = true;

      return {
        isCorrect,
        strikes: this.strikes,
        correctCount: this.correctCount,
        shouldEndGame: true,
        shouldAdvance: false,
        gameResults: results,
      };
    }

    // Check if it's the last word (for non-endless modes)
    const isLastWord = this.currentWordIndex + 1 >= this.words.length;
    if (!this.shouldEndGameOnStrikes() && isLastWord) {
      try {
        await submitPromise;
      } catch (err) {
        console.error('Failed to submit answer', err);
      }

      const results = await this.completeGameOnServer(timeRemaining, 'completed');
      this.gameResults = results;
      this.isComplete = true;

      return {
        isCorrect,
        strikes: this.strikes,
        correctCount: this.correctCount,
        shouldEndGame: true,
        shouldAdvance: false,
        gameResults: results,
      };
    }

    // For normal flow, submit in background
    submitPromise.catch((err) => {
      console.error('Failed to submit answer in background', err);
    });

    return {
      isCorrect,
      strikes: this.strikes,
      correctCount: this.correctCount,
      shouldEndGame: false,
      shouldAdvance: this.shouldAutoAdvance(),
    };
  }

  async handleTimeout(timeRemaining: number = 0): Promise<CompleteGameResponse> {
    const results = await this.completeGameOnServer(timeRemaining, 'timeout');
    this.gameResults = results;
    this.isComplete = true;
    return results;
  }

  advanceToNextWord(): void {
    if (this.currentWordIndex < this.words.length - 1) {
      this.currentWordIndex++;
    }
  }

  addWords(newWords: PreloadedWord[]): void {
    this.words = [...this.words, ...newWords];
  }

  async createHistoryForCurrentWord(): Promise<void> {
    const currentWord = this.currentWord;
    if (!currentWord || currentWord.historyId !== undefined) {
      return;
    }

    try {
      const wrongSenseIds = currentWord.wrongWords.map((w) => w.senseid);
      const result = await createWordHistory({
        gameId: this.gameId,
        correctSenseId: currentWord.correctWord.senseid,
        wrongSenseIds,
        defOrder: currentWord.defOrder,
        timeLimit: this.timeLimit,
      });

      // Update the word with historyId
      this.words[this.currentWordIndex] = {
        ...this.words[this.currentWordIndex],
        historyId: result.historyId,
      };
    } catch (err) {
      console.error('Failed to create history record:', err);
    }
  }

  private async completeGameOnServer(
    timeRemaining: number,
    reason: 'completed' | 'timeout' | 'strikes'
  ): Promise<CompleteGameResponse> {
    return await completeGame({
      gameId: this.gameId,
      timeRemaining,
      reason,
    });
  }

  // Getters
  get currentWord(): PreloadedWord | null {
    return this.words[this.currentWordIndex] || null;
  }

  get state(): GameState {
    return {
      words: this.words,
      currentWordIndex: this.currentWordIndex,
      strikes: this.strikes,
      correctCount: this.correctCount,
      isComplete: this.isComplete,
      gameResults: this.gameResults,
    };
  }

  get totalWords(): number {
    return this.words.length;
  }

  get remainingWords(): number {
    return this.words.length - (this.currentWordIndex + 1);
  }

  get id(): number {
    return this.gameId;
  }
}
