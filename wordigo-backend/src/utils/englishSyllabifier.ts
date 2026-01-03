/**
 * English Syllabification Utilities
 *
 * Splits English words into syllables based on a target syllable count
 * using vowel positions and common English syllable patterns.
 */

/**
 * Split an English word into syllables based on a target count
 *
 * Strategy:
 * 1. Find all vowel positions (natural syllable nuclei)
 * 2. Distribute consonants between vowels
 * 3. Apply common English syllabification rules
 *
 * @param word - The English word to syllabify
 * @param targetSyllableCount - The expected number of syllables (from CMUDict)
 * @returns Array of syllables
 */
export function syllabifyEnglishWord(word: string, targetSyllableCount: number): string[] {
  if (!word || targetSyllableCount < 1) {
    return [word];
  }

  const lowerWord = word.toLowerCase();

  // Single syllable - return as is
  if (targetSyllableCount === 1) {
    return [word];
  }

  // Find vowel positions (a, e, i, o, u, y when not at start)
  const vowelIndices: number[] = [];
  const vowelPattern = /[aeiouy]/;

  for (let i = 0; i < lowerWord.length; i++) {
    const char = lowerWord[i];
    const isVowel = vowelPattern.test(char);

    // 'y' is a vowel only when not at the start
    if (char === 'y' && i === 0) {
      continue;
    }

    // Skip vowels that are part of common digraphs at the end
    if (isVowel) {
      // Skip silent 'e' at the end
      if (i === lowerWord.length - 1 && char === 'e' && vowelIndices.length > 0) {
        // Check if this is likely a silent e
        const prevChar = lowerWord[i - 1];
        if (!/[aeiou]/.test(prevChar)) {
          continue; // Skip silent 'e'
        }
      }

      // Skip if part of a vowel pair (like 'ea', 'ai', 'oo')
      if (i > 0 && /[aeiou]/.test(lowerWord[i - 1])) {
        continue; // Part of a diphthong
      }

      vowelIndices.push(i);
    }
  }

  // If we don't have enough vowel groups, fall back to simple division
  if (vowelIndices.length < targetSyllableCount) {
    return fallbackSyllabify(word, targetSyllableCount);
  }

  // Select which vowels to use as syllable breaks
  const selectedVowels = selectVowelBreaks(vowelIndices, targetSyllableCount);

  // Split the word at the selected positions
  const syllables: string[] = [];
  let start = 0;

  for (let i = 0; i < selectedVowels.length; i++) {
    const vowelPos = selectedVowels[i];

    if (i === selectedVowels.length - 1) {
      // Last syllable - take everything remaining
      syllables.push(word.substring(start));
    } else {
      // Find the break point between this vowel and the next
      const nextVowelPos = selectedVowels[i + 1];
      const breakPoint = findBreakPoint(lowerWord, vowelPos, nextVowelPos);

      syllables.push(word.substring(start, breakPoint));
      start = breakPoint;
    }
  }

  return syllables.filter(s => s.length > 0);
}

/**
 * Select which vowel positions to use as syllable nuclei
 */
function selectVowelBreaks(vowelIndices: number[], targetCount: number): number[] {
  if (vowelIndices.length === targetCount) {
    return vowelIndices;
  }

  if (vowelIndices.length < targetCount) {
    return vowelIndices;
  }

  // More vowels than syllables - need to skip some
  // Evenly distribute which vowels to keep
  const selected: number[] = [];
  const step = vowelIndices.length / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const index = Math.floor(i * step);
    selected.push(vowelIndices[index]);
  }

  return selected;
}

/**
 * Find the best break point between two vowels
 *
 * Rules:
 * - VC-CV: Break between consonants (bet-ter)
 * - V-CV: Break before consonant if single (o-pen)
 * - VC-V: Break after consonant before vowel (nev-er)
 */
function findBreakPoint(word: string, vowel1Pos: number, vowel2Pos: number): number {
  const between = word.substring(vowel1Pos + 1, vowel2Pos);

  // No consonants between - break right before the second vowel
  if (between.length === 0 || /^[aeiou]+$/.test(between)) {
    return vowel2Pos;
  }

  // Count consonants between vowels
  const consonants = between.replace(/[aeiou]/g, '');

  if (consonants.length === 0) {
    // All vowels - break before second vowel
    return vowel2Pos;
  } else if (consonants.length === 1) {
    // Single consonant - break before it (V-CV)
    return vowel1Pos + 1 + between.indexOf(consonants[0]);
  } else {
    // Multiple consonants - break between them (VC-CV)
    const breakPos = vowel1Pos + 1 + Math.ceil(consonants.length / 2);
    return Math.min(breakPos, vowel2Pos);
  }
}

/**
 * Fallback: simple division by character count
 */
function fallbackSyllabify(word: string, targetCount: number): string[] {
  const avgLength = word.length / targetCount;
  const syllables: string[] = [];

  let start = 0;
  for (let i = 0; i < targetCount - 1; i++) {
    const end = Math.round(start + avgLength);
    syllables.push(word.substring(start, end));
    start = end;
  }

  syllables.push(word.substring(start));

  return syllables.filter(s => s.length > 0);
}

/**
 * Format syllables for display
 */
export function formatEnglishSyllables(syllables: string[], separator: string = '·'): string {
  return syllables.join(separator);
}
