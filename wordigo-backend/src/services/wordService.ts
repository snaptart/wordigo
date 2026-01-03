/**
 * Word Service
 *
 * Core word selection and definition matching logic
 * Ported from functions.wordigo.php
 */

import { PrismaClient } from '@prisma/client';
import { getWrongDefinitions } from './wrongDefinitionService';

const prisma = new PrismaClient();

// Constants from original PHP
const TOTAL_WORDS = 147478;
const DEF_NUM_CHAR_BAND_MULTIPLIER = 15; // Timer multiplier (15s per band)

interface WordData {
  wordid: number;
  lemma: string;
  cased?: string | null;
  definition: string;
  casedwordid?: number | null;
  synsetid: number;
  senseid: number;
  lexdomainid: number;
  lexdomainname: string;
  // All difficulty fields now come from wordigo_difficulty_calculated
  word_in_definition?: boolean | null;
  def_num_chars?: number | null; // Mapped from def_char_count
  overall_difficulty_score?: number | null;
  difficulty_band?: number | null;
  strategy?: string; // Track which selection strategy was used
}

interface GameWord {
  correctWord: WordData & {
    word: string;
    goodDefinition: string;
    strategy: string;
  };
  wrongWords: Array<WordData & {
    word: string;
    badDefinition: string;
    strategy: string;
  }>;
  defOrder: number;
  timer: number;
}

/**
 * Get a random word with correct and wrong definitions
 * Replicates get_word() from functions.wordigo.php:3-116
 *
 * @deprecated Use wordSelectionService.getRandomWordWithPreferences instead.
 * This function is kept for backward compatibility and basic usage without user preferences.
 */
export async function getRandomWord(difficulty?: number): Promise<GameWord> {
  // Pick random word from total (functions.wordigo.php:33)
  const randomWordId = Math.floor(Math.random() * TOTAL_WORDS) + 1;

  // Query word with all joins (functions.wordigo.php:35-62)
  const wordSenses = await prisma.senses.findMany({
    where: {
      wordid: randomWordId,
      // Optional: filter by difficulty using calculated table
      ...(difficulty && {
        wordigo_difficulty_calculated: {
          difficulty_band: difficulty
        }
      })
    },
    include: {
      words: true,
      synsets: {
        include: {
          lexdomains: true
        }
      },
      casedwords: true,
      wordigo_difficulty_calculated: true
    }
  });

  if (wordSenses.length === 0) {
    // Recursively try another word if no senses found
    return getRandomWord(difficulty);
  }

  // Pick random definition if multiple (functions.wordigo.php:71)
  const randomIndex = Math.floor(Math.random() * wordSenses.length);
  const selectedSense = wordSenses[randomIndex];

  // Get calculated difficulty data for this sense
  const calculatedDiff = selectedSense.wordigo_difficulty_calculated;

  // Build correct word object
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
    word_in_definition: calculatedDiff?.word_in_definition ?? null,
    def_num_chars: calculatedDiff?.def_char_count ?? null,
    overall_difficulty_score: calculatedDiff?.overall_difficulty_score ? Number(calculatedDiff.overall_difficulty_score) : null,
    difficulty_band: calculatedDiff?.difficulty_band ?? null,
  };

  // Clean word (functions.wordigo.php:77, cleanWord at 334-339)
  const correctWord = {
    ...correctWordData,
    word: cleanWord(correctWordData),
    goodDefinition: cleanDefinition(correctWordData.definition),
    strategy: 'correct',
  };

  // Get 3 wrong definitions using centralized wrong definition service
  const wrongDefResults = await getWrongDefinitions(correctWordData, correctWordData.difficulty_band);

  // If we don't have all 3 wrong definitions, fill with random fallbacks
  const wrongWords: Array<WordData & { word: string; badDefinition: string; strategy: string }> = [];

  for (const wrongDef of wrongDefResults) {
    wrongWords.push({
      ...wrongDef.word,
      word: cleanWord(wrongDef.word),
      badDefinition: cleanDefinition(wrongDef.word.definition),
      strategy: wrongDef.strategy,
    });
  }

  // Fill any missing slots with random fallback words
  const excludedSynsetIds = [correctWordData.synsetid, ...wrongWords.map(w => w.synsetid)];
  while (wrongWords.length < 3) {
    const randomWordId = Math.floor(Math.random() * TOTAL_WORDS) + 1;
    const randomSenses = await prisma.senses.findMany({
      where: {
        wordid: randomWordId,
        synsetid: { notIn: excludedSynsetIds }
      },
      include: {
        words: true,
        synsets: { include: { lexdomains: true } },
        casedwords: true,
        wordigo_difficulty_calculated: true
      },
      take: 1
    });

    if (randomSenses.length === 0) {
      // If we can't find any random word, try again with a different correct word
      return getRandomWord(difficulty);
    }

    const sense = randomSenses[0];
    const fallbackCalcDiff = sense.wordigo_difficulty_calculated;

    const wrongWordData: WordData = {
      wordid: sense.words.wordid,
      lemma: sense.words.lemma,
      cased: sense.casedwords?.cased,
      definition: sense.synsets.definition,
      casedwordid: sense.casedwordid,
      synsetid: sense.synsetid,
      senseid: sense.senseid,
      lexdomainid: sense.synsets.lexdomainid,
      lexdomainname: sense.synsets.lexdomains.lexdomainname,
      word_in_definition: fallbackCalcDiff?.word_in_definition ?? null,
      def_num_chars: fallbackCalcDiff?.def_char_count ?? null,
      overall_difficulty_score: fallbackCalcDiff?.overall_difficulty_score ? Number(fallbackCalcDiff.overall_difficulty_score) : null,
      difficulty_band: fallbackCalcDiff?.difficulty_band ?? null,
    };

    wrongWords.push({
      ...wrongWordData,
      word: cleanWord(wrongWordData),
      badDefinition: cleanDefinition(wrongWordData.definition),
      strategy: 'fallback_random',
    });

    excludedSynsetIds.push(wrongWordData.synsetid);
  }

  // Random definition order (0-3, which position has the correct answer)
  const defOrder = Math.floor(Math.random() * 4);

  // Calculate timer based on definition character count
  // Short (< 40 chars) = 15s, Medium (40-80) = 30s, Long (> 80) = 45s
  const defCharCount = correctWordData.def_num_chars || 50;
  const charBand = defCharCount < 40 ? 1 : defCharCount < 80 ? 2 : 3;
  const timer = charBand * DEF_NUM_CHAR_BAND_MULTIPLIER;

  return {
    correctWord,
    wrongWords,
    defOrder,
    timer,
  };
}

/**
 * Interface for semantic relationship results from comprehensive query
 */
interface SemanticRelationship {
  wordid: number;
  lemma: string;
  synsetid: number;
  senseid: number;
  definition: string;
  relationship_type: string;
  lexdomainid: number;
  lexdomainname: string;
  difficulty_band: number | null;
  def_char_count: number | null;
  casedwordid: number | null;
  cased: string | null;
  word_in_definition: boolean | null;
  overall_difficulty_score: any; // Decimal from database
}

/**
 * Get all semantically-related words through comprehensive semantic link query
 * This replaces multiple sequential queries with a single comprehensive query
 * that finds ALL related words through ANY semantic link type
 *
 * Based on the SQL pattern:
 * SELECT w2.*, lt.link, s2.definition FROM words w1
 * JOIN senses sen1 ON w1.wordid = sen1.wordid
 * JOIN synsets s1 ON sen1.synsetid = s1.synsetid
 * JOIN semlinks sl ON s1.synsetid = sl.synset1id
 * JOIN synsets s2 ON sl.synset2id = s2.synsetid
 * JOIN senses sen2 ON s2.synsetid = sen2.synsetid
 * JOIN words w2 ON sen2.wordid = w2.wordid
 * JOIN linktypes lt ON sl.linkid = lt.linkid
 */
async function getSemanticRelatedWords(
  correctWord: WordData,
  excludeSynsetIds: number[]
): Promise<SemanticRelationship[]> {
  const excludeList = excludeSynsetIds.length > 0 ? excludeSynsetIds : [-1];

  console.log(`[SemanticQuery] Getting ALL related words for synsetid=${correctWord.synsetid} (no difficulty filter)`);

  // This matches your original SQL query - finds ALL semantic relationships
  // regardless of difficulty band, ensuring we always get semantically-related
  // wrong definitions even if they're easier/harder than the correct word
  const query = `
    SELECT DISTINCT
      w2.wordid,
      w2.lemma,
      s2.synsetid,
      sen2.senseid,
      s2.definition,
      lt.link as relationship_type,
      ld.lexdomainid,
      ld.lexdomainname,
      wdc.difficulty_band,
      wdc.def_char_count,
      sen2.casedwordid,
      cw.cased,
      wdc.word_in_definition,
      wdc.overall_difficulty_score
    FROM synsets s1
    JOIN semlinks sl ON s1.synsetid = sl.synset1id
    JOIN synsets s2 ON sl.synset2id = s2.synsetid
    JOIN linktypes lt ON sl.linkid = lt.linkid
    JOIN lexdomains ld ON s2.lexdomainid = ld.lexdomainid
    JOIN senses sen2 ON s2.synsetid = sen2.synsetid
    JOIN words w2 ON sen2.wordid = w2.wordid
    LEFT JOIN wordigo_difficulty_calculated wdc ON sen2.senseid = wdc.senseid
    LEFT JOIN casedwords cw ON sen2.casedwordid = cw.casedwordid
    WHERE s1.synsetid = $1
      AND s2.synsetid != ALL($2::int[])
    ORDER BY lt.link, w2.lemma
    LIMIT 200
  `;

  const params = [correctWord.synsetid, excludeList];

  const results = await prisma.$queryRawUnsafe<SemanticRelationship[]>(query, ...params);

  const uniqueLinkTypes = new Set(results.map(r => r.relationship_type));
  console.log(`[SemanticQuery] Found ${results.length} related words:`, {
    linkTypes: Array.from(uniqueLinkTypes).join(', '),
    sample: results.slice(0, 5).map(r => `${r.lemma}(${r.relationship_type})`)
  });

  return results;
}

/**
 * Strategy 1: Get near-synonym word
 * NOW USES COMPREHENSIVE SEMANTIC QUERY (Option C implementation)
 *
 * Finds words with very similar meanings but subtle differences
 * Uses a single comprehensive query to get ALL semantic relationships,
 * then prioritizes link types for best "near-miss" wrong definitions
 *
 * Priority order:
 * 1. Hyponyms (more specific) - e.g., correct="dog" → wrong="terrier"
 * 2. Hypernyms (more general) - e.g., correct="terrier" → wrong="dog"
 * 3. Similar/Also (related concepts)
 * 4. Siblings (coordinate terms)
 * 5. Any other semantic link
 */
export async function getNearSynonymWord(
  correctWord: WordData,
  excludeSynsetIds: number[],
  casedOperator: string,
  targetBand?: number | null
): Promise<WordData | null> {
  // Get ALL semantically-related words in ONE query (no difficulty filtering)
  const relatedWords = await getSemanticRelatedWords(correctWord, excludeSynsetIds);

  if (relatedWords.length === 0) {
    console.log(`[NearSynonym] No semantic relationships found, trying fallback strategies`);

    // Fallback: Try siblings (uses existing helper)
    const siblings = await getSiblingWords(correctWord, excludeSynsetIds);
    if (siblings.length > 0) {
      // Prioritize siblings from the same lexical domain
      const sameDomainSiblings = await prisma.synsets.findMany({
        where: {
          synsetid: { in: siblings.map(s => s.synsetid) },
          lexdomainid: correctWord.lexdomainid
        },
        select: { synsetid: true },
        take: 10
      });

      const targetSiblings = sameDomainSiblings.length > 0 ? sameDomainSiblings : siblings;

      for (let i = 0; i < Math.min(3, targetSiblings.length); i++) {
        const randomSibling = targetSiblings[Math.floor(Math.random() * targetSiblings.length)];
        try {
          const word = await getWordFromSynset(randomSibling.synsetid, casedOperator, targetBand, false);
          word.strategy = 'near_synonym_sibling';
          return word;
        } catch (error) {
          // Try next one
        }
      }
    }

    // Final fallback: Same domain with similar definition length
    const defCharCount = correctWord.def_num_chars || 50;
    const minChars = Math.max(1, defCharCount - 20);
    const maxChars = defCharCount + 20;

    const sameDomainWords = await prisma.synsets.findMany({
      where: {
        lexdomainid: correctWord.lexdomainid,
        synsetid: { notIn: excludeSynsetIds },
        senses: {
          some: {
            wordigo_difficulty_calculated: {
              difficulty_band: targetBand || undefined,
              def_char_count: {
                gte: minChars,
                lte: maxChars
              }
            }
          }
        }
      },
      select: { synsetid: true },
      take: 20
    });

    if (sameDomainWords.length > 0) {
      for (let i = 0; i < Math.min(3, sameDomainWords.length); i++) {
        const randomWord = sameDomainWords[Math.floor(Math.random() * sameDomainWords.length)];
        try {
          const word = await getWordFromSynset(randomWord.synsetid, casedOperator, targetBand, false);
          word.strategy = 'near_synonym_same_domain';
          return word;
        } catch (error) {
          // Try next one
        }
      }
    }

    return null;
  }

  // Priority order for link types (best wrong definitions first)
  // Note: Prioritize relationships that are most likely to confuse players
  const priorityOrder = [
    'hyponym',            // More specific version (very confusing!)
    'hypernym',           // More general version (also confusing!)
    'instance hyponym',   // Specific instances (e.g., "Albert Einstein" is instance of "physicist")
    'instance hypernym',  // General instances
    'similar',            // Explicitly similar concepts
    'also',               // Related "see also" concepts
    'member holonym',     // The whole that contains this (e.g., "faculty" contains "professor")
    'member meronym',     // A member of this whole (e.g., "professor" is member of "faculty")
    'part holonym',       // The whole that this is part of (e.g., "car" contains "engine")
    'part meronym',       // A part of this whole (e.g., "engine" is part of "car")
    'substance holonym',  // Made from this substance (e.g., "wood" for "table")
    'substance meronym',  // This is made from the substance (e.g., "table" for "wood")
    'attribute',          // Has this attribute (e.g., "heavy" is attribute of "weight")
    'cause',              // Causes this (e.g., "kill" causes "die")
    'entail',             // Entails/implies this (e.g., "snore" entails "sleep")
    'verb group'          // Related verbs (e.g., "walk" and "stroll")
  ];

  // Try each priority link type in order
  for (const linkType of priorityOrder) {
    const candidates = relatedWords.filter(r => r.relationship_type === linkType);

    if (candidates.length > 0) {
      // Randomly select from candidates of this type
      const selected = candidates[Math.floor(Math.random() * candidates.length)];

      console.log(`[NearSynonym] Selected ${linkType}: ${selected.lemma} (band: ${selected.difficulty_band})`);

      // Convert to WordData
      return {
        wordid: selected.wordid,
        lemma: selected.lemma,
        cased: selected.cased,
        definition: selected.definition,
        casedwordid: selected.casedwordid,
        synsetid: selected.synsetid,
        senseid: selected.senseid,
        lexdomainid: selected.lexdomainid,
        lexdomainname: selected.lexdomainname,
        word_in_definition: selected.word_in_definition,
        def_num_chars: selected.def_char_count,
        overall_difficulty_score: selected.overall_difficulty_score ? Number(selected.overall_difficulty_score) : null,
        difficulty_band: selected.difficulty_band,
        strategy: `near_synonym_${linkType}`
      };
    }
  }

  // If no priority link types found, use any available relationship
  if (relatedWords.length > 0) {
    const selected = relatedWords[Math.floor(Math.random() * relatedWords.length)];

    console.log(`[NearSynonym] Selected other: ${selected.lemma} (${selected.relationship_type}, band: ${selected.difficulty_band})`);

    return {
      wordid: selected.wordid,
      lemma: selected.lemma,
      cased: selected.cased,
      definition: selected.definition,
      casedwordid: selected.casedwordid,
      synsetid: selected.synsetid,
      senseid: selected.senseid,
      lexdomainid: selected.lexdomainid,
      lexdomainname: selected.lexdomainname,
      word_in_definition: selected.word_in_definition,
      def_num_chars: selected.def_char_count,
      overall_difficulty_score: selected.overall_difficulty_score ? Number(selected.overall_difficulty_score) : null,
      difficulty_band: selected.difficulty_band,
      strategy: `near_synonym_${selected.relationship_type}`
    };
  }

  return null;
}

/**
 * Find sibling words (same parent hypernym, different meaning)
 * E.g., "dog" and "cat" are both "animals"
 */
async function getSiblingWords(correctWord: WordData, excludeSynsetIds: number[]) {
  // Use Prisma's ORM instead of raw SQL for better array handling
  // Find the hypernyms first
  const hypernyms = await prisma.$queryRaw<{ synset2id: number }[]>`
    SELECT DISTINCT sl.synset2id
    FROM semlinks sl
    JOIN linktypes lt ON sl.linkid = lt.linkid
    WHERE sl.synset1id = ${correctWord.synsetid}
      AND lt.link = 'hypernym'
    LIMIT 5
  `;

  if (hypernyms.length === 0) return [];

  const hypernymIds = hypernyms.map(h => h.synset2id);

  // Find siblings (other hyponyms of the same hypernyms)
  const siblings = await prisma.semlinks.findMany({
    where: {
      synset2id: { in: hypernymIds },
      synset1id: {
        not: correctWord.synsetid,
        notIn: excludeSynsetIds
      },
      linktypes: {
        link: 'hyponym'
      }
    },
    select: {
      synset1id: true
    },
    take: 20
  });

  return siblings.map(s => ({ synsetid: s.synset1id }));
}


/**
 * Find words from adjacent lexical domains (related but different semantic categories)
 */
async function getAdjacentDomainWords(correctWord: WordData, excludeSynsetIds: number[]) {
  // Get current lexdomain info
  const currentDomain = await prisma.lexdomains.findUnique({
    where: { lexdomainid: correctWord.lexdomainid },
  });

  if (!currentDomain) return [];

  // Define adjacent domain mappings
  const adjacentDomainMap: { [key: string]: string[] } = {
    'noun.person': ['noun.body', 'noun.group', 'noun.communication'],
    'noun.animal': ['noun.body', 'noun.food', 'noun.plant'],
    'noun.artifact': ['noun.substance', 'noun.object', 'noun.possession'],
    'noun.cognition': ['noun.communication', 'noun.feeling', 'noun.motive'],
    'verb.motion': ['verb.contact', 'verb.change', 'verb.perception'],
    'verb.creation': ['verb.change', 'verb.possession', 'verb.competition'],
    'verb.communication': ['verb.cognition', 'verb.emotion', 'verb.social'],
  };

  const adjacentNames = adjacentDomainMap[currentDomain.lexdomainname] || [];
  if (adjacentNames.length === 0) return [];

  const adjacentDomains = await prisma.lexdomains.findMany({
    where: {
      lexdomainname: { in: adjacentNames },
    },
  });

  const adjacentDomainIds = adjacentDomains.map(d => d.lexdomainid);
  if (adjacentDomainIds.length === 0) return [];

  return await prisma.synsets.findMany({
    where: {
      lexdomainid: { in: adjacentDomainIds },
      synsetid: { notIn: excludeSynsetIds },
    },
    select: { synsetid: true },
    take: 20,
  });
}

/**
 * Strategy 2: Get antonym or contrasting word
 * Now filters by difficulty band to ensure consistency
 */
export async function getAntonymWord(
  correctWord: WordData,
  excludeSynsetIds: number[],
  casedOperator: string,
  targetBand?: number | null
): Promise<WordData | null> {
  // Try lexical antonyms using Prisma ORM
  const lexicalAntonyms = await prisma.lexlinks.findMany({
    where: {
      word1id: correctWord.wordid,
      synset1id: correctWord.synsetid,
      synset2id: { notIn: excludeSynsetIds },
      linktypes: {
        link: 'antonym'
      }
    },
    select: {
      synset2id: true
    },
    take: 10
  });

  if (lexicalAntonyms.length > 0) {
    // Try multiple antonyms to find one with matching difficulty band
    for (let i = 0; i < Math.min(3, lexicalAntonyms.length); i++) {
      const randomAntonym = lexicalAntonyms[Math.floor(Math.random() * lexicalAntonyms.length)];
      try {
        const word = await getWordFromSynset(randomAntonym.synset2id, casedOperator, targetBand, false);
        word.strategy = 'antonym';
        return word;
      } catch (error) {
        // Try next antonym
      }
    }
  }

  // Fallback: try semantic antonyms
  const semanticAntonyms = await prisma.semlinks.findMany({
    where: {
      synset1id: correctWord.synsetid,
      synset2id: { notIn: excludeSynsetIds },
      linktypes: {
        link: 'antonym'
      }
    },
    select: {
      synset2id: true
    },
    take: 10
  });

  if (semanticAntonyms.length > 0) {
    // Try multiple antonyms to find one with matching difficulty band
    for (let i = 0; i < Math.min(3, semanticAntonyms.length); i++) {
      const randomAntonym = semanticAntonyms[Math.floor(Math.random() * semanticAntonyms.length)];
      try {
        const word = await getWordFromSynset(randomAntonym.synset2id, casedOperator, targetBand, false);
        word.strategy = 'antonym_semantic';
        return word;
      } catch (error) {
        // Try next antonym
      }
    }
  }

  // If no antonym exists, use adjacent domain as contrast
  const adjacentWords = await getAdjacentDomainWords(correctWord, excludeSynsetIds);
  if (adjacentWords.length > 0) {
    // Try multiple domains to find one with matching difficulty band
    for (let i = 0; i < Math.min(3, adjacentWords.length); i++) {
      const randomSynset = adjacentWords[Math.floor(Math.random() * adjacentWords.length)];
      try {
        const word = await getWordFromSynset(randomSynset.synsetid, casedOperator, targetBand, false);
        word.strategy = 'contrast_domain';
        return word;
      } catch (error) {
        // Try next domain
      }
    }
  }

  return null;
}

/**
 * Strategy 3: Get random word from same difficulty band but different domain
 * Already filters by difficulty band
 */
export async function getRandomDifferentDomain(
  correctWord: WordData,
  excludeSynsetIds: number[],
  casedOperator: string,
  targetBand?: number | null
): Promise<WordData | null> {
  // Build where clause with difficulty filter if available
  const whereClause: any = {
    lexdomainid: { not: correctWord.lexdomainid },
    synsetid: { notIn: excludeSynsetIds },
  };

  // Add difficulty band filter if specified (use calculated table)
  if (targetBand !== null && targetBand !== undefined) {
    whereClause.senses = {
      some: {
        wordigo_difficulty_calculated: {
          difficulty_band: targetBand,
        },
      },
    };
  }

  const candidates = await prisma.synsets.findMany({
    where: whereClause,
    select: { synsetid: true },
    take: 50,
  });

  if (candidates.length > 0) {
    const randomSynset = candidates[Math.floor(Math.random() * candidates.length)];
    try {
      const word = await getWordFromSynset(randomSynset.synsetid, casedOperator, targetBand);
      word.strategy = 'random_different_domain';
      return word;
    } catch (error) {
      // Continue to fallback
    }
  }

  return null;
}

/**
 * Ultimate fallback: any random word from same difficulty band
 * Tries same band first, then adjacent bands (±1), then any band
 */
async function getRandomFallback(
  _correctWord: WordData,
  excludeSynsetIds: number[],
  casedOperator: string,
  targetBand?: number | null
): Promise<WordData> {
  // Try same difficulty band first (use calculated table)
  if (targetBand !== null && targetBand !== undefined) {
    const sameBandCandidates = await prisma.synsets.findMany({
      where: {
        synsetid: { notIn: excludeSynsetIds },
        senses: {
          some: {
            wordigo_difficulty_calculated: {
              difficulty_band: targetBand,
            },
          },
        },
      },
      select: { synsetid: true },
      take: 100,
    });

    if (sameBandCandidates.length > 0) {
      const randomSynset = sameBandCandidates[Math.floor(Math.random() * sameBandCandidates.length)];
      const word = await getWordFromSynset(randomSynset.synsetid, casedOperator, targetBand);
      word.strategy = 'random_same_band';
      return word;
    }

    // Try adjacent bands (±1) if same band has no results
    const adjacentBands = [targetBand - 1, targetBand + 1].filter(b => b >= 1 && b <= 9);
    if (adjacentBands.length > 0) {
      const adjacentBandCandidates = await prisma.synsets.findMany({
        where: {
          synsetid: { notIn: excludeSynsetIds },
          senses: {
            some: {
              wordigo_difficulty_calculated: {
                difficulty_band: { in: adjacentBands },
              },
            },
          },
        },
        select: { synsetid: true },
        take: 100,
      });

      if (adjacentBandCandidates.length > 0) {
        const randomSynset = adjacentBandCandidates[Math.floor(Math.random() * adjacentBandCandidates.length)];
        const word = await getWordFromSynset(randomSynset.synsetid, casedOperator, targetBand);
        word.strategy = 'random_adjacent_band';
        return word;
      }
    }
  }

  // Last resort: truly any word
  const anyCandidates = await prisma.synsets.findMany({
    where: {
      synsetid: { notIn: excludeSynsetIds },
    },
    select: { synsetid: true },
    take: 100,
  });

  if (anyCandidates.length === 0) {
    throw new Error('No synsets available for wrong definition');
  }

  const randomSynset = anyCandidates[Math.floor(Math.random() * anyCandidates.length)];
  const word = await getWordFromSynset(randomSynset.synsetid, casedOperator, targetBand);
  word.strategy = 'random_any';
  return word;
}

/**
 * Get a word from a specific synset, optionally filtered by difficulty band
 * @param strictBandMatch - If true, only allow exact band matches; if false, allows ±1 band from the start
 */
async function getWordFromSynset(
  synsetid: number,
  casedOperator: string,
  targetBand?: number | null,
  strictBandMatch: boolean = false
): Promise<WordData> {
  // Build where clause
  const whereClause: any = {
    synsetid,
    casedwordid: casedOperator === 'gt' ? { gt: 0 } : 0,
  };

  // Add difficulty filter if specified (use calculated table)
  if (targetBand !== null && targetBand !== undefined) {
    if (strictBandMatch) {
      // Strict mode: exact band only
      whereClause.wordigo_difficulty_calculated = {
        difficulty_band: targetBand,
      };
    } else {
      // Flexible mode: allow ±1 band from the start (expands word pool)
      const allowedBands = [
        targetBand - 1,
        targetBand,
        targetBand + 1
      ].filter(b => b >= 1 && b <= 5);

      whereClause.wordigo_difficulty_calculated = {
        difficulty_band: { in: allowedBands },
      };
    }
  }

  // Try to get senses matching both cased preference and difficulty
  let senses = await prisma.senses.findMany({
    where: whereClause,
    include: {
      words: true,
      synsets: {
        include: {
          lexdomains: true,
        },
      },
      casedwords: true,
      wordigo_difficulty_calculated: true,
    },
  });

  // Fallback 1: if no senses match, try without cased preference but keep difficulty filter
  if (senses.length === 0 && targetBand !== null && targetBand !== undefined) {
    const difficultyFilter = strictBandMatch
      ? { difficulty_band: targetBand }
      : {
          difficulty_band: {
            in: [targetBand - 1, targetBand, targetBand + 1].filter(b => b >= 1 && b <= 5)
          }
        };

    senses = await prisma.senses.findMany({
      where: {
        synsetid,
        wordigo_difficulty_calculated: difficultyFilter,
      },
      include: {
        words: true,
        synsets: {
          include: {
            lexdomains: true,
          },
        },
        casedwords: true,
        wordigo_difficulty_calculated: true,
      },
    });
  }

  // Fallback 2: if no senses match any difficulty filter and not strict mode, get any sense from this synset
  if (senses.length === 0 && !strictBandMatch) {
    senses = await prisma.senses.findMany({
      where: {
        synsetid,
      },
      include: {
        words: true,
        synsets: {
          include: {
            lexdomains: true,
          },
        },
        casedwords: true,
        wordigo_difficulty_calculated: true,
      },
    });
  }

  if (senses.length === 0) {
    throw new Error(`No senses found for synset ${synsetid}`);
  }

  // Pick random sense (functions.wordigo.php:308)
  const randomSense = senses[Math.floor(Math.random() * senses.length)];

  // Get calculated difficulty from the included relation
  const calculatedDiff = randomSense.wordigo_difficulty_calculated;

  return {
    wordid: randomSense.words.wordid,
    lemma: randomSense.words.lemma,
    cased: randomSense.casedwords?.cased,
    definition: randomSense.synsets.definition,
    casedwordid: randomSense.casedwordid,
    synsetid: randomSense.synsetid,
    senseid: randomSense.senseid,
    lexdomainid: randomSense.synsets.lexdomainid,
    lexdomainname: randomSense.synsets.lexdomains.lexdomainname,
    word_in_definition: calculatedDiff?.word_in_definition ?? null,
    def_num_chars: calculatedDiff?.def_char_count ?? null,
    overall_difficulty_score: calculatedDiff?.overall_difficulty_score ? Number(calculatedDiff.overall_difficulty_score) : null,
    difficulty_band: calculatedDiff?.difficulty_band ?? null,
  };
}

/**
 * Clean definition text
 * Replicates cleanDefinition() from functions.wordigo.php:320-332
 */
function cleanDefinition(definition: string): string {
  if (!definition || definition.length === 0) {
    return definition;
  }

  // Capitalize first letter
  return definition.charAt(0).toUpperCase() + definition.slice(1);
}

/**
 * Clean word (use cased form if available)
 * Replicates cleanWord() from functions.wordigo.php:334-339
 */
function cleanWord(word: WordData): string {
  return word.casedwordid && word.casedwordid > 0 && word.cased
    ? word.cased
    : word.lemma;
}

export { GameWord, WordData };
