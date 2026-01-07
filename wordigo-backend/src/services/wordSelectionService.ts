/**
 * Enhanced Word Selection Service
 *
 * Extends word selection with user preferences and filters
 */

import { PrismaClient } from '@prisma/client';
import { WordSelectionOptions, WordLengthFilter } from '../types';
import { getUserPreferences, getAdaptiveDifficultyBand } from './userPreferencesService';
import categoryGroupService from './categoryGroupService';
import { GameWord, WordData, getRandomWord as getBasicRandomWord, fetchPronunciationData } from './wordService';
import { getWrongDefinitions } from './wrongDefinitionService';
import { getLinguistWrongDefinitions } from './linguistWrongDefinitionService';

const prisma = new PrismaClient();

// ============================================================================
// FEATURE FLAG: LINGUIST DIFFICULTY SYSTEM
// ============================================================================
// Toggle between current wrong definition system and linguist's 5-level system
// Set to 'current' for existing behavior, 'linguist' for new system
// Can also be set to 'user_preference' to allow per-user choice (future enhancement)
const WRONG_DEFINITION_STRATEGY: 'current' | 'linguist' | 'user_preference' = 'linguist';

// Word length thresholds
// Note: All filters have min: 0 to allow any word up to the max length
const WORD_LENGTH_THRESHOLDS = {
  short: { min: 0, max: 7 },
  medium: { min: 0, max: 14 },
  long: { min: 0, max: 42 },
  all: { min: 0, max: 200 }
};

/**
 * Get a random word with user preferences applied
 * This is the main entry point that should be used instead of getRandomWord
 */
export async function getRandomWordWithPreferences(
  options: WordSelectionOptions = {}
): Promise<GameWord> {
  let difficultyBand = options.difficultyBand;
  let wordLengthFilter = options.wordLengthFilter || 'all';
  let allowObscureWords = options.allowObscureWords ?? true;
  let categoryPreferences = options.categoryPreferences;

  // If userId is provided, load their preferences
  if (options.userId) {
    const preferences = await getUserPreferences(options.userId);

    console.log(`[WordSelection] User ID: ${options.userId}`);
    console.log(`[WordSelection] User Preferences:`, {
      defaultDifficulty: preferences.defaultDifficulty,
      adaptiveCurrentBand: (preferences.adaptiveDifficultyData as any)?.currentBand,
      wordLengthFilter: preferences.wordLengthFilter,
      allowObscureWords: preferences.allowObscureWords
    });

    // Use adaptive difficulty if enabled
    if (options.useAdaptiveDifficulty || preferences.defaultDifficulty === 'adaptive') {
      difficultyBand = await getAdaptiveDifficultyBand(options.userId);
      console.log(`[WordSelection] Using ADAPTIVE difficulty - Band: ${difficultyBand}`);
    } else if (!difficultyBand) {
      // Map difficulty level to band
      difficultyBand = mapDifficultyToband(preferences.defaultDifficulty);
      console.log(`[WordSelection] Using FIXED difficulty (${preferences.defaultDifficulty}) - Band: ${difficultyBand}`);
    }

    // Apply user preferences if not explicitly overridden
    wordLengthFilter = options.wordLengthFilter || preferences.wordLengthFilter;
    allowObscureWords = options.allowObscureWords ?? preferences.allowObscureWords;
    categoryPreferences = options.categoryPreferences || (preferences.categoryPreferences as string[] | undefined);

    // Normalize category preferences - expand group keys to lexdomain names if in simple mode
    if (categoryPreferences && categoryPreferences.length > 0) {
      const categoryMode = preferences.categoryMode || 'simple';

      if (categoryMode === 'simple') {
        // Expand group keys to lexdomain names
        const expandedNames = await categoryGroupService.expandGroupKeysToLexdomainNames(
          categoryPreferences
        );

        if (expandedNames.length > 0) {
          categoryPreferences = expandedNames;
          console.log(`[WordSelection] Expanded ${categoryMode} mode categories:`, categoryPreferences);
        } else {
          console.warn(`[WordSelection] No lexdomains found for group keys:`, categoryPreferences);
        }
      } else {
        console.log(`[WordSelection] Using advanced mode - category preferences:`, categoryPreferences);
      }
    }
  } else {
    console.log(`[WordSelection] No user ID provided - using defaults or options`);
    console.log(`[WordSelection] Difficulty Band: ${difficultyBand || 'not specified'}`);
  }

  // Build the word selection with filters
  return getFilteredRandomWord(
    difficultyBand,
    wordLengthFilter,
    allowObscureWords,
    categoryPreferences
  );
}

/**
 * Get full POS name from abbreviation
 */
function getPosName(pos?: string): string | undefined {
  if (!pos) return undefined;
  const posMap: Record<string, string> = {
    'n': 'noun',
    'v': 'verb',
    'a': 'adjective',
    'r': 'adverb',
    's': 'adjective'
  };
  return posMap[pos] || pos;
}

/**
 * Return string as-is without capitalization
 */
function capitalizeFirstLetter(str: string): string {
  return str;
}

/**
 * Clean word (use cased form if available)
 */
function cleanWord(word: WordData): string {
  return word.casedwordid && word.casedwordid > 0 && word.cased
    ? word.cased
    : word.lemma;
}

/**
 * Get a random word with specific filters applied
 */
async function getFilteredRandomWord(
  difficultyBand?: number,
  wordLengthFilter: WordLengthFilter = 'all',
  allowObscureWords: boolean = true,
  categoryPreferences?: string[]
): Promise<GameWord> {
  const maxAttempts = 50; // Increased to handle edge cases like long words in lower bands

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Build WHERE clause for filtering
    const whereClause: any = {};

    // Apply difficulty filter using the calculated difficulty table
    // This ensures consistency with what's displayed to users
    if (difficultyBand) {
      whereClause.wordigo_difficulty_calculated = {
        difficulty_band: difficultyBand
      };
    }

    // Apply word length filter
    // Note: Word length filtering is done in application layer after fetching
    // (See lines 173-181 below)

    // Apply category preferences (lexical domains)
    if (categoryPreferences && categoryPreferences.length > 0) {
      // Get lexdomainids for the selected categories
      const domains = await prisma.lexdomains.findMany({
        where: {
          lexdomainname: { in: categoryPreferences }
        },
        select: { lexdomainid: true }
      });

      const domainIds = domains.map(d => d.lexdomainid);
      if (domainIds.length > 0) {
        whereClause.synsets = {
          lexdomainid: { in: domainIds }
        };
      }
    }

    // Apply obscure words filter (word_in_definition)
    if (!allowObscureWords) {
      if (!whereClause.wordigo_difficulty_calculated) {
        whereClause.wordigo_difficulty_calculated = {};
      }
      // Exclude words that appear in their own definition (they're easier)
      // Also could filter by tagcount (rare words have low tagcount)
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { wordigo_difficulty_calculated: { word_in_definition: false } },
            { wordigo_difficulty_calculated: { word_in_definition: null } }
          ]
        }
      ];
    }

    // Get matching senses count
    const matchingSensesCount = await prisma.senses.count({ where: whereClause });

    console.log(`Found ${matchingSensesCount} senses matching filters:`, {
      difficultyBand,
      wordLengthFilter,
      allowObscureWords,
      categoryPreferences
    });

    if (matchingSensesCount === 0) {
      // No matches with current filters - fall back to basic selection
      console.warn('No words match the current filters, using basic random word');
      return getBasicRandomWord(difficultyBand);
    }

    // Pick a random sense from the filtered results
    const randomOffset = Math.floor(Math.random() * Math.min(matchingSensesCount, 10000));

    const selectedSenses = await prisma.senses.findMany({
      where: whereClause,
      include: {
        words: true,
        synsets: {
          include: {
            lexdomains: true
          }
        },
        casedwords: true,
        wordigo_difficulty_calculated: true
      },
      skip: randomOffset,
      take: 1
    });

    if (selectedSenses.length === 0) {
      continue; // Try again
    }

    const selectedSense = selectedSenses[0];

    // Apply word length filter in application layer (more accurate)
    if (wordLengthFilter !== 'all') {
      const wordLength = selectedSense.words.lemma.length;
      const threshold = WORD_LENGTH_THRESHOLDS[wordLengthFilter];

      if (wordLength < threshold.min || wordLength > threshold.max) {
        continue; // Try again
      }
    }

    // Build the GameWord from this sense
    const calculatedDiff = selectedSense.wordigo_difficulty_calculated;
    const correctPos = selectedSense.synsets.pos;

    const correctWordData: WordData = {
      wordid: selectedSense.words.wordid,
      lemma: selectedSense.words.lemma,
      cased: selectedSense.casedwords?.cased,
      definition: selectedSense.synsets.definition,
      casedwordid: selectedSense.casedwordid,
      synsetid: selectedSense.synsetid,
      senseid: selectedSense.senseid,
      lexdomainid: selectedSense.synsets.lexdomainid,
      lexdomainname: selectedSense.synsets.lexdomains.lexdomainname,
      pos: correctPos,
      posName: getPosName(correctPos),
      word_in_definition: calculatedDiff?.word_in_definition ?? null,
      def_num_chars: calculatedDiff?.def_char_count ?? null,
      overall_difficulty_score: calculatedDiff?.overall_difficulty_score ? Number(calculatedDiff.overall_difficulty_score) : null,
      difficulty_band: calculatedDiff?.difficulty_band ?? null,
    };

    // Get wrong definitions with the same length filter applied
    const wrongWords = await getWrongDefinitionsWithFilter(
      correctWordData,
      difficultyBand,
      wordLengthFilter,
      allowObscureWords,
      categoryPreferences
    );

    // Random definition order (0-3, which position has the correct answer)
    const defOrder = Math.floor(Math.random() * 4);

    // Calculate timer based on character count
    const DEF_NUM_CHAR_BAND_MULTIPLIER = 15;
    const defCharCount = correctWordData.def_num_chars || 50;
    const charBand = defCharCount < 40 ? 1 : defCharCount < 80 ? 2 : 3;
    const timer = charBand * DEF_NUM_CHAR_BAND_MULTIPLIER;

    // Fetch pronunciation data for the correct word
    const wordText = cleanWord(correctWordData);
    const pronunciation = await fetchPronunciationData(wordText);

    // Build the complete game word
    return {
      correctWord: {
        ...correctWordData,
        word: wordText,
        goodDefinition: capitalizeFirstLetter(correctWordData.definition),
        strategy: 'correct',
        pronunciation,
      },
      wrongWords,
      defOrder,
      timer
    };
  }

  // If all attempts failed, fall back to basic random word
  console.warn('Could not find word matching all filters after multiple attempts, using basic random');
  return getBasicRandomWord(difficultyBand);
}

/**
 * Get wrong definitions with word length filter applied
 * This ensures all wrong definitions match the same length criteria as the correct word
 * and optionally filters by category preferences
 */
async function getWrongDefinitionsWithFilter(
  correctWordData: WordData,
  difficultyBand?: number,
  wordLengthFilter: WordLengthFilter = 'all',
  allowObscureWords: boolean = true,
  categoryPreferences?: string[]
): Promise<Array<WordData & { word: string; badDefinition: string; strategy: string; pronunciation?: any }>> {
  const wrongWords: Array<WordData & { word: string; badDefinition: string; strategy: string; pronunciation?: any }> = [];
  const excludedSynsetIds: number[] = [correctWordData.synsetid];
  const threshold = WORD_LENGTH_THRESHOLDS[wordLengthFilter];

  console.log(`[WrongDefs] Getting wrong definitions with filters:`, {
    strategy: WRONG_DEFINITION_STRATEGY,
    wordLengthFilter: `${wordLengthFilter} (${threshold.min}-${threshold.max} chars)`,
    difficultyBand,
    allowObscureWords,
    categoryPreferences
  });

  // Build WHERE clause for category filtering
  let categoryDomainIds: number[] | undefined;
  if (categoryPreferences && categoryPreferences.length > 0) {
    const domains = await prisma.lexdomains.findMany({
      where: {
        lexdomainname: { in: categoryPreferences }
      },
      select: { lexdomainid: true }
    });
    categoryDomainIds = domains.map(d => d.lexdomainid);
    console.log(`[WrongDefs] Filtering to ${categoryDomainIds.length} category domains`);
  }

  // Get 3 wrong definitions using the selected strategy
  let wrongDefResults: any[];

  if (WRONG_DEFINITION_STRATEGY === 'linguist') {
    // Use the new linguist system
    console.log(`[WrongDefs] Using LINGUIST strategy for level ${difficultyBand}`);

    const linguistResults = await getLinguistWrongDefinitions(
      correctWordData,
      difficultyBand || 3,
      {
        wordLengthFilter,
        categoryDomainIds,
        allowObscureWords,
        excludeSynsetIds: excludedSynsetIds,
        excludeLemmas: [correctWordData.lemma.toLowerCase()]
      }
    );

    // Convert linguist results to expected format
    wrongDefResults = linguistResults.map(lr => ({
      word: lr.word,
      strategy: lr.strategy
    }));

  } else {
    // Use the current/original system
    console.log(`[WrongDefs] Using CURRENT strategy`);

    wrongDefResults = await getWrongDefinitions(correctWordData, difficultyBand, {
      wordLengthFilter,
      categoryDomainIds,
      allowObscureWords
    });
  }

  // Convert results to the format expected by this service
  for (const wrongDef of wrongDefResults) {
    const wrongWord = cleanWord(wrongDef.word);
    const pronunciation = await fetchPronunciationData(wrongWord);

    wrongWords.push({
      ...wrongDef.word,
      word: wrongWord,
      badDefinition: capitalizeFirstLetter(wrongDef.word.definition),
      strategy: wrongDef.strategy,
      pronunciation,
    });
    excludedSynsetIds.push(wrongDef.word.synsetid);
  }

  // Fill any missing slots with random fallback words
  while (wrongWords.length < 3) {
    console.warn(`[WrongDefs] Missing wrong definition ${wrongWords.length + 1}, using fallback`);
    const fallbackWord = await getBasicRandomWord(difficultyBand);
    const fallback = fallbackWord.wrongWords[wrongWords.length];
    wrongWords.push({
      ...fallback,
      strategy: `${fallback.strategy}_fallback`
    });
    excludedSynsetIds.push(fallback.synsetid);
  }

  return wrongWords;
}

/**
 * Map difficulty level string to difficulty band number
 */
function mapDifficultyToband(difficulty: string): number {
  const map: Record<string, number> = {
    'easy': 1,
    'less_easy': 2,
    'medium': 3,
    'hard': 4,
    'hardest': 5,
    'adaptive': 3 // default to medium
  };

  return map[difficulty] || 3;
}

/**
 * Get word statistics for a user based on their preferences
 */
export async function getWordPoolStatistics(
  options: WordSelectionOptions = {}
): Promise<{
  totalMatchingWords: number;
  difficultyBand?: number;
  filters: {
    wordLengthFilter: string;
    allowObscureWords: boolean;
    categories?: string[];
  }
}> {
  let difficultyBand = options.difficultyBand;
  let wordLengthFilter = options.wordLengthFilter || 'all';
  let allowObscureWords = options.allowObscureWords ?? true;
  let categoryPreferences = options.categoryPreferences;

  // If userId is provided, load their preferences
  if (options.userId) {
    const preferences = await getUserPreferences(options.userId);

    if (preferences.defaultDifficulty === 'adaptive') {
      difficultyBand = await getAdaptiveDifficultyBand(options.userId);
    } else {
      difficultyBand = mapDifficultyToband(preferences.defaultDifficulty);
    }

    wordLengthFilter = preferences.wordLengthFilter;
    allowObscureWords = preferences.allowObscureWords;
    categoryPreferences = preferences.categoryPreferences as string[] | undefined;
  }

  // Build WHERE clause
  const whereClause: any = {};

  if (difficultyBand) {
    whereClause.wordigo_difficulty_calculated = {
      difficulty_band: difficultyBand
    };
  }

  if (categoryPreferences && categoryPreferences.length > 0) {
    const domains = await prisma.lexdomains.findMany({
      where: {
        lexdomainname: { in: categoryPreferences }
      },
      select: { lexdomainid: true }
    });

    const domainIds = domains.map(d => d.lexdomainid);
    if (domainIds.length > 0) {
      whereClause.synsets = {
        lexdomainid: { in: domainIds }
      };
    }
  }

  if (!allowObscureWords) {
    if (!whereClause.wordigo_difficulty_calculated) {
      whereClause.wordigo_difficulty_calculated = {};
    }
    whereClause.AND = [
      ...(whereClause.AND || []),
      {
        OR: [
          { wordigo_difficulty_calculated: { word_in_definition: false } },
          { wordigo_difficulty_calculated: { word_in_definition: null } }
        ]
      }
    ];
  }

  const count = await prisma.senses.count({ where: whereClause });

  return {
    totalMatchingWords: count,
    difficultyBand,
    filters: {
      wordLengthFilter,
      allowObscureWords,
      categories: categoryPreferences
    }
  };
}

export default {
  getRandomWordWithPreferences,
  getWordPoolStatistics
};

