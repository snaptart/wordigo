import { GameEngine } from './GameEngine';
import type { PreloadedWord } from '../types/index';

export class EndlessMode extends GameEngine {
  private static readonly BATCH_FETCH_THRESHOLD = 5;
  private static readonly TIME_RESET_ON_CORRECT = 180; // 3 minutes in seconds

  constructor(gameId: number, initialWords: PreloadedWord[], difficulty: string) {
    // Endless mode always uses 3-minute timer
    super(gameId, initialWords, 180, difficulty);
  }

  shouldEndGameOnStrikes(): boolean {
    // Endless mode ends on 3 strikes
    return true;
  }

  shouldAutoAdvance(): boolean {
    // Endless mode does NOT auto-advance
    // User must click "Next Word" button
    return false;
  }

  getDelayBeforeAdvance(_isCorrect: boolean): number {
    // Not used in endless mode since shouldAutoAdvance returns false
    return 0;
  }

  shouldFetchMoreWords(): boolean {
    // Fetch more words when we have 5 or fewer remaining
    return this.remainingWords <= EndlessMode.BATCH_FETCH_THRESHOLD;
  }

  getTimeResetValue(isCorrect: boolean): number {
    // Reset timer to 3 minutes on correct answer
    return isCorrect ? EndlessMode.TIME_RESET_ON_CORRECT : 0;
  }
}
