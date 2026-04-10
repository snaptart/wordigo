/**
 * Word Lookup Service
 *
 * Handles word dictionary lookups with user history
 */

import { PrismaClient } from '@prisma/client';
import type { WordLookupResponse } from '../controllers/wordLookupController';
import {
  parseSyllablesFromIPA,
  formatSyllablesForDisplay,
  getSyllableCountAlgorithmic
} from '../utils/pronunciationUtils';
import {
  syllabifyEnglishWord,
  formatEnglishSyllables
} from '../utils/englishSyllabifier';

const prisma = new PrismaClient();

/**
 * Look up a word and return all its definitions, examples, and user history
 */
export async function lookupWord(
  word: string,
  userId?: number
): Promise<WordLookupResponse | null> {
  try {
    console.log('lookupWord service called with:', word, userId);

    // Find the word in the database
    const wordRecord = await prisma.words.findFirst({
      where: {
        lemma: word,
      },
    });

    console.log('Word record found:', wordRecord);

    if (!wordRecord) {
      return null;
    }

    // Get all senses (definitions) for this word
    const senses = await prisma.senses.findMany({
      where: {
        wordid: wordRecord.wordid,
      },
      include: {
        synsets: {
          include: {
            lexdomains: true,
            samples: true, // Get example sentences from synsets
          },
        },
        wordigo_difficulty_calculated: true,
      },
      orderBy: {
        senseid: 'asc',
      },
      take: 10, // Limit to first 10 senses to avoid huge responses
    });

    console.log(`Found ${senses.length} senses`);

    if (senses.length === 0) {
      return null;
    }

    // Helper function to get POS full name
    const getPosName = (pos: string): string => {
      const posMap: Record<string, string> = {
        'n': 'noun',
        'v': 'verb',
        'a': 'adjective',
        'r': 'adverb',
        's': 'adjective'
      };
      return posMap[pos] || pos;
    };

    // Extract definitions with examples and POS
    const definitions = senses
      .filter((sense) => sense.synsets && sense.synsets.definition)
      .map((sense) => ({
        id: sense.senseid,
        definition: sense.synsets.definition,
        example: sense.synsets.samples?.[0]?.sample || undefined,
        lexdomainName: sense.synsets.lexdomains?.lexdomainname || 'Unknown',
        pos: sense.synsets.pos,
        posName: getPosName(sense.synsets.pos),
      }));

    console.log(`Extracted ${definitions.length} definitions`);

    // Collect all unique examples from all senses
    const allExamples = senses
      .flatMap((sense) => {
        if (!sense.synsets || !sense.synsets.samples) return [];
        return sense.synsets.samples.map((s) => s.sample);
      })
      .filter((example): example is string => example !== null && example !== undefined)
      .slice(0, 5); // Limit to 5 examples

    console.log(`Collected ${allExamples.length} examples`);

    // Calculate average difficulty
    const difficultyScores = senses
      .map((s) => s.wordigo_difficulty_calculated?.difficulty_band)
      .filter((band): band is number => band !== null && band !== undefined);

    let difficulty: string | undefined = undefined;
    if (difficultyScores.length > 0) {
      const avgDifficulty =
        difficultyScores.reduce((sum, band) => sum + band, 0) / difficultyScores.length;

      // Map difficulty band to label (based on presets)
      if (avgDifficulty <= 2) {
        difficulty = 'easy';
      } else if (avgDifficulty <= 4) {
        difficulty = 'intermediate';
      } else {
        difficulty = 'hard';
      }
    }

    // Get pronunciation data (IPA)
    let pronunciation: WordLookupResponse['pronunciation'] = undefined;
    const pronunciationRecords = await prisma.wordigo_pronunciations.findMany({
      where: {
        word: word,
      },
      take: 1, // Get the first pronunciation (some words have multiple)
    });

    // Get syllable data (CMUDict)
    const cmudictRecord = await prisma.wordigo_cmudict_syllables.findFirst({
      where: {
        word: word,
      },
    });

    if (pronunciationRecords.length > 0) {
      const ipa = pronunciationRecords[0].ipa;

      // Use CMUDict syllable count if available (more accurate)
      let syllableCount = 0;
      let syllables: string[] = [];
      let formattedSyllables = '';

      if (cmudictRecord) {
        // Use accurate CMUDict syllable data + English syllabification
        syllableCount = cmudictRecord.syllable_count;

        // Generate English syllables from the word
        const englishSyllables = syllabifyEnglishWord(word, syllableCount);
        syllables = englishSyllables;
        formattedSyllables = formatEnglishSyllables(englishSyllables);
      } else {
        // Fall back to IPA parsing
        const parsed = parseSyllablesFromIPA(ipa);
        syllableCount = parsed.syllableCount;
        syllables = parsed.syllables;
        formattedSyllables = formatSyllablesForDisplay(
          parsed.syllables,
          parsed.primaryStress,
          parsed.secondaryStress
        );
      }

      pronunciation = {
        ipa,
        syllables,
        syllableCount,
        formattedSyllables,
      };
    } else if (cmudictRecord) {
      // Have CMUDict but no IPA - generate English syllables
      const englishSyllables = syllabifyEnglishWord(word, cmudictRecord.syllable_count);
      pronunciation = {
        ipa: '', // No IPA available
        syllables: englishSyllables,
        syllableCount: cmudictRecord.syllable_count,
        formattedSyllables: formatEnglishSyllables(englishSyllables),
      };
    } else {
      // Fallback: Use algorithmic syllable counting
      const syllableCount = getSyllableCountAlgorithmic(word);
      if (syllableCount > 0) {
        const englishSyllables = syllabifyEnglishWord(word, syllableCount);
        pronunciation = {
          ipa: '',
          syllables: englishSyllables,
          syllableCount,
          formattedSyllables: formatEnglishSyllables(englishSyllables),
        };
      }
    }

    // Get user history if userId is provided
    let userHistory: WordLookupResponse['userHistory'] = undefined;
    if (userId) {
      // Get all sense IDs for this word
      const sensesForWord = senses.map(s => s.senseid);

      // Get all history records for this user where they encountered any sense of this word
      const historyRecords = await prisma.wordigo_history.findMany({
        where: {
          userID: userId,
          senseid: {
            in: sensesForWord,
          },
        },
        orderBy: {
          createTs: 'desc',
        },
      });

      if (historyRecords.length > 0) {
        const timesEncountered = historyRecords.length;
        // wordigoResult === 4 means correct answer
        const timesCorrect = historyRecords.filter((h) => h.wordigoResult === 4).length;
        const lastSeen = historyRecords[0].createTs;

        userHistory = {
          timesEncountered,
          timesCorrect,
          lastSeen,
        };
      }
    }

    return {
      word,
      definitions,
      difficulty,
      examples: allExamples.length > 0 ? allExamples : undefined,
      pronunciation,
      userHistory,
    };
  } catch (error) {
    console.error('Error in lookupWord service:', error);
    throw error;
  }
}
