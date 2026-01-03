/**
 * Wrong Definition Service
 *
 * Centralized logic for selecting wrong definitions using various strategies.
 * This service is the single source of truth for wrong definition selection.
 */

import { WordData } from './wordService';
import { getNearSynonymWord, getRandomDifferentDomain } from './wordService';

export interface WrongDefinitionFilters {
  wordLengthFilter?: 'short' | 'medium' | 'long' | 'all';
  categoryDomainIds?: number[];
  allowObscureWords?: boolean;
}

interface WrongDefinitionResult {
  word: WordData;
  strategy: string;
}

const WORD_LENGTH_THRESHOLDS = {
  short: { min: 0, max: 6 },
  medium: { min: 7, max: 12 },
  long: { min: 13, max: 100 },
  all: { min: 0, max: 200 }
};

/**
 * Get 3 wrong definitions using sophisticated selection strategies.
 *
 * Strategy 1: Near-synonym (semantically related, teaches fine distinctions)
 * Strategy 2: Near-synonym (another semantically related word)
 * Strategy 3: Random different domain (same difficulty, different category)
 *
 * @param correctWord The correct word to find wrong definitions for
 * @param difficultyBand The target difficulty band
 * @param filters Optional filters for word length and categories
 * @returns Array of 3 wrong definitions with their strategies
 */
export async function getWrongDefinitions(
  correctWord: WordData,
  difficultyBand?: number | null,
  filters: WrongDefinitionFilters = {}
): Promise<WrongDefinitionResult[]> {
  const wrongWords: WrongDefinitionResult[] = [];
  const excludedSynsetIds: number[] = [correctWord.synsetid];

  const casedOperator = correctWord.casedwordid && correctWord.casedwordid > 0 ? 'gt' : 'equals';
  const { wordLengthFilter = 'all', categoryDomainIds } = filters;
  const threshold = WORD_LENGTH_THRESHOLDS[wordLengthFilter];

  // Helper function to check if a word passes filters
  const passesFilters = (word: WordData): boolean => {
    const wordLength = word.lemma.length;
    const meetsLengthFilter = wordLengthFilter === 'all' ||
      (wordLength >= threshold.min && wordLength <= threshold.max);
    const meetsCategoryFilter = !categoryDomainIds || categoryDomainIds.length === 0 ||
      categoryDomainIds.includes(word.lexdomainid);

    return meetsLengthFilter && meetsCategoryFilter;
  };

  // Strategy 1: Near-synonym
  let nearSynonym1 = await getNearSynonymWord(correctWord, excludedSynsetIds, casedOperator, difficultyBand);

  if (nearSynonym1 && !passesFilters(nearSynonym1)) {
    console.log(`[WrongDefs] Near-synonym "${nearSynonym1.lemma}" filtered out (length: ${nearSynonym1.lemma.length}, domain: ${nearSynonym1.lexdomainid})`);
    nearSynonym1 = null;
  }

  if (nearSynonym1) {
    wrongWords.push({
      word: nearSynonym1,
      strategy: nearSynonym1.strategy || 'near_synonym'
    });
    excludedSynsetIds.push(nearSynonym1.synsetid);
    console.log(`[WrongDefs] Strategy 1 - Found near-synonym: ${nearSynonym1.lemma} (${nearSynonym1.lemma.length} chars, domain: ${nearSynonym1.lexdomainid})`);
  } else {
    // Fallback handled below
    console.warn(`[WrongDefs] Strategy 1 - No near-synonym found, will use fallback`);
  }

  // Strategy 2: Near-synonym (different from Strategy 1)
  let nearSynonym2 = await getNearSynonymWord(correctWord, excludedSynsetIds, casedOperator, difficultyBand);

  if (nearSynonym2 && !passesFilters(nearSynonym2)) {
    console.log(`[WrongDefs] Near-synonym "${nearSynonym2.lemma}" filtered out (length: ${nearSynonym2.lemma.length}, domain: ${nearSynonym2.lexdomainid})`);
    nearSynonym2 = null;
  }

  if (nearSynonym2) {
    wrongWords.push({
      word: nearSynonym2,
      strategy: nearSynonym2.strategy || 'near_synonym'
    });
    excludedSynsetIds.push(nearSynonym2.synsetid);
    console.log(`[WrongDefs] Strategy 2 - Found near-synonym: ${nearSynonym2.lemma} (${nearSynonym2.lemma.length} chars, domain: ${nearSynonym2.lexdomainid})`);
  } else {
    console.warn(`[WrongDefs] Strategy 2 - No near-synonym found, will use fallback`);
  }

  // Strategy 3: Random different domain
  let randomDiff = await getRandomDifferentDomain(correctWord, excludedSynsetIds, casedOperator, difficultyBand);

  if (randomDiff && !passesFilters(randomDiff)) {
    console.log(`[WrongDefs] Random different domain "${randomDiff.lemma}" filtered out (length: ${randomDiff.lemma.length}, domain: ${randomDiff.lexdomainid})`);
    randomDiff = null;
  }

  if (randomDiff) {
    wrongWords.push({
      word: randomDiff,
      strategy: randomDiff.strategy || 'random_different_domain'
    });
    excludedSynsetIds.push(randomDiff.synsetid);
    console.log(`[WrongDefs] Strategy 3 - Found random different domain: ${randomDiff.lemma} (${randomDiff.lemma.length} chars, domain: ${randomDiff.lexdomainid})`);
  } else {
    console.warn(`[WrongDefs] Strategy 3 - No random different domain found, will use fallback`);
  }

  // Fill any missing slots with fallback words
  // Note: We don't use getBasicRandomWord here to avoid circular dependency
  // Instead, we'll let the caller handle fallbacks if needed
  // For now, we return what we have and the caller can decide how to handle missing definitions

  return wrongWords;
}

/**
 * Check if we have all 3 required wrong definitions
 */
export function hasAllWrongDefinitions(wrongDefs: WrongDefinitionResult[]): boolean {
  return wrongDefs.length === 3;
}
