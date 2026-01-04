import { GameEngine } from './GameEngine';
import type { PreloadedWord } from '../types/index';

export class SprintMode extends GameEngine {
  private static readonly CORRECT_DELAY = 500; // ms
  private static readonly WRONG_DELAY = 750; // ms

  constructor(
    gameId: number,
    initialWords: PreloadedWord[],
    timeLimit: number,
    difficulty: string
  ) {
    super(gameId, initialWords, timeLimit, difficulty);
  }

  shouldEndGameOnStrikes(): boolean {
    // Sprint mode ends on 3 strikes
    return true;
  }

  shouldAutoAdvance(): boolean {
    // Sprint mode auto-advances after delay
    return true;
  }

  getDelayBeforeAdvance(isCorrect: boolean): number {
    // Shorter delay for correct answers, longer for wrong
    return isCorrect ? SprintMode.CORRECT_DELAY : SprintMode.WRONG_DELAY;
  }

  shouldFetchMoreWords(): boolean {
    // Sprint mode has fixed word count, no fetching
    return false;
  }
}
