/**
 * User Preferences Service
 *
 * Handles CRUD operations for user preferences and adaptive difficulty
 */

import { PrismaClient } from '@prisma/client';
import {
  UserPreferences,
  UpdatePreferencesRequest,
  AdaptiveDifficultyData,
  PerformanceRecord,
  DifficultyLevel
} from '../types';

const prisma = new PrismaClient();

// Difficulty level to band mapping
const DIFFICULTY_BAND_MAP: Record<DifficultyLevel, number | null> = {
  'easy': 1,
  'less_easy': 2,
  'medium': 3,
  'hard': 4,
  'hardest': 5,
  'adaptive': null // Dynamically determined
};

/**
 * Get user preferences by user ID
 * Creates default preferences if they don't exist
 */
export async function getUserPreferences(userId: number): Promise<UserPreferences> {
  let preferences = await prisma.user_preferences.findUnique({
    where: { user_id: userId }
  });

  if (!preferences) {
    // Create default preferences for new user
    preferences = await prisma.user_preferences.create({
      data: {
        user_id: userId,
        default_difficulty: 'adaptive',
        word_length_filter: 'all',
        allow_obscure_words: true,
        sound_enabled: true,
        haptic_feedback_enabled: true,
        adaptive_difficulty_data: {
          currentBand: 1, // Start at easiest
          performanceHistory: [],
          adjustmentTimestamp: new Date()
        }
      }
    });
  }

  return formatPreferences(preferences);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: number,
  updates: UpdatePreferencesRequest
): Promise<UserPreferences> {
  const preferences = await prisma.user_preferences.upsert({
    where: { user_id: userId },
    update: {
      default_difficulty: updates.defaultDifficulty,
      word_length_filter: updates.wordLengthFilter,
      allow_obscure_words: updates.allowObscureWords,
      category_preferences: updates.categoryPreferences as any,
      category_mode: updates.categoryMode,
      sound_enabled: updates.soundEnabled,
      haptic_feedback_enabled: updates.hapticFeedbackEnabled,
      updated_at: new Date()
    },
    create: {
      user_id: userId,
      default_difficulty: updates.defaultDifficulty || 'adaptive',
      word_length_filter: updates.wordLengthFilter || 'all',
      allow_obscure_words: updates.allowObscureWords ?? true,
      category_preferences: (updates.categoryPreferences || null) as any,
      category_mode: updates.categoryMode || 'simple',
      sound_enabled: updates.soundEnabled ?? true,
      haptic_feedback_enabled: updates.hapticFeedbackEnabled ?? true,
      adaptive_difficulty_data: {
        currentBand: 1,
        performanceHistory: [],
        adjustmentTimestamp: new Date()
      } as any
    }
  });

  return formatPreferences(preferences);
}

/**
 * Get the difficulty band for a user based on their preferences
 * Returns null for adaptive mode (will be calculated dynamically)
 */
export async function getUserDifficultyBand(userId: number): Promise<number | null> {
  const preferences = await getUserPreferences(userId);

  if (preferences.defaultDifficulty === 'adaptive') {
    return null; // Adaptive mode - will be calculated based on performance
  }

  return DIFFICULTY_BAND_MAP[preferences.defaultDifficulty];
}

/**
 * Get the current adaptive difficulty band for a user
 * Based on their performance history
 */
export async function getAdaptiveDifficultyBand(userId: number): Promise<number> {
  const preferences = await getUserPreferences(userId);

  if (!preferences.adaptiveDifficultyData) {
    // Initialize adaptive data
    const adaptiveData: AdaptiveDifficultyData = {
      currentBand: 1, // Start at easiest
      performanceHistory: [],
      adjustmentTimestamp: new Date()
    };

    await prisma.user_preferences.update({
      where: { user_id: userId },
      data: { adaptive_difficulty_data: adaptiveData as any }
    });

    return 1;
  }

  const adaptiveData = preferences.adaptiveDifficultyData as AdaptiveDifficultyData;
  return adaptiveData.currentBand;
}

/**
 * Update adaptive difficulty based on game performance
 * Called after each game to adjust difficulty
 */
export async function updateAdaptiveDifficulty(
  userId: number,
  correct: boolean,
  timeSpent: number,
  currentBand: number
): Promise<number> {
  const preferences = await getUserPreferences(userId);

  let adaptiveData = preferences.adaptiveDifficultyData as AdaptiveDifficultyData | null;

  if (!adaptiveData) {
    adaptiveData = {
      currentBand: currentBand || 1,
      performanceHistory: [],
      adjustmentTimestamp: new Date()
    };
  }

  // Add performance record
  const newRecord: PerformanceRecord = {
    difficultyBand: currentBand,
    correctCount: correct ? 1 : 0,
    totalCount: 1,
    averageTime: timeSpent,
    timestamp: new Date()
  };

  adaptiveData.performanceHistory.push(newRecord);

  // Keep only last 20 records
  if (adaptiveData.performanceHistory.length > 20) {
    adaptiveData.performanceHistory = adaptiveData.performanceHistory.slice(-20);
  }

  // Calculate new difficulty band based on recent performance
  const recentGames = adaptiveData.performanceHistory.slice(-10); // Last 10 games
  const totalCorrect = recentGames.reduce((sum, record) => sum + record.correctCount, 0);
  const successRate = totalCorrect / recentGames.length;

  let newBand = adaptiveData.currentBand;

  // Adjust difficulty based on performance
  if (recentGames.length >= 5) {
    if (successRate >= 0.8 && newBand < 5) {
      // Doing well - increase difficulty
      newBand++;
    } else if (successRate <= 0.4 && newBand > 1) {
      // Struggling - decrease difficulty
      newBand--;
    }
    // 0.4-0.8 success rate keeps current difficulty
  }

  adaptiveData.currentBand = newBand;
  adaptiveData.adjustmentTimestamp = new Date();

  // Update in database
  await prisma.user_preferences.update({
    where: { user_id: userId },
    data: {
      adaptive_difficulty_data: adaptiveData as any,
      updated_at: new Date()
    }
  });

  return newBand;
}

/**
 * Get available lexical domains (categories) for filtering
 */
export async function getAvailableCategories(): Promise<Array<{id: number, name: string, displayName: string}>> {
  const domains = await prisma.lexdomains.findMany({
    select: {
      lexdomainid: true,
      lexdomainname: true,
      lexdomain: true
    },
    orderBy: {
      lexdomainname: 'asc'
    }
  });

  return domains.map(domain => ({
    id: domain.lexdomainid,
    name: domain.lexdomainname,
    displayName: formatCategoryName(domain.lexdomainname)
  }));
}

/**
 * Format category name for display
 * e.g., "noun.person" -> "People"
 */
function formatCategoryName(lexdomainName: string): string {
  const categoryMap: Record<string, string> = {
    'noun.Tops': 'General',
    'noun.act': 'Actions & Events',
    'noun.animal': 'Animals',
    'noun.artifact': 'Objects & Artifacts',
    'noun.attribute': 'Attributes & Properties',
    'noun.body': 'Body & Anatomy',
    'noun.cognition': 'Knowledge & Thought',
    'noun.communication': 'Communication',
    'noun.event': 'Events & Occurrences',
    'noun.feeling': 'Feelings & Emotions',
    'noun.food': 'Food & Drink',
    'noun.group': 'Groups & Collections',
    'noun.location': 'Places & Locations',
    'noun.motive': 'Motives & Intentions',
    'noun.object': 'Objects',
    'noun.person': 'People',
    'noun.phenomenon': 'Natural Phenomena',
    'noun.plant': 'Plants & Vegetation',
    'noun.possession': 'Possessions & Property',
    'noun.process': 'Processes',
    'noun.quantity': 'Quantities & Measures',
    'noun.relation': 'Relations',
    'noun.shape': 'Shapes & Forms',
    'noun.state': 'States & Conditions',
    'noun.substance': 'Substances & Materials',
    'noun.time': 'Time',
    'verb.body': 'Body Actions',
    'verb.change': 'Changes',
    'verb.cognition': 'Mental Actions',
    'verb.communication': 'Communication Actions',
    'verb.competition': 'Competition & Sports',
    'verb.consumption': 'Consumption',
    'verb.contact': 'Contact & Touch',
    'verb.creation': 'Creation',
    'verb.emotion': 'Emotional Actions',
    'verb.motion': 'Movement',
    'verb.perception': 'Perception',
    'verb.possession': 'Possession',
    'verb.social': 'Social Actions',
    'verb.stative': 'States of Being',
    'verb.weather': 'Weather',
    'adj.all': 'Descriptive (Adjectives)',
    'adv.all': 'Modifiers (Adverbs)'
  };

  return categoryMap[lexdomainName] || lexdomainName;
}

/**
 * Format preferences from database format to API format
 */
function formatPreferences(dbPreferences: any): UserPreferences {
  return {
    id: dbPreferences.id,
    userId: dbPreferences.user_id,
    defaultDifficulty: dbPreferences.default_difficulty as DifficultyLevel,
    wordLengthFilter: dbPreferences.word_length_filter,
    allowObscureWords: dbPreferences.allow_obscure_words,
    categoryPreferences: dbPreferences.category_preferences as string[] | null,
    categoryMode: dbPreferences.category_mode as 'simple' | 'advanced' | undefined,
    soundEnabled: dbPreferences.sound_enabled,
    hapticFeedbackEnabled: dbPreferences.haptic_feedback_enabled,
    adaptiveDifficultyData: dbPreferences.adaptive_difficulty_data as AdaptiveDifficultyData | null,
    createdAt: dbPreferences.created_at,
    updatedAt: dbPreferences.updated_at
  };
}

export default {
  getUserPreferences,
  updateUserPreferences,
  getUserDifficultyBand,
  getAdaptiveDifficultyBand,
  updateAdaptiveDifficulty,
  getAvailableCategories
};
