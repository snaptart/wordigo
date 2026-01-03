# Pronunciation and Syllable Feature

This document describes the implementation of IPA pronunciation and syllable division functionality in Wordigo.

## Overview

We've integrated the ipa-dict US English pronunciation database (125,927 words with IPA pronunciations) into Wordigo, along with syllable parsing and display capabilities.

## Database

### New Table: `wordigo_pronunciations`

```sql
CREATE TABLE wordigo_pronunciations (
  id          SERIAL PRIMARY KEY,
  wordid      INTEGER REFERENCES words(wordid),
  word        VARCHAR(80) NOT NULL,
  ipa         VARCHAR(200) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wordigo_pronunciations_word ON wordigo_pronunciations(word);
CREATE INDEX idx_wordigo_pronunciations_wordid ON wordigo_pronunciations(wordid);
```

### Data Statistics

- **Total pronunciations**: 135,009 (some words have multiple pronunciations)
- **Unique words**: 125,927
- **Linked to WordNet**: 39,096 words
- **Not in WordNet**: 95,913 words (proper nouns, abbreviations, etc.)

## Backend Implementation

### 1. Pronunciation Utils (`src/utils/pronunciationUtils.ts`)

Provides functions for:

#### `parseSyllablesFromIPA(ipa: string)`
Parses IPA notation to extract syllables using stress markers:
- `ˈ` (U+02C8) = primary stress
- `ˌ` (U+02CC) = secondary stress
- `.` = syllable boundary

**Example:**
```typescript
parseSyllablesFromIPA('/əˈbændən/')
// Returns: {
//   syllables: ['ə', 'bændən'],
//   syllableCount: 2,
//   primaryStress: 1
// }
```

#### `formatSyllablesForDisplay(syllables, primaryStress, secondaryStress)`
Formats syllables with stress indication (uppercase for primary stress):

**Example:**
```typescript
formatSyllablesForDisplay(['ə', 'bændən'], 1)
// Returns: "ə·BÆNDƏN"
```

#### `getSyllableCountAlgorithmic(word: string)`
Fallback syllable counter using the `syllable` npm package for words without IPA data.

### 2. Word Lookup Service Update

The `lookupWord()` function now includes pronunciation data:

```typescript
{
  word: "abandon",
  pronunciation: {
    ipa: "/əˈbændən/",
    syllables: ["ə", "bændən"],
    syllableCount: 2,
    formattedSyllables: "ə·BÆNDƏN"
  },
  definitions: [...],
  // ... other fields
}
```

### 3. Import Script (`scripts/import-pronunciations.js`)

Imports `en_US.txt` file into the database:
- Parses tab-separated format: `word\t/IPA/`
- Handles multiple pronunciations per word
- Links to WordNet when possible
- Batch inserts for performance (1000 records at a time)

**Usage:**
```bash
node scripts/import-pronunciations.js
```

## Frontend Implementation

### WordLookup Component Updates

Added pronunciation display section showing:
1. **IPA notation** - Full International Phonetic Alphabet transcription
2. **Syllables** - Formatted syllables with stress markers (uppercase = primary stress)
3. **Syllable count** - Number in parentheses

### CSS Styling

New styles in `WordLookup.css`:
- `.word-lookup-pronunciation` - Container with subtle background
- `.word-lookup-ipa-text` - Large, readable IPA display
- `.word-lookup-syllables-text` - Syllable display with spacing
- Proper font stacks for IPA character display

## Example Output

For the word "abandon":

```
Word: abandon
Difficulty: intermediate

┌─────────────────────────────┐
│ IPA:       /əˈbændən/       │
│ Syllables: ə·BÆNDƏN (2)     │
└─────────────────────────────┘

Definitions:
1. To give up completely (a practice, a course of action)
   Example: "We abandoned the project"
...
```

## Testing

### Test Scripts

1. **`test-pronunciation.js`** - Tests database lookups
   ```bash
   node scripts/test-pronunciation.js
   ```

2. **`test-syllables.js`** - Tests syllable parsing
   ```bash
   node scripts/test-syllables.js
   ```

### Manual Testing

1. Start the backend: `npm run dev`
2. Start the frontend: `npm run dev`
3. Navigate to Word Lookup
4. Search for words like: "abandon", "dictionary", "hello"

## Dependencies

### Backend
- `syllable` - Algorithmic syllable counting (fallback)
- Existing: `@prisma/client`, Express, TypeScript

### Frontend
- No new dependencies (uses existing React setup)

## Data Source

- **IPA Dictionary**: [ipa-dict](https://github.com/open-dict-data/ipa-dict)
- **License**: CC BY-SA 4.0
- **File**: `en_US.txt` (included in project root)

## Future Enhancements

Possible improvements:
1. Audio pronunciation (using text-to-speech or audio files)
2. Phoneme-by-phoneme breakdown with explanations
3. Rhyme detection using IPA patterns
4. Spelling-to-syllable mapping (approximate)
5. Multiple pronunciation variants display
6. Regional pronunciation variations (UK vs US)

## Notes

- The IPA syllable parsing is based on stress markers, which is accurate but may not match traditional spelling-based syllabification
- Words not in the ipa-dict database fall back to algorithmic syllable counting
- Proper nouns and technical terms may not have pronunciation data
- The `syllable` package provides estimates for words without IPA data
