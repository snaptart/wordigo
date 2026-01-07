/**
 * Linguist Wrong Definition Service
 *
 * A sophisticated 5-level difficulty system based on linguistic theory
 * and WordNet semantic relationships, designed by a world-class linguist.
 *
 * This is a PARALLEL implementation to the current wrongDefinitionService.ts,
 * allowing for A/B testing and comparison of difficulty strategies.
 *
 * Linguistic Theory:
 * - Level 1 (Easy): Semantic Discontinuity - completely unrelated concepts
 * - Level 2 (Less Easy): Taxonomic Distance - shared high-level category
 * - Level 3 (Medium): Categorical Consistency - same specific type (siblings)
 * - Level 4 (Hard): Structural Confusion - parts vs whole, specific vs general
 * - Level 5 (Hardest): Lexical Precision - near-synonyms with micro-distinctions
 *
 * @see difficulty_rules.md for full linguistic specifications
 */

import { PrismaClient } from '@prisma/client';
import { WordData } from './wordService';

const prisma = new PrismaClient();

/**
 * Extended filter interface with lemma-level exclusion
 */
export interface LinguistWrongDefinitionFilters {
  // Word constraints
  wordLengthFilter?: 'short' | 'medium' | 'long' | 'all';
  allowObscureWords?: boolean;

  // Category filtering
  categoryDomainIds?: number[];
  categoryFilterMode?: 'strict' | 'smart'; // strict = all same category, smart = varies by level

  // Exclusion criteria (prevent duplicates)
  excludeSynsetIds: number[];
  excludeLemmas: string[]; // Case-insensitive lemma exclusion
  excludeCasedWordIds?: number[];
}

/**
 * Result from wrong definition selection
 */
export interface LinguistWrongDefinitionResult {
  word: WordData;
  strategy: string; // Describes which linguistic strategy was used
  linkType?: string; // The semantic relationship type (hypernym, meronym, etc.)
  semanticDistance?: number; // How many hops away in the WordNet graph
}

/**
 * Word length thresholds (matches existing system)
 */
const WORD_LENGTH_THRESHOLDS = {
  short: { min: 0, max: 7 },
  medium: { min: 0, max: 14 },
  long: { min: 0, max: 42 },
  all: { min: 0, max: 200 }
};

/**
 * MAIN ENTRY POINT
 *
 * Get 3 wrong definitions using the linguist's 5-level difficulty system.
 * This function routes to the appropriate level-specific strategy based on difficultyBand.
 *
 * @param correctWord The correct word to find wrong definitions for
 * @param difficultyBand 1=Easy, 2=Less Easy, 3=Medium, 4=Hard, 5=Hardest
 * @param filters Optional filters for word length, categories, etc.
 * @returns Array of 3 wrong definitions with their linguistic strategies
 */
export async function getLinguistWrongDefinitions(
  correctWord: WordData,
  difficultyBand: number = 3,
  filters: Partial<LinguistWrongDefinitionFilters> = {}
): Promise<LinguistWrongDefinitionResult[]> {

  console.log(`[Linguist] Getting wrong definitions for "${correctWord.lemma}" at Level ${difficultyBand}`);

  // Initialize filter defaults
  const fullFilters: LinguistWrongDefinitionFilters = {
    wordLengthFilter: filters.wordLengthFilter || 'all',
    allowObscureWords: filters.allowObscureWords ?? true,
    categoryDomainIds: filters.categoryDomainIds || [],
    categoryFilterMode: filters.categoryFilterMode || 'strict',
    excludeSynsetIds: filters.excludeSynsetIds || [correctWord.synsetid],
    excludeLemmas: filters.excludeLemmas || [correctWord.lemma.toLowerCase()],
    excludeCasedWordIds: filters.excludeCasedWordIds || []
  };

  // Route to appropriate level strategy
  let wrongDefinitions: LinguistWrongDefinitionResult[] = [];

  switch (difficultyBand) {
    case 1:
      wrongDefinitions = await getLevel1Distractors(correctWord, fullFilters);
      break;
    case 2:
      wrongDefinitions = await getLevel2Distractors(correctWord, fullFilters);
      break;
    case 3:
      wrongDefinitions = await getLevel3Distractors(correctWord, fullFilters);
      break;
    case 4:
      wrongDefinitions = await getLevel4Distractors(correctWord, fullFilters);
      break;
    case 5:
      wrongDefinitions = await getLevel5Distractors(correctWord, fullFilters);
      break;
    default:
      console.warn(`[Linguist] Unknown difficulty band ${difficultyBand}, defaulting to Level 3`);
      wrongDefinitions = await getLevel3Distractors(correctWord, fullFilters);
  }

  console.log(`[Linguist] Found ${wrongDefinitions.length} wrong definitions:`,
    wrongDefinitions.map(w => `${w.word.lemma}(${w.strategy})`)
  );

  return wrongDefinitions;
}

/**
 * LEVEL 1: EASY - Categorical Distractors
 *
 * Strategy: Use distractors from entirely different semantic domains.
 * Example: If target is "Apple" (fruit), show "Anger" (emotion), "Carpenter" (occupation)
 *
 * The player only needs to recognize the general category to win.
 */
async function getLevel1Distractors(
  correctWord: WordData,
  filters: LinguistWrongDefinitionFilters
): Promise<LinguistWrongDefinitionResult[]> {

  console.log(`[Linguist-L1] Getting random different-domain distractors`);

  const distractors: LinguistWrongDefinitionResult[] = [];
  const usedSynsetIds = new Set(filters.excludeSynsetIds);
  const usedLemmas = new Set(filters.excludeLemmas);

  // For Level 1, we want MAXIMUM semantic distance
  // Strategy: Pick from completely different lexical domains

  for (let attempt = 0; attempt < 3 && distractors.length < 3; attempt++) {
    const candidate = await getRandomDifferentDomain(
      correctWord,
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters
    );

    if (candidate && !usedLemmas.has(candidate.word.lemma.toLowerCase())) {
      distractors.push(candidate);
      usedSynsetIds.add(candidate.word.synsetid);
      usedLemmas.add(candidate.word.lemma.toLowerCase());
    }
  }

  return distractors;
}

/**
 * LEVEL 2: LESS EASY - Broad Domain Distractors
 *
 * Strategy: Use distractors that share a high-level hypernym (the "Grandparent" concept).
 * Example: If target is "Apple" → distractors are other "Organisms" or "Physical Objects"
 *
 * Requires 2-hop navigation up the hypernym tree, then random descendants.
 */
async function getLevel2Distractors(
  correctWord: WordData,
  filters: LinguistWrongDefinitionFilters
): Promise<LinguistWrongDefinitionResult[]> {

  console.log(`[Linguist-L2] Getting grandparent-level distractors`);

  const distractors: LinguistWrongDefinitionResult[] = [];
  const usedSynsetIds = new Set(filters.excludeSynsetIds);
  const usedLemmas = new Set(filters.excludeLemmas);

  // Step 1: Navigate 2 levels up to find the "grandparent" hypernym
  const grandparents = await getGrandparentHypernyms(correctWord.synsetid);

  if (grandparents.length === 0) {
    console.warn(`[Linguist-L2] No grandparents found, falling back to Level 1`);
    return getLevel1Distractors(correctWord, filters);
  }

  // Step 2: For each grandparent, get random descendants (cousins)
  for (const grandparent of grandparents) {
    if (distractors.length >= 3) break;

    const cousins = await getRandomDescendants(
      grandparent.synsetid,
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters,
      5 // Get 5 candidates
    );

    for (const cousin of cousins) {
      if (distractors.length >= 3) break;
      if (!usedLemmas.has(cousin.word.lemma.toLowerCase())) {
        distractors.push({
          ...cousin,
          strategy: 'level2_grandparent_cousin',
          semanticDistance: 2
        });
        usedSynsetIds.add(cousin.word.synsetid);
        usedLemmas.add(cousin.word.lemma.toLowerCase());
      }
    }
  }

  // Fallback if not enough cousins found
  while (distractors.length < 3) {
    const fallback = await getRandomDifferentDomain(
      correctWord,
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters
    );

    if (fallback && !usedLemmas.has(fallback.word.lemma.toLowerCase())) {
      distractors.push({
        ...fallback,
        strategy: 'level2_fallback_random'
      });
      usedSynsetIds.add(fallback.word.synsetid);
      usedLemmas.add(fallback.word.lemma.toLowerCase());
    } else {
      break; // Prevent infinite loop
    }
  }

  return distractors;
}

/**
 * LEVEL 3: MEDIUM - Coordinate Sister Terms
 *
 * Strategy: Use coordinate terms (words that share the same immediate hypernym).
 * Example: If target is "Apple" → distractors are "Orange", "Pear", "Banana"
 *
 * All options are now the same type. Player must know specific characteristics.
 */
async function getLevel3Distractors(
  correctWord: WordData,
  filters: LinguistWrongDefinitionFilters
): Promise<LinguistWrongDefinitionResult[]> {

  console.log(`[Linguist-L3] Getting sibling/coordinate term distractors`);

  const distractors: LinguistWrongDefinitionResult[] = [];
  const usedSynsetIds = new Set(filters.excludeSynsetIds);
  const usedLemmas = new Set(filters.excludeLemmas);

  // Get direct siblings (coordinate terms)
  const siblings = await getDirectSiblings(
    correctWord.synsetid,
    Array.from(usedSynsetIds),
    Array.from(usedLemmas),
    filters
  );

  // Add siblings as distractors
  for (const sibling of siblings) {
    if (distractors.length >= 3) break;
    if (!usedLemmas.has(sibling.word.lemma.toLowerCase())) {
      distractors.push({
        ...sibling,
        strategy: 'level3_sibling',
        semanticDistance: 1
      });
      usedSynsetIds.add(sibling.word.synsetid);
      usedLemmas.add(sibling.word.lemma.toLowerCase());
    }
  }

  // Fallback: Use same-domain words if not enough siblings
  while (distractors.length < 3) {
    const fallback = await getSameDomainWord(
      correctWord,
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters
    );

    if (fallback && !usedLemmas.has(fallback.word.lemma.toLowerCase())) {
      distractors.push({
        ...fallback,
        strategy: 'level3_fallback_same_domain'
      });
      usedSynsetIds.add(fallback.word.synsetid);
      usedLemmas.add(fallback.word.lemma.toLowerCase());
    } else {
      break;
    }
  }

  return distractors;
}

/**
 * LEVEL 4: HARD - Near-Synonyms and Part/Whole Relationships
 *
 * Strategy: Use meronyms (parts), entailments, and troponyms (manner-of-action).
 * Example: If target is "Bicycle" → distractors are "Pedal" (part), "Brake" (part), "Vehicle" (general)
 *
 * Player must distinguish between the object and its parts, or general vs specific.
 */
async function getLevel4Distractors(
  correctWord: WordData,
  filters: LinguistWrongDefinitionFilters
): Promise<LinguistWrongDefinitionResult[]> {

  console.log(`[Linguist-L4] Getting meronym/hypernym mix distractors`);

  const distractors: LinguistWrongDefinitionResult[] = [];
  const usedSynsetIds = new Set(filters.excludeSynsetIds);
  const usedLemmas = new Set(filters.excludeLemmas);

  // Priority 1: Get meronyms (parts of the thing)
  const meronyms = await getRelatedByLinkType(
    correctWord.synsetid,
    ['part meronym', 'member meronym', 'substance meronym'],
    Array.from(usedSynsetIds),
    Array.from(usedLemmas),
    filters,
    2 // Get 2 meronyms
  );

  for (const meronym of meronyms) {
    if (distractors.length >= 3) break;
    if (!usedLemmas.has(meronym.word.lemma.toLowerCase())) {
      distractors.push(meronym);
      usedSynsetIds.add(meronym.word.synsetid);
      usedLemmas.add(meronym.word.lemma.toLowerCase());
    }
  }

  // Priority 2: Get hypernym (the general version) for confusion
  if (distractors.length < 3) {
    const hypernyms = await getRelatedByLinkType(
      correctWord.synsetid,
      ['hypernym'],
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters,
      1
    );

    for (const hypernym of hypernyms) {
      if (distractors.length >= 3) break;
      if (!usedLemmas.has(hypernym.word.lemma.toLowerCase())) {
        distractors.push(hypernym);
        usedSynsetIds.add(hypernym.word.synsetid);
        usedLemmas.add(hypernym.word.lemma.toLowerCase());
      }
    }
  }

  // Priority 3: For verbs, try entailments or troponyms
  if (distractors.length < 3 && correctWord.pos === 'v') {
    const verbRelations = await getRelatedByLinkType(
      correctWord.synsetid,
      ['entail', 'cause'],
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters,
      3 - distractors.length
    );

    for (const relation of verbRelations) {
      if (distractors.length >= 3) break;
      if (!usedLemmas.has(relation.word.lemma.toLowerCase())) {
        distractors.push(relation);
        usedSynsetIds.add(relation.word.synsetid);
        usedLemmas.add(relation.word.lemma.toLowerCase());
      }
    }
  }

  // Fallback: Use siblings if not enough structural relationships
  while (distractors.length < 3) {
    const fallback = await getDirectSiblings(
      correctWord.synsetid,
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters,
      1
    );

    if (fallback.length > 0 && !usedLemmas.has(fallback[0].word.lemma.toLowerCase())) {
      distractors.push({
        ...fallback[0],
        strategy: 'level4_fallback_sibling'
      });
      usedSynsetIds.add(fallback[0].word.synsetid);
      usedLemmas.add(fallback[0].word.lemma.toLowerCase());
    } else {
      break;
    }
  }

  return distractors;
}

/**
 * LEVEL 5: HARDEST - The Nuance Battle
 *
 * Strategy: Use "Similar To" relationships and near-synonyms with micro-distinctions.
 * Example: If target is "Irritated" → distractors are "Annoyed", "Peeved", "Nettled"
 *
 * This is the ultimate test - requires understanding subtle differences in meaning.
 */
async function getLevel5Distractors(
  correctWord: WordData,
  filters: LinguistWrongDefinitionFilters
): Promise<LinguistWrongDefinitionResult[]> {

  console.log(`[Linguist-L5] Getting micro-distinction near-synonyms`);

  const distractors: LinguistWrongDefinitionResult[] = [];
  const usedSynsetIds = new Set(filters.excludeSynsetIds);
  const usedLemmas = new Set(filters.excludeLemmas);

  // Priority 1: Get "Similar To" relationships (adjectives)
  if (correctWord.pos === 'a' || correctWord.pos === 's') {
    const similar = await getRelatedByLinkType(
      correctWord.synsetid,
      ['similar'],
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters,
      2
    );

    for (const sim of similar) {
      if (distractors.length >= 3) break;
      if (!usedLemmas.has(sim.word.lemma.toLowerCase())) {
        distractors.push(sim);
        usedSynsetIds.add(sim.word.synsetid);
        usedLemmas.add(sim.word.lemma.toLowerCase());
      }
    }
  }

  // Priority 2: Get very tight siblings (same hypernym, same domain)
  const tightSiblings = await getTightSiblings(
    correctWord,
    Array.from(usedSynsetIds),
    Array.from(usedLemmas),
    filters,
    3 - distractors.length
  );

  for (const sibling of tightSiblings) {
    if (distractors.length >= 3) break;
    if (!usedLemmas.has(sibling.word.lemma.toLowerCase())) {
      distractors.push({
        ...sibling,
        strategy: 'level5_tight_sibling'
      });
      usedSynsetIds.add(sibling.word.synsetid);
      usedLemmas.add(sibling.word.lemma.toLowerCase());
    }
  }

  // Priority 3: For verbs, use troponyms (specific manners of action)
  if (distractors.length < 3 && correctWord.pos === 'v') {
    const troponyms = await getRelatedByLinkType(
      correctWord.synsetid,
      ['hyponym'], // In verbs, hyponyms are troponyms (manner-of-action)
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters,
      3 - distractors.length
    );

    for (const troponym of troponyms) {
      if (distractors.length >= 3) break;
      if (!usedLemmas.has(troponym.word.lemma.toLowerCase())) {
        distractors.push({
          ...troponym,
          strategy: 'level5_troponym'
        });
        usedSynsetIds.add(troponym.word.synsetid);
        usedLemmas.add(troponym.word.lemma.toLowerCase());
      }
    }
  }

  // Fallback: Use any near-synonyms if we don't have enough
  while (distractors.length < 3) {
    const fallback = await getDirectSiblings(
      correctWord.synsetid,
      Array.from(usedSynsetIds),
      Array.from(usedLemmas),
      filters,
      1
    );

    if (fallback.length > 0 && !usedLemmas.has(fallback[0].word.lemma.toLowerCase())) {
      distractors.push({
        ...fallback[0],
        strategy: 'level5_fallback_sibling'
      });
      usedSynsetIds.add(fallback[0].word.synsetid);
      usedLemmas.add(fallback[0].word.lemma.toLowerCase());
    } else {
      break;
    }
  }

  return distractors;
}

// ============================================================================
// HELPER FUNCTIONS - Semantic Navigation & Word Selection
// ============================================================================

/**
 * Get random word from completely different lexical domain
 */
async function getRandomDifferentDomain(
  correctWord: WordData,
  excludeSynsetIds: number[],
  excludeLemmas: string[],
  filters: LinguistWrongDefinitionFilters
): Promise<LinguistWrongDefinitionResult | null> {

  const whereClause: any = {
    lexdomainid: { not: correctWord.lexdomainid },
    synsetid: { notIn: excludeSynsetIds },
    pos: correctWord.pos // Keep same part of speech
  };

  // Apply word length filter
  if (filters.wordLengthFilter !== 'all') {
    const threshold = WORD_LENGTH_THRESHOLDS[filters.wordLengthFilter];
    whereClause.senses = {
      some: {
        words: {
          lemma: {
            // Prisma doesn't have length filter, we'll filter in app layer
          }
        }
      }
    };
  }

  const candidates = await prisma.synsets.findMany({
    where: whereClause,
    include: {
      senses: {
        include: {
          words: true,
          casedwords: true,
          wordigo_difficulty_calculated: true
        },
        take: 1
      },
      lexdomains: true
    },
    take: 50
  });

  // Filter by word length and lemma exclusion in application layer
  const threshold = WORD_LENGTH_THRESHOLDS[filters.wordLengthFilter || 'all'];
  const validCandidates = candidates.filter(c => {
    if (c.senses.length === 0) return false;
    const sense = c.senses[0];
    const lemma = sense.words.lemma;
    const wordLength = lemma.length;

    return (
      wordLength >= threshold.min &&
      wordLength <= threshold.max &&
      !excludeLemmas.includes(lemma.toLowerCase())
    );
  });

  if (validCandidates.length === 0) return null;

  const selected = validCandidates[Math.floor(Math.random() * validCandidates.length)];
  const sense = selected.senses[0];
  const calcDiff = sense.wordigo_difficulty_calculated;

  return {
    word: {
      wordid: sense.words.wordid,
      lemma: sense.words.lemma,
      cased: sense.casedwords?.cased,
      definition: selected.definition,
      casedwordid: sense.casedwordid,
      synsetid: selected.synsetid,
      senseid: sense.senseid,
      lexdomainid: selected.lexdomainid,
      lexdomainname: selected.lexdomains.lexdomainname,
      pos: selected.pos,
      posName: getPosName(selected.pos),
      word_in_definition: calcDiff?.word_in_definition ?? null,
      def_num_chars: calcDiff?.def_char_count ?? null,
      overall_difficulty_score: calcDiff?.overall_difficulty_score ? Number(calcDiff.overall_difficulty_score) : null,
      difficulty_band: calcDiff?.difficulty_band ?? null,
    },
    strategy: 'level1_random_different_domain',
    linkType: 'none'
  };
}

/**
 * Get grandparent hypernyms (2 hops up the tree)
 */
async function getGrandparentHypernyms(synsetid: number): Promise<Array<{ synsetid: number }>> {
  const query = `
    SELECT DISTINCT sl2.synset2id as synsetid
    FROM semlinks sl1
    JOIN linktypes lt1 ON sl1.linkid = lt1.linkid
    JOIN semlinks sl2 ON sl1.synset2id = sl2.synset1id
    JOIN linktypes lt2 ON sl2.linkid = lt2.linkid
    WHERE sl1.synset1id = $1
      AND lt1.link = 'hypernym'
      AND lt2.link = 'hypernym'
    LIMIT 5
  `;

  return await prisma.$queryRawUnsafe<Array<{ synsetid: number }>>(query, synsetid);
}

/**
 * Get random descendants from a grandparent synset
 */
async function getRandomDescendants(
  grandparentSynsetId: number,
  excludeSynsetIds: number[],
  excludeLemmas: string[],
  filters: LinguistWrongDefinitionFilters,
  limit: number = 5
): Promise<LinguistWrongDefinitionResult[]> {

  // Find all descendants (children and grandchildren)
  // Ensure safe handling of empty arrays
  const safeExcludeSynsetIds = excludeSynsetIds.length > 0 ? excludeSynsetIds : [-1];

  const query = `
    SELECT DISTINCT
      w.wordid,
      w.lemma,
      s.synsetid,
      sen.senseid,
      s.definition,
      s.pos,
      s.lexdomainid,
      ld.lexdomainname,
      sen.casedwordid,
      cw.cased,
      wdc.difficulty_band,
      wdc.def_char_count,
      wdc.word_in_definition,
      wdc.overall_difficulty_score
    FROM semlinks sl1
    JOIN semlinks sl2 ON sl1.synset1id = sl2.synset2id
    JOIN synsets s ON sl2.synset1id = s.synsetid
    JOIN senses sen ON s.synsetid = sen.synsetid
    JOIN words w ON sen.wordid = w.wordid
    JOIN lexdomains ld ON s.lexdomainid = ld.lexdomainid
    LEFT JOIN casedwords cw ON sen.casedwordid = cw.casedwordid
    LEFT JOIN wordigo_difficulty_calculated wdc ON sen.senseid = wdc.senseid
    WHERE sl1.synset2id = $1
      AND s.synsetid NOT IN (${safeExcludeSynsetIds.join(',')})
    ORDER BY RANDOM()
    LIMIT ${limit * 3}
  `;

  const results = await prisma.$queryRawUnsafe<any[]>(
    query,
    grandparentSynsetId
  );

  // Filter by length and lemma exclusion
  const threshold = WORD_LENGTH_THRESHOLDS[filters.wordLengthFilter || 'all'];
  const descendants: LinguistWrongDefinitionResult[] = [];

  for (const row of results) {
    if (descendants.length >= limit) break;

    const wordLength = row.lemma.length;
    if (
      wordLength >= threshold.min &&
      wordLength <= threshold.max &&
      !excludeLemmas.includes(row.lemma.toLowerCase())
    ) {
      descendants.push({
        word: {
          wordid: row.wordid,
          lemma: row.lemma,
          cased: row.cased,
          definition: row.definition,
          casedwordid: row.casedwordid,
          synsetid: row.synsetid,
          senseid: row.senseid,
          lexdomainid: row.lexdomainid,
          lexdomainname: row.lexdomainname,
          pos: row.pos,
          posName: getPosName(row.pos),
          word_in_definition: row.word_in_definition,
          def_num_chars: row.def_char_count,
          overall_difficulty_score: row.overall_difficulty_score ? Number(row.overall_difficulty_score) : null,
          difficulty_band: row.difficulty_band,
        },
        strategy: 'level2_grandparent_descendant',
        linkType: 'grandchild'
      });
    }
  }

  return descendants;
}

/**
 * Get direct siblings (same immediate hypernym)
 */
async function getDirectSiblings(
  synsetid: number,
  excludeSynsetIds: number[],
  excludeLemmas: string[],
  filters: LinguistWrongDefinitionFilters,
  limit: number = 10
): Promise<LinguistWrongDefinitionResult[]> {

  // First, find the parent hypernyms
  const parents = await prisma.$queryRaw<Array<{ synset2id: number }>>`
    SELECT DISTINCT sl.synset2id
    FROM semlinks sl
    JOIN linktypes lt ON sl.linkid = lt.linkid
    WHERE sl.synset1id = ${synsetid}
      AND lt.link = 'hypernym'
    LIMIT 3
  `;

  if (parents.length === 0) return [];

  const parentIds = parents.map(p => p.synset2id);

  // Ensure we have valid arrays for the query
  const safeExcludeSynsetIds = excludeSynsetIds.length > 0 ? excludeSynsetIds : [-1];

  // Now find siblings (other children of the same parents)
  // Use Prisma's ORM for safer query handling
  const siblings: LinguistWrongDefinitionResult[] = [];

  try {
    const siblingsData = await prisma.semlinks.findMany({
      where: {
        synset2id: { in: parentIds },
        synset1id: { notIn: safeExcludeSynsetIds },
        linktypes: {
          link: 'hypernym'
        }
      },
      include: {
        synsets_semlinks_synset1idTosynsets: {
          include: {
            senses: {
              include: {
                words: true,
                casedwords: true,
                wordigo_difficulty_calculated: true
              },
              take: 1
            },
            lexdomains: true
          }
        }
      },
      take: limit * 2
    });

    const threshold = WORD_LENGTH_THRESHOLDS[filters.wordLengthFilter || 'all'];

    for (const sibling of siblingsData) {
      if (siblings.length >= limit) break;

      const synset = sibling.synsets_semlinks_synset1idTosynsets;
      if (!synset || !synset.senses || synset.senses.length === 0) continue;

      const sense = synset.senses[0];
      const lemma = sense.words.lemma;
      const wordLength = lemma.length;

      if (
        wordLength >= threshold.min &&
        wordLength <= threshold.max &&
        !excludeLemmas.includes(lemma.toLowerCase())
      ) {
        const calcDiff = sense.wordigo_difficulty_calculated;

        siblings.push({
          word: {
            wordid: sense.words.wordid,
            lemma: sense.words.lemma,
            cased: sense.casedwords?.cased,
            definition: synset.definition,
            casedwordid: sense.casedwordid,
            synsetid: synset.synsetid,
            senseid: sense.senseid,
            lexdomainid: synset.lexdomainid,
            lexdomainname: synset.lexdomains.lexdomainname,
            pos: synset.pos,
            posName: getPosName(synset.pos),
            word_in_definition: calcDiff?.word_in_definition ?? null,
            def_num_chars: calcDiff?.def_char_count ?? null,
            overall_difficulty_score: calcDiff?.overall_difficulty_score ? Number(calcDiff.overall_difficulty_score) : null,
            difficulty_band: calcDiff?.difficulty_band ?? null,
          },
          strategy: 'sibling',
          linkType: 'coordinate'
        });
      }
    }
  } catch (error) {
    console.error('[Linguist] Error getting siblings:', error);
    return [];
  }

  return siblings;
}

/**
 * Get words related by specific link types (meronym, hypernym, similar, etc.)
 */
async function getRelatedByLinkType(
  synsetid: number,
  linkTypes: string[],
  excludeSynsetIds: number[],
  excludeLemmas: string[],
  filters: LinguistWrongDefinitionFilters,
  limit: number = 3
): Promise<LinguistWrongDefinitionResult[]> {

  const related: LinguistWrongDefinitionResult[] = [];
  const safeExcludeSynsetIds = excludeSynsetIds.length > 0 ? excludeSynsetIds : [-1];

  try {
    // Use Prisma ORM for safer query handling
    const relatedData = await prisma.semlinks.findMany({
      where: {
        synset1id: synsetid,
        synset2id: { notIn: safeExcludeSynsetIds },
        linktypes: {
          link: { in: linkTypes }
        }
      },
      include: {
        linktypes: true,
        synsets_semlinks_synset2idTosynsets: {
          include: {
            senses: {
              include: {
                words: true,
                casedwords: true,
                wordigo_difficulty_calculated: true
              },
              take: 1
            },
            lexdomains: true
          }
        }
      },
      take: limit * 2
    });

    const threshold = WORD_LENGTH_THRESHOLDS[filters.wordLengthFilter || 'all'];

    for (const rel of relatedData) {
      if (related.length >= limit) break;

      const synset = rel.synsets_semlinks_synset2idTosynsets;
      if (!synset || !synset.senses || synset.senses.length === 0) continue;

      const sense = synset.senses[0];
      const lemma = sense.words.lemma;
      const wordLength = lemma.length;

      if (
        wordLength >= threshold.min &&
        wordLength <= threshold.max &&
        !excludeLemmas.includes(lemma.toLowerCase())
      ) {
        const calcDiff = sense.wordigo_difficulty_calculated;

        related.push({
          word: {
            wordid: sense.words.wordid,
            lemma: sense.words.lemma,
            cased: sense.casedwords?.cased,
            definition: synset.definition,
            casedwordid: sense.casedwordid,
            synsetid: synset.synsetid,
            senseid: sense.senseid,
            lexdomainid: synset.lexdomainid,
            lexdomainname: synset.lexdomains.lexdomainname,
            pos: synset.pos,
            posName: getPosName(synset.pos),
            word_in_definition: calcDiff?.word_in_definition ?? null,
            def_num_chars: calcDiff?.def_char_count ?? null,
            overall_difficulty_score: calcDiff?.overall_difficulty_score ? Number(calcDiff.overall_difficulty_score) : null,
            difficulty_band: calcDiff?.difficulty_band ?? null,
          },
          strategy: `level4_${rel.linktypes.link.replace(' ', '_')}`,
          linkType: rel.linktypes.link
        });
      }
    }
  } catch (error) {
    console.error('[Linguist] Error getting related by link type:', error);
    return [];
  }

  return related;
}

/**
 * Get very tight siblings (same hypernym AND same lexical domain)
 * Used for Level 5 where we want maximum similarity
 */
async function getTightSiblings(
  correctWord: WordData,
  excludeSynsetIds: number[],
  excludeLemmas: string[],
  filters: LinguistWrongDefinitionFilters,
  limit: number = 3
): Promise<LinguistWrongDefinitionResult[]> {

  const siblings = await getDirectSiblings(
    correctWord.synsetid,
    excludeSynsetIds,
    excludeLemmas,
    filters,
    limit * 2
  );

  // Filter to only those in the same lexical domain
  const tightSiblings = siblings.filter(s =>
    s.word.lexdomainid === correctWord.lexdomainid
  );

  return tightSiblings.slice(0, limit);
}

/**
 * Get word from same lexical domain (fallback for Level 3)
 */
async function getSameDomainWord(
  correctWord: WordData,
  excludeSynsetIds: number[],
  excludeLemmas: string[],
  filters: LinguistWrongDefinitionFilters
): Promise<LinguistWrongDefinitionResult | null> {

  const whereClause: any = {
    lexdomainid: correctWord.lexdomainid,
    synsetid: { notIn: excludeSynsetIds },
    pos: correctWord.pos
  };

  const candidates = await prisma.synsets.findMany({
    where: whereClause,
    include: {
      senses: {
        include: {
          words: true,
          casedwords: true,
          wordigo_difficulty_calculated: true
        },
        take: 1
      },
      lexdomains: true
    },
    take: 30
  });

  // Filter by length and lemma
  const threshold = WORD_LENGTH_THRESHOLDS[filters.wordLengthFilter || 'all'];
  const validCandidates = candidates.filter(c => {
    if (c.senses.length === 0) return false;
    const lemma = c.senses[0].words.lemma;
    const wordLength = lemma.length;

    return (
      wordLength >= threshold.min &&
      wordLength <= threshold.max &&
      !excludeLemmas.includes(lemma.toLowerCase())
    );
  });

  if (validCandidates.length === 0) return null;

  const selected = validCandidates[Math.floor(Math.random() * validCandidates.length)];
  const sense = selected.senses[0];
  const calcDiff = sense.wordigo_difficulty_calculated;

  return {
    word: {
      wordid: sense.words.wordid,
      lemma: sense.words.lemma,
      cased: sense.casedwords?.cased,
      definition: selected.definition,
      casedwordid: sense.casedwordid,
      synsetid: selected.synsetid,
      senseid: sense.senseid,
      lexdomainid: selected.lexdomainid,
      lexdomainname: selected.lexdomains.lexdomainname,
      pos: selected.pos,
      posName: getPosName(selected.pos),
      word_in_definition: calcDiff?.word_in_definition ?? null,
      def_num_chars: calcDiff?.def_char_count ?? null,
      overall_difficulty_score: calcDiff?.overall_difficulty_score ? Number(calcDiff.overall_difficulty_score) : null,
      difficulty_band: calcDiff?.difficulty_band ?? null,
    },
    strategy: 'same_domain_fallback',
    linkType: 'same_domain'
  };
}

/**
 * Helper: Get full POS name from abbreviation
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
 * Check if we have all 3 required wrong definitions
 */
export function hasAllLinguistWrongDefinitions(wrongDefs: LinguistWrongDefinitionResult[]): boolean {
  return wrongDefs.length === 3;
}

export default {
  getLinguistWrongDefinitions,
  hasAllLinguistWrongDefinitions
};
