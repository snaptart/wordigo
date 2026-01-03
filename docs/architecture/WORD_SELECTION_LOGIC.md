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

The three wrong definitions use the following strategies to create variety and balance:

### Strategy 1: Near-Synonym (Semantically Related)

**Purpose**: Create highly plausible distractors that teach fine semantic distinctions

**Priority Order**:

1. **Hyponyms** (More Specific Terms)
   - More specific versions of the concept
   - Example: For "dog", select "terrier"
   - Label: `near_synonym_hyponym`

2. **Hypernyms** (More General Terms)
   - More general/abstract terms
   - Example: For "terrier", select "dog"
   - Label: `near_synonym_hypernym`

3. **Similar/Also** (Related Concepts)
   - Explicitly related concepts via WordNet
   - Label: `near_synonym_similar` or `near_synonym_also`

4. **Meronyms/Holonyms** (Part-Whole Relationships)
   - Parts or wholes related to the concept
   - Example: "wheel" for "car" or vice versa
   - Label: `near_synonym_member_meronym`, `near_synonym_part_holonym`, etc.

5. **Sibling Concepts** (Coordinate Terms - Fallback)
   - Words that share the same parent category
   - Example: For "dog", select "cat" (both are animals)
   - Label: `near_synonym_sibling`

6. **Same Domain** (Final Fallback)
   - Words from the same lexical domain with similar definition length
   - Label: `near_synonym_same_domain`

### Strategy 2: Near-Synonym (Second Semantically Related)

**Purpose**: Provide another plausible distractor with subtle differences

**Implementation**: Same as Strategy 1, but excludes already-selected words

This strategy ensures two wrong definitions are semantically related to the correct word, maximizing the challenge and educational value.

### Strategy 3: Random Different Domain

**Purpose**: Ensure variety and test vocabulary breadth

**Approach**:
- Select from same difficulty band
- Different lexical domain than correct word
- Maintains difficulty balance
- Label: `random_different_domain`

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

### Architecture

The word selection system uses a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│         gameService.ts                      │
│         (Game Logic Layer)                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    wordSelectionService.ts                  │
│    (User Preferences & Filters Layer)       │
│    - getRandomWordWithPreferences()         │
│    - Applies user filters                   │
│    - Handles adaptive difficulty            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    wrongDefinitionService.ts ⭐ NEW         │
│    (Strategy Layer - Single Source of Truth)│
│    - getWrongDefinitions()                  │
│    - Centralized strategy logic             │
│    - No duplication                         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    wordService.ts                           │
│    (Primitives Layer)                       │
│    - getNearSynonymWord()                   │
│    - getRandomDifferentDomain()             │
│    - getWordFromSynset()                    │
│    - Database queries                       │
└─────────────────────────────────────────────┘
```

### Key Functions

#### `getRandomWordWithPreferences(options: WordSelectionOptions)`
**Main entry point** for word selection with user preferences.

**Location**: [wordigo-backend/src/services/wordSelectionService.ts:27](wordigo-backend/src/services/wordSelectionService.ts#L27)

**Process**:
1. Load user preferences (difficulty, word length, categories)
2. Apply adaptive difficulty if enabled
3. Select correct word matching filters
4. Call centralized `getWrongDefinitions()` for wrong definitions
5. Apply user filters to results
6. Return game word with all definitions and strategy labels

#### `getWrongDefinitions(correctWord, difficultyBand, filters)`
**Centralized strategy logic** - Single source of truth for wrong definition selection.

**Location**: [wordigo-backend/src/services/wrongDefinitionService.ts:38](wordigo-backend/src/services/wrongDefinitionService.ts#L38)

**Parameters**:
- `correctWord`: The word being defined
- `difficultyBand`: Target difficulty band (optional)
- `filters`: Word length, category, and obscurity filters

**Returns**: Array of `WrongDefinitionResult` objects with strategy labels

**Strategies**:
1. Near-synonym (semantically related)
2. Near-synonym (second semantically related)
3. Random different domain

#### `getNearSynonymWord(correctWord, excludeSynsetIds, casedOperator, targetBand)`
**Primitive function** for finding semantically related words.

**Location**: [wordigo-backend/src/services/wordService.ts:362](wordigo-backend/src/services/wordService.ts#L362)

**Process**:
1. Query ALL semantic relationships via comprehensive query
2. Prioritize link types (hyponym → hypernym → similar → meronyms)
3. Return first match from priority list
4. Fallback to sibling concepts or same domain

#### `getRandomDifferentDomain(correctWord, excludeSynsetIds, casedOperator, targetBand)`
**Primitive function** for selecting random words from different semantic domains.

**Location**: [wordigo-backend/src/services/wordService.ts:698](wordigo-backend/src/services/wordService.ts#L698)

#### `getWordFromSynset(synsetid, casedOperator, targetBand, strictBandMatch)`
**Primitive function** for retrieving word data from a specific WordNet synset.

**Location**: [wordigo-backend/src/services/wordService.ts:825](wordigo-backend/src/services/wordService.ts#L825)

**Important**:
- Uses fallback logic to handle cased/uncased word preferences
- Supports flexible band matching (±1 band) or strict matching

### Refactored Architecture Benefits

The current architecture (refactored January 2026) provides several key advantages:

1. **No Code Duplication**
   - Wrong definition logic exists in ONE place (`wrongDefinitionService.ts`)
   - Previously duplicated across `wordService.ts` and `wordSelectionService.ts`
   - Changes only need to be made once

2. **Clear Separation of Concerns**
   - **Primitives Layer**: Database queries and basic word lookups
   - **Strategy Layer**: Wrong definition selection algorithms
   - **Preferences Layer**: User filters and settings
   - **Game Layer**: Game flow and state management

3. **Easy to Test and Modify**
   - Each layer can be tested independently
   - Strategy changes don't affect primitive functions
   - User preference changes don't affect core algorithms

4. **Backup Files Available**
   - Original implementations preserved as `.backup` files
   - Can be restored if needed for comparison
   - Located at: `wordigo-backend/src/services/*.backup`

### WordNet Relationships Used

The selection logic leverages these WordNet semantic relationships:

- **Hypernym/Hyponym**: IS-A relationships (dog is-a animal)
- **Instance Hypernym/Hyponym**: Specific instances (Albert Einstein is-a physicist)
- **Meronym/Holonym**: Part-of relationships (wheel is-part-of car)
- **Similar/Also**: Related concepts and "see also" relationships
- **Verb Groups**: Related verb forms
- **Cause/Entail**: Causal and implication relationships
- **Attribute**: Property relationships
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

### Completed Improvements ✅

1. **Architecture Refactoring** (January 2026)
   - Eliminated code duplication
   - Centralized wrong definition logic
   - Clear layered architecture
   - Single source of truth for strategies

2. **Near-Synonym Strategy** (January 2026)
   - Replaced antonym strategy with second near-synonym
   - Two semantically-related wrong definitions increase challenge
   - More educational value by teaching fine distinctions

### Potential Improvements

1. **Dynamic Weighting**: Adjust difficulty weights based on player performance
2. **Strategy Effectiveness**: Track which strategies are most challenging
3. **Domain Expansion**: Add more adjacent domain mappings
4. **Machine Learning**: Use ML to identify effective distractors
5. **Player Skill Matching**: Adjust difficulty band selection based on player history
6. **A/B Testing**: Compare effectiveness of different strategy combinations

### Known Limitations

1. **Semantic Coverage**: Not all words have rich semantic relationships in WordNet
2. **Domain Coverage**: Some lexical domains have fewer words than others
3. **Difficulty Subjectivity**: Readability scores don't capture all difficulty aspects
4. **Static Weights**: Difficulty weights are fixed, not adaptive (yet)

---

## File Structure

### Service Layer Files

```
wordigo-backend/src/services/
├── wordService.ts                    # Primitive word selection functions
├── wrongDefinitionService.ts         # Centralized strategy logic (NEW)
├── wordSelectionService.ts           # User preferences & filters
├── gameService.ts                    # Game flow management
├── userPreferencesService.ts         # User settings
├── categoryGroupService.ts           # Category mappings
├── wordService.ts.backup             # Backup of original
└── wordSelectionService.ts.backup    # Backup of original
```

### Key Exports

**wordService.ts**:
- `getRandomWord()` (deprecated)
- `getNearSynonymWord()`
- `getRandomDifferentDomain()`
- `getWordFromSynset()`
- `WordData` interface
- `GameWord` interface

**wrongDefinitionService.ts** ⭐:
- `getWrongDefinitions()` - Main function
- `WrongDefinitionFilters` interface
- `hasAllWrongDefinitions()`

**wordSelectionService.ts**:
- `getRandomWordWithPreferences()` - Main entry point

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

---

## Change Log

### January 2, 2026 - Architecture Refactoring
- Created `wrongDefinitionService.ts` as centralized strategy layer
- Removed duplicate wrong definition logic from `wordService.ts` and `wordSelectionService.ts`
- Changed Strategy 2 from antonym to near-synonym
- Created backup files for rollback if needed
- Updated this documentation to reflect new architecture
