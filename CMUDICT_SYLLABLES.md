# CMUDict Syllable Integration

This document describes the integration of CMU Pronouncing Dictionary syllabified data for accurate syllable division in Wordigo.

## Overview

We've integrated the **CMUDict syllabified version** (cmudict.0.6d.syl) which provides pre-calculated, highly accurate (98%+) syllable boundaries for 119,422 English words.

## Why CMUDict for Syllables?

The CMUDict syllabified version provides superior accuracy compared to algorithmic approaches:
- ✅ **98%+ accuracy** (validated research)
- ✅ **119,422 words** with syllable boundaries
- ✅ **Pre-calculated** - no parsing required
- ✅ **Phonetic syllables** - based on pronunciation, not spelling
- ✅ **Free and open-source**

## Data Source

- **File**: cmudict.0.6d.syl (syllabified CMU Pronouncing Dictionary)
- **URL**: https://webdocs.cs.ualberta.ca/~kondrak/cmudict.html
- **Research**: Bartlett, Kondrak & Cherry (2009) - "On the Syllabification of Phonemes"
- **License**: Free for research and commercial use
- **Format**: ARPABET with hyphens marking syllable boundaries

## Database Schema

### Table: `wordigo_cmudict_syllables`

```sql
CREATE TABLE wordigo_cmudict_syllables (
  id                SERIAL PRIMARY KEY,
  wordid            INTEGER REFERENCES words(wordid),
  word              VARCHAR(80) NOT NULL,
  arpabet           VARCHAR(300) NOT NULL,
  syllable_count    INTEGER NOT NULL,
  syllables         TEXT[] NOT NULL,  -- Array of syllables
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cmudict_syllables_word ON wordigo_cmudict_syllables(word);
CREATE INDEX idx_cmudict_syllables_wordid ON wordigo_cmudict_syllables(wordid);
```

## Data Statistics

- **Total entries**: 119,436
- **Unique words**: 119,422
- **Matched to WordNet**: 33,767
- **Average syllables**: 2.44
- **Max syllables**: 9

## File Format

```
WORD  PHONEME1 PHONEME2 - PHONEME3 PHONEME4 - PHONEME5
```

Where:
- Words are in UPPERCASE
- Phonemes are in ARPABET format
- Vowels have stress markers (0=unstressed, 1=primary stress, 2=secondary stress)
- Hyphens (`-`) mark syllable boundaries

### Examples:

```
ABANDON  AH0 - B AE1 N - D AH0 N
HELLO  HH AH0 - L OW1
DICTIONARY  D IH1 K - SH AH0 - N EH2 - R IY0
SYLLABLE  S IH1 - L AH0 - B AH0 L
```

## Integration Strategy

The word lookup service now uses a **hybrid approach**:

1. **IPA for pronunciation display** (from ipa-dict)
   - Shows International Phonetic Alphabet notation
   - User-friendly for pronunciation learning

2. **CMUDict for syllable accuracy** (from CMUDict)
   - Provides accurate syllable count
   - Provides syllable divisions in ARPABET

3. **Fallback to algorithm** (syllable npm package)
   - For words not in either dictionary
   - Provides reasonable estimates

### Priority Order:

```javascript
if (hasIPA && hasCMUDict) {
  // Best case: IPA for display + CMUDict for syllables
  display: IPA
  syllables: CMUDict
  count: CMUDict
} else if (hasCMUDict only) {
  // Second best: CMUDict provides everything
  display: ARPABET
  syllables: CMUDict
  count: CMUDict
} else if (hasIPA only) {
  // Third: IPA with parsed syllables (less accurate)
  display: IPA
  syllables: parsed from IPA
  count: parsed from IPA
} else {
  // Last resort: algorithmic estimation
  count: syllable npm package
}
```

## Import Script

Location: `wordigo-backend/scripts/import-cmudict-syllables.js`

**Usage:**
```bash
node scripts/import-cmudict-syllables.js
```

Features:
- Parses ARPABET format
- Splits syllables by hyphen markers
- Links to WordNet when possible
- Batch inserts (1000 at a time)
- Skips variant pronunciations (entries with parentheses)

## Example Output

### "abandon"
```
IPA: /əˈbændən/
Syllables: AH0·B AE1 N·D AH0 N
Count: 3
Array: ["AH0", "B AE1 N", "D AH0 N"]
```

### "dictionary"
```
IPA: /ˈdɪkʃəˌnɛɹi/
Syllables: D IH1 K·SH AH0·N EH2·R IY0
Count: 4
Array: ["D IH1 K", "SH AH0", "N EH2", "R IY0"]
```

## Testing

Test script: `scripts/test-cmudict-integration.js`

**Results:**
- abandon: 3 syllables ✓ (previously incorrect: 2)
- hello: 2 syllables ✓
- dictionary: 4 syllables ✓ (previously incorrect: 2)
- syllable: 3 syllables ✓ (previously incorrect: 1)
- pronunciation: 5 syllables ✓

## ARPABET to IPA Conversion (Future)

If desired, we could convert ARPABET to IPA for consistent display:

| ARPABET | IPA | Example |
|---------|-----|---------|
| AH | ʌ | but |
| AE | æ | cat |
| IH | ɪ | bit |
| EH | ɛ | bet |
| OW | oʊ | go |

This would allow us to show IPA even for words only in CMUDict.

## Benefits

1. **Accurate syllable counts** for vocabulary difficulty calculation
2. **Reliable syllable divisions** for pronunciation teaching
3. **98%+ accuracy** vs ~70-80% for algorithmic approaches
4. **Large coverage** - 119,000+ words
5. **Stress information** - primary and secondary stress markers

## Future Enhancements

1. **ARPABET → IPA conversion** for unified pronunciation display
2. **Stress visualization** using the 0/1/2 stress markers
3. **Phoneme-by-phoneme breakdown** with explanations
4. **Rhyme detection** using final syllables
5. **Alternative pronunciations** (currently skipped variants)

## References

- Bartlett, S., Kondrak, G., & Cherry, C. (2009). On the Syllabification of Phonemes. Proceedings of NAACL-HLT 2009.
- CMU Pronouncing Dictionary: http://www.speech.cs.cmu.edu/cgi-bin/cmudict
- Kondrak's Syllabified Version: https://webdocs.cs.ualberta.ca/~kondrak/cmudict.html
