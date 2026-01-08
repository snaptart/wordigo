/**
 * Scoring Service
 *
 * Handles all scoring calculations for the Wordigo game.
 * Implements the scoring formula with difficulty and word length multipliers.
 */

import { UserPreferences, DifficultyLevel } from '../types';

// Difficulty level to numeric band mapping (1-5)
const DIFFICULTY_BAND_MAP: Record<DifficultyLevel, number> = {
  'easy': 1,
  'less_easy': 2,
  'medium': 3,
  'hard': 4,
  'hardest': 5,
  'adaptive': 3 // Default to medium for adaptive (will be overridden by adaptive data)
};

// Difficulty multipliers for scoring formula
const DIFFICULTY_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
  4: 2.5,
  5: 3.0
};

// Word length multipliers
const LENGTH_MULTIPLIERS: Record<string, number> = {
  'short': 0.8,
  'medium': 1.0,
  'long': 1.2
};

export interface ScoreCalculationParams {
  hintsUsed: number;
  difficulty: number;  // 1-5 band
  wordLength: 'short' | 'medium' | 'long';
  divulged: boolean;
  isGuest: boolean;
}

export class ScoringService {
  /**
   * Calculate points earned for a single word
   *
   * Formula for logged-in users:
   * (5 - hints_used) × difficulty_multiplier × word_length_multiplier
   *
   * Formula for guests:
   * 4 points per correct word (no multipliers)
   *
   * Divulged words: 0 points (for both logged-in and guest)
   */
  static calculateWordScore(params: ScoreCalculationParams): number {
    const { hintsUsed, difficulty, wordLength, divulged, isGuest } = params;

    // Divulged = 0 points for everyone
    if (divulged) {
      return 0;
    }

    // Guest users: simple 4 points per correct word
    if (isGuest) {
      return 4;
    }

    // Logged-in users: full formula
    // Base points: 5 - hints_used (minimum 0)
    const basePoints = Math.max(0, 5 - hintsUsed);

    // If base points are 0 (used 5+ hints), return 0
    if (basePoints === 0) {
      return 0;
    }

    // Get difficulty multiplier (default to 1.0 if invalid)
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;

    // Get word length multiplier (default to 1.0 if invalid)
    const lengthMultiplier = LENGTH_MULTIPLIERS[wordLength] || 1.0;

    // Calculate final score and round down
    const finalScore = basePoints * difficultyMultiplier * lengthMultiplier;

    return Math.floor(finalScore);
  }

  /**
   * Determine word length category based on character count
   *
   * @param wordLength - Number of characters in the word
   * @returns 'short' (<6), 'medium' (6-10), or 'long' (>10)
   */
  static getWordLengthCategory(wordLength: number): 'short' | 'medium' | 'long' {
    if (wordLength < 6) {
      return 'short';
    }
    if (wordLength <= 10) {
      return 'medium';
    }
    return 'long';
  }

  /**
   * Get difficulty band (1-5) from user preferences
   * Handles adaptive difficulty by reading current band from adaptive data
   *
   * @param userPreferences - User preferences object (can be null for guests)
   * @returns Difficulty band number (1-5), defaults to 3 (medium)
   */
  static getDifficultyLevel(userPreferences: UserPreferences | null): number {
    // Guests or no preferences: default to medium (3)
    if (!userPreferences) {
      return 3;
    }

    const difficultyLevel = userPreferences.default_difficulty as DifficultyLevel;

    // For adaptive difficulty, read current band from adaptive data
    if (difficultyLevel === 'adaptive') {
      const adaptiveData = userPreferences.adaptive_difficulty_data as any;
      if (adaptiveData && typeof adaptiveData.currentBand === 'number') {
        return Math.max(1, Math.min(5, adaptiveData.currentBand)); // Clamp to 1-5
      }
      return 3; // Default to medium if no adaptive data
    }

    // Map difficulty level to band
    return DIFFICULTY_BAND_MAP[difficultyLevel] || 3;
  }

  /**
   * Get word length filter from user preferences
   * Used to determine which words to show based on user settings
   *
   * @param userPreferences - User preferences object (can be null for guests)
   * @returns Word length filter: 'short', 'medium', 'long', or 'all'
   */
  static getWordLengthFilter(userPreferences: UserPreferences | null): 'short' | 'medium' | 'long' | 'all' {
    if (!userPreferences) {
      return 'all'; // Guests see all word lengths
    }

    return userPreferences.word_length_filter as 'short' | 'medium' | 'long' | 'all';
  }
}

export default ScoringService;
