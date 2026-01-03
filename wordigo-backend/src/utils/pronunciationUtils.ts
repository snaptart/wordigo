/**
 * Pronunciation and Syllable Utilities
 *
 * Provides functions for:
 * - Parsing syllables from IPA notation
 * - Counting syllables algorithmically (fallback)
 * - Formatting pronunciation data for display
 */

import { syllable } from 'syllable';

/**
 * Parse syllables from IPA notation
 *
 * Strategy: Each vowel in IPA = one syllable
 * Stress markers (ˈ ˌ) and periods (.) help divide syllables
 *
 * Common IPA vowels: a, e, i, o, u, ə, ɑ, ɛ, ɪ, ɔ, ʊ, æ, ʌ, ɜ, ɝ, etc.
 *
 * Examples:
 * - /əˈbændən/ has 3 vowels → 3 syllables: a-ban-don
 * - /ˈdɪkʃəˌnɛɹi/ has 4 vowels → 4 syllables: dic-tion-ar-y
 */
export function parseSyllablesFromIPA(ipa: string): {
  syllables: string[];
  syllableCount: number;
  primaryStress?: number; // Index of primary stressed syllable (0-based)
  secondaryStress?: number; // Index of secondary stressed syllable (0-based)
} {
  // Remove leading/trailing slashes
  let cleaned = ipa.replace(/^\/|\/$/g, '').trim();

  // IPA vowel characters
  const vowelPattern = /[aeiouəɑɛɪɔʊæʌɜɝɐɒʉɨɵøœɶɞʏ]/i;

  // Count total vowels (= syllable count)
  const vowelCount = (cleaned.match(new RegExp(vowelPattern, 'gi')) || []).length;

  // Find stress positions by tracking vowels
  let primaryStressIndex: number | undefined = undefined;
  let secondaryStressIndex: number | undefined = undefined;
  let syllablesSoFar = 0;
  let nextVowelIsPrimaryStress = false;
  let nextVowelIsSecondaryStress = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (char === 'ˈ') {
      nextVowelIsPrimaryStress = true;
    } else if (char === 'ˌ') {
      nextVowelIsSecondaryStress = true;
    } else if (vowelPattern.test(char)) {
      if (nextVowelIsPrimaryStress) {
        primaryStressIndex = syllablesSoFar;
        nextVowelIsPrimaryStress = false;
      }
      if (nextVowelIsSecondaryStress) {
        secondaryStressIndex = syllablesSoFar;
        nextVowelIsSecondaryStress = false;
      }
      syllablesSoFar++;
    }
  }

  // Split into syllables using stress markers and periods
  // This is for display purposes - it's an approximation
  const syllables: string[] = [];
  let currentSyllable = '';

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if ((char === 'ˈ' || char === 'ˌ') && currentSyllable.length > 0) {
      // Stress marker - finish current syllable
      syllables.push(currentSyllable);
      currentSyllable = '';
    } else if (char === '.') {
      // Explicit syllable boundary
      if (currentSyllable.length > 0) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    } else if (char !== 'ˈ' && char !== 'ˌ') {
      currentSyllable += char;
    }
  }

  if (currentSyllable.length > 0) {
    syllables.push(currentSyllable);
  }

  // If we don't have the right number of syllables from stress/period splits,
  // fall back to splitting by vowels
  if (syllables.length !== vowelCount) {
    // Alternative: split by detecting vowel positions
    syllables.length = 0;
    currentSyllable = '';
    let seenVowelInCurrent = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (char === 'ˈ' || char === 'ˌ' || char === '.') {
        continue; // Skip markers
      }

      const isVowel = vowelPattern.test(char);

      if (isVowel && seenVowelInCurrent) {
        // Starting a new syllable
        syllables.push(currentSyllable);
        currentSyllable = char;
        seenVowelInCurrent = true;
      } else {
        currentSyllable += char;
        if (isVowel) {
          seenVowelInCurrent = true;
        }
      }
    }

    if (currentSyllable.length > 0) {
      syllables.push(currentSyllable);
    }
  }

  return {
    syllables: syllables.filter(s => s.length > 0),
    syllableCount: vowelCount, // Use vowel count as the authoritative syllable count
    primaryStress: primaryStressIndex,
    secondaryStress: secondaryStressIndex
  };
}

/**
 * Get syllable count for a word using algorithmic approach (fallback)
 *
 * Uses the 'syllable' npm package which provides reasonably accurate
 * syllable counting for English words.
 */
export function getSyllableCountAlgorithmic(word: string): number {
  return syllable(word);
}

/**
 * Format syllables for display with stress markers
 *
 * Examples:
 * - syllables: ["ə", "bæn", "dən"], primaryStress: 1 → "ə·BÆN·dən"
 * - syllables: ["tɹɪ", "pə", "ɫeɪ"], primaryStress: 2 → "tɹɪ·pə·ƫEɪ"
 */
export function formatSyllablesForDisplay(
  syllables: string[],
  primaryStress?: number,
  secondaryStress?: number,
  separator: string = '·'
): string {
  return syllables
    .map((syllable, index) => {
      if (index === primaryStress) {
        return syllable.toUpperCase(); // Primary stress - uppercase
      } else if (index === secondaryStress) {
        return syllable.toLowerCase(); // Secondary stress - keep lowercase
      }
      return syllable;
    })
    .join(separator);
}

/**
 * Divide a word into syllables for display
 *
 * This uses the IPA syllables to create a phonetic syllable division
 * of the original word (approximation).
 */
export function divideWordIntoSyllables(word: string, syllableCount: number): string[] {
  // This is an approximation - we'll use algorithmic division
  // since we can't always perfectly map IPA syllables to English spelling

  // Simple heuristic: divide roughly by syllable count
  const avgLength = word.length / syllableCount;
  const syllables: string[] = [];

  let start = 0;
  for (let i = 0; i < syllableCount - 1; i++) {
    const end = Math.round(start + avgLength);
    syllables.push(word.substring(start, end));
    start = end;
  }

  // Add remaining part as last syllable
  syllables.push(word.substring(start));

  return syllables;
}

/**
 * Get complete pronunciation info for a word
 */
export interface PronunciationInfo {
  word: string;
  ipa: string;
  syllables: string[];
  syllableCount: number;
  primaryStress?: number;
  secondaryStress?: number;
  formattedSyllables: string;
  approximateWordSyllables?: string[]; // Spelling syllables (approximation)
}

export function getPronunciationInfo(
  word: string,
  ipa: string
): PronunciationInfo {
  const { syllables, syllableCount, primaryStress, secondaryStress } =
    parseSyllablesFromIPA(ipa);

  const formattedSyllables = formatSyllablesForDisplay(
    syllables,
    primaryStress,
    secondaryStress
  );

  const approximateWordSyllables = divideWordIntoSyllables(word, syllableCount);

  return {
    word,
    ipa,
    syllables,
    syllableCount,
    primaryStress,
    secondaryStress,
    formattedSyllables,
    approximateWordSyllables
  };
}
