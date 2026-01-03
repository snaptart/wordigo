# Word Selection & Difficulty Logic

This document explains how Wordigo selects words for gameplay and determines their difficulty levels.

## Table of Contents
- [Overview](#overview)
- [Difficulty Scoring System](#difficulty-scoring-system)
- [Word Selection Strategies](#word-selection-strategies)
- [Implementation Details](#implementation-details)

---

## Overview

Wordigo presents players with a word and four definitions - one correct and three wrong. The game uses sophisticated algorithms to:

1. **Determine word difficulty** using multiple linguistic and statistical indicators
2. **Select semantically-related wrong definitions** to create challenging but fair gameplay
3. **Track selection strategies** for testing and balancing purposes

---

## Difficulty Scoring System

### Difficulty Indicators (7 Factors)

Word difficulty is calculated using a weighted composite of seven indicators:

#### 1. Word Length (Weight: 10%)
- Measured by character count in the lemma
- Longer words are generally harder to understand
- Normalized to 0-100 scale

#### 2. Corpus Frequency (Weight: 25%)
- Based on `tagcount` from the WordNet corpus
- Inverse relationship: rare words (low tagcount) are harder
- Higher weight because frequency strongly correlates with familiarity

#### 3. Definition Complexity - Readability (Weight: 20%)
- Uses Flesch Reading Ease score
- Measures sentence structure and word syllables
- Lower scores = harder to read = harder word

#### 4. Definition Complexity - Length (Weight: 15%)
- Number of characters in the definition
- Longer definitions often indicate more complex concepts
- Normalized to 0-100 scale

#### 5. Word Syllable Count (Weight: 10%)
- More syllables = harder pronunciation and comprehension
- Multisyllabic words tend to be more specialized

#### 6. Sense Ambiguity (Weight: 10%)
- Number of different meanings (senses) for the word
- More senses = more potential confusion
- Highly polysemous words are harder to pin down

#### 7. Semantic Domain Difficulty (Weight: 10%)
- Some lexical domains are inherently more difficult
- Based on domain specialization and abstraction level

#### 8. Word in Definition (Special Modifier)
- **Boolean field**: Does the word appear in its own definition?
- Examples: "paranoid schizophrenia" definition contains "paranoid"
- **Impact**: -15 point penalty to overall difficulty score
- Makes words significantly easier to identify
- Calculated by splitting multi-word lemmas and checking if any part appears in the definition

### Composite Difficulty Score

The final difficulty score combines all 7 weighted indicators (1-7 above), then applies the word-in-definition penalty:

```
final_score = (weighted_sum_of_indicators) - (word_in_definition ? 15 : 0)
```

### Difficulty Bands

Words are grouped into **5 difficulty bands** with equal distribution:

- **Band 1**: Easiest (20% of words)
- **Band 2**: Easy-Medium (20% of words)
- **Band 3**: Medium (20% of words)
- **Band 4**: Medium-Hard (20% of words)
- **Band 5**: Hardest (20% of words)

Bands are calculated using PostgreSQL's `NTILE(5)` function to ensure equal distribution across the entire vocabulary.

### Database Table

Difficulty data is stored in the `wordigo_difficulty` table:

```sql
-- Key fields
senseid                  -- Links to WordNet sense
word_syllable_count      -- Number of syllables
word_in_definition       -- Boolean: word appears in definition
def_avg_read_score       -- Flesch Reading Ease score
def_num_chars            -- Definition character count
def_avg_read_score_band  -- Readability difficulty band (1-5)
def_num_chars_band       -- Length difficulty band (1-5)
```

---

## Word Selection Strategies

### Overview

Each game word requires:
- **1 correct definition** (labeled as "correct")
- **3 wrong definitions** using different selection strategies

The three wrong definitions use progressively different strategies to create variety and balance:

### Strategy 1: Similar (Sibling/Hypernym/Adjacent Domain)

**Purpose**: Create plausible distractors that make players think

**Priority Order**:

1. **Sibling Concepts** (Coordinate Terms)
   - Words that share the same parent category
   - Example: For "dog", select "cat" (both are animals)
   - Found via: hypernym → hyponym relationships in WordNet
   - Label: `[Sibling]`

2. **Hypernyms** (Broader Categories)
   - More general/abstract terms
   - Example: For "rose", select "flower"
   - Includes: hypernym, also_see, meronym relationships
   - Label: `[Hypernym]`

3. **Adjacent Domains** (Related Semantic Fields)
   - Words from semantically related lexical domains
   - Example: For noun.person → noun.body, noun.group
   - Predefined mappings in code
   - Label: `[Adjacent Domain]`

### Strategy 2: Antonym/Contrast

**Purpose**: Provide opposite or contrasting meanings

**Priority Order**:

1. **Lexical Antonyms**
   - Direct antonym relationships in WordNet
   - Example: For "hot", select "cold"
   - Label: `[Antonym]`

2. **Semantic Antonyms**
   - Antonyms at the synset level
   - Label: `[Antonym Semantic]`

3. **Contrasting Domain**
   - Falls back to adjacent domain if no antonyms exist
   - Label: `[Contrast Domain]`

### Strategy 3: Random Different Domain

**Purpose**: Ensure variety and test vocabulary breadth

**Approach**:
- Select from same difficulty band
- Different lexical domain than correct word
- Maintains difficulty balance
- Label: `[Random Different Domain]`

### Fallback Strategies

If a primary strategy fails, the system falls back progressively:

1. **Random Same Band**
   - Any word from the same difficulty band
   - Label: `[Random Same Band]`

2. **Random Any**
   - Last resort: any word from database
   - Label: `[Random Any]`

3. **Fallback Random** (Error State)
   - Used when strategy system encounters errors
   - Label: `[Fallback Random]`

---

## Implementation Details

### Key Functions

#### `getRandomWord(difficultyBand: number)`
Main entry point for word selection. Returns one correct word and three wrong definitions.

**Location**: [wordigo-backend/src/services/wordService.ts:50](wordigo-backend/src/services/wordService.ts#L50)

**Process**:
1. Select random word from specified difficulty band
2. Get correct definition
3. Call `getWrongDefinition()` three times with different strategy indices
4. Exclude already-selected synsets to prevent duplicates
5. Return game word with all definitions and strategy labels

#### `getWrongDefinition(correctWord, excludeSynsetIds, strategyIndex)`
Selects a wrong definition using strategy-specific logic.

**Location**: [wordigo-backend/src/services/wordService.ts:196](wordigo-backend/src/services/wordService.ts#L196)

**Parameters**:
- `correctWord`: The word being defined
- `excludeSynsetIds`: Synsets to exclude (prevent duplicates)
- `strategyIndex`: 0=Similar, 1=Antonym, 2=Random Different Domain

**Returns**: `WordData` object with `strategy` field set

#### `getSimilarWord(correctWord, excludeSynsetIds, casedOperator)`
Implements Strategy 1: Sibling → Hypernym → Adjacent Domain

**Location**: [wordigo-backend/src/services/wordService.ts:232](wordigo-backend/src/services/wordService.ts#L232)

#### `getAntonymWord(correctWord, excludeSynsetIds, casedOperator)`
Implements Strategy 2: Antonym → Semantic Antonym → Contrast Domain

**Location**: [wordigo-backend/src/services/wordService.ts:389](wordigo-backend/src/services/wordService.ts#L389)

#### `getRandomDifferentDomain(correctWord, excludeSynsetIds, casedOperator)`
Implements Strategy 3: Random from different domain, same difficulty

**Location**: [wordigo-backend/src/services/wordService.ts:466](wordigo-backend/src/services/wordService.ts#L466)

#### `getWordFromSynset(synsetid, casedOperator)`
Retrieves word data from a specific WordNet synset.

**Location**: [wordigo-backend/src/services/wordService.ts:553](wordigo-backend/src/services/wordService.ts#L553)

**Important**: Uses fallback logic to handle cased/uncased word preferences

### WordNet Relationships Used

The selection logic leverages these WordNet semantic relationships:

- **Hypernym/Hyponym**: IS-A relationships (dog is-a animal)
- **Meronym**: Part-of relationships (wheel is-part-of car)
- **Antonym**: Opposite meanings (hot vs cold)
- **Also See**: Related concepts
- **Lexical Domains**: Semantic categories (noun.person, verb.motion, etc.)

### Prisma ORM Queries

All database queries use Prisma ORM for:
- Type safety
- Proper array parameter handling
- Relationship navigation
- Clean, maintainable code

Example:
```typescript
const siblings = await prisma.semlink.findMany({
  where: {
    synset2id: { in: hypernymIds },
    synset1id: {
      not: correctWord.synsetid,
      notIn: excludeSynsetIds
    },
    linktype: {
      link: 'hyponym'
    }
  },
  select: { synset1id: true },
  take: 20
});
```

### Strategy Label Display

For gameplay testing, each definition button shows its selection strategy in brackets:

**Frontend Implementation**:
- Types: [wordigo-web/src/types/index.ts](wordigo-web/src/types/index.ts)
- Component: [wordigo-web/src/components/DefinitionButton.tsx](wordigo-web/src/components/DefinitionButton.tsx)
- Styling: [wordigo-web/src/components/DefinitionButton.css](wordigo-web/src/components/DefinitionButton.css)

Strategy labels are formatted from `snake_case` to `Title Case`:
- `sibling` → `[Sibling]`
- `random_different_domain` → `[Random Different Domain]`
- `antonym_semantic` → `[Antonym Semantic]`

---

## Performance Considerations

### Query Optimization

1. **Limited Result Sets**: All queries use `take` limits (10-100 rows)
2. **Indexed Fields**: Queries leverage database indexes on:
   - `synsetid`
   - `lexdomainid`
   - `def_avg_read_score_band`
3. **Progressive Fallbacks**: Stop searching once suitable candidate found

### Caching Opportunities

The system does not currently cache results, but could benefit from:
- Difficulty band distributions
- Common semantic relationships
- Lexical domain mappings

### Error Handling

Each strategy includes try-catch blocks to gracefully handle:
- Missing semantic relationships
- Empty result sets
- Database query failures

Errors trigger fallback strategies rather than failing the game.

---

## Testing & Debugging

### Strategy Label Visibility

The `strategy` field is passed through the entire data pipeline:

1. **Backend**: Set in [wordService.ts](wordigo-backend/src/services/wordService.ts)
2. **API Response**: Included in `StartGameResponse`
3. **Frontend Types**: Defined in [types/index.ts](wordigo-web/src/types/index.ts)
4. **UI Display**: Rendered in [DefinitionButton.tsx](wordigo-web/src/components/DefinitionButton.tsx)

### Console Logging

Errors and warnings are logged to backend console:
```
Error in getWrongDefinition for strategy 0: [error details]
Could not find semantically related wrong definition 1, using random word
```

### Verification Queries

To verify strategy distribution, query the game history:

```sql
-- See which strategies are being used most often
SELECT strategy, COUNT(*) as count
FROM (
  -- Parse strategy from game data
  -- Requires JSON extraction from wrongWords array
) GROUP BY strategy
ORDER BY count DESC;
```

---

## Future Enhancements

### Potential Improvements

1. **Dynamic Weighting**: Adjust difficulty weights based on player performance
2. **Strategy Effectiveness**: Track which strategies are most challenging
3. **Domain Expansion**: Add more adjacent domain mappings
4. **Machine Learning**: Use ML to identify effective distractors
5. **Player Skill Matching**: Adjust difficulty band selection based on player history

### Known Limitations

1. **Limited Antonyms**: Many words don't have antonyms in WordNet
2. **Domain Coverage**: Adjacent domain mappings only cover common domains
3. **Difficulty Subjectivity**: Readability scores don't capture all difficulty aspects
4. **Static Weights**: Difficulty weights are fixed, not adaptive

---

## References

### WordNet Resources
- [WordNet 3.1 Documentation](https://wordnet.princeton.edu/)
- [Semantic Relations](https://wordnet.princeton.edu/documentation/wngloss7wn)

### Schema Documentation
- [WORDNET_SCHEMA_SUMMARY.md](WORDNET_SCHEMA_SUMMARY.md)
- [Prisma Schema](wordigo-backend/prisma/schema.prisma)

### Related Files
- Setup: [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
- Testing: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Phase 1: [PHASE1_COMPLETE.md](PHASE1_COMPLETE.md)
