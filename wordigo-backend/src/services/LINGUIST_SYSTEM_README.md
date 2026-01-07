# Linguist Wrong Definition System

## Overview

This document describes the **Linguist Wrong Definition System**, a parallel implementation to the current wrong definition service. It implements a sophisticated 5-level difficulty progression based on linguistic theory and WordNet semantic relationships.

## Architecture

### Parallel Module Design

The linguist system is implemented as a **completely separate module** that can be toggled on/off via feature flag:

```
wordSelectionService.ts (main entry point)
  ├─> wrongDefinitionService.ts (CURRENT SYSTEM)
  │     ├─> getNearSynonymWord()
  │     └─> getRandomDifferentDomain()
  │
  └─> linguistWrongDefinitionService.ts (NEW LINGUIST SYSTEM)
        ├─> getLevel1Distractors() // Easy
        ├─> getLevel2Distractors() // Less Easy
        ├─> getLevel3Distractors() // Medium
        ├─> getLevel4Distractors() // Hard
        └─> getLevel5Distractors() // Hardest
```

## How to Toggle Between Systems

### Option 1: Global Feature Flag (Quick Switch)

In `wordSelectionService.ts`, change the constant at the top:

```typescript
// Current system (default)
const WRONG_DEFINITION_STRATEGY: 'current' | 'linguist' = 'current';

// Linguist system
const WRONG_DEFINITION_STRATEGY: 'current' | 'linguist' = 'linguist';
```

### Option 2: Per-User Preference (Future Enhancement)

Add to user preferences table:

```typescript
interface UserPreferences {
  // ... existing fields
  wrongDefinitionStrategy?: 'current' | 'linguist';
}
```

Then modify `wordSelectionService.ts`:

```typescript
const WRONG_DEFINITION_STRATEGY = options.userId
  ? (await getUserPreferences(options.userId)).wrongDefinitionStrategy || 'current'
  : 'current';
```

### Option 3: A/B Testing

Randomly assign users to groups:

```typescript
const WRONG_DEFINITION_STRATEGY = (options.userId % 2 === 0)
  ? 'current'
  : 'linguist';
```

## The 5 Difficulty Levels

### Level 1: Easy - Categorical Distractors

**Strategy**: Completely unrelated semantic domains

**Example**:
- **Correct Word**: "Apple" (fruit)
- **Wrong Definitions**:
  - "A feeling of intense anger" (emotion)
  - "A person who builds with wood" (occupation)
  - "A tool for writing" (artifact)

**Player Requirement**: Only needs to recognize the general category

**Implementation**: `getLevel1Distractors()`
- Picks from different `lexdomainid`
- Maximum semantic distance
- Same POS (part of speech)

---

### Level 2: Less Easy - Broad Domain Distractors

**Strategy**: Share a high-level hypernym (2 hops up the tree)

**Example**:
- **Correct Word**: "Apple" (pome fruit)
- **Parent**: "Pome" (fruit with core)
- **Grandparent**: "Edible Fruit"
- **Wrong Definitions**:
  - "A small pulpy fruit" (berry)
  - "A tropical fruit with yellow flesh" (citrus)
  - "A sweet fleshy product of a tree" (drupe)

**Player Requirement**: Must know the specific sub-type, not just "fruit"

**Implementation**: `getLevel2Distractors()`
- Navigate 2 levels up: word → parent → grandparent
- Get random descendants of grandparent (cousins)
- Still related but taxonomically distant

---

### Level 3: Medium - Coordinate Sister Terms

**Strategy**: Direct siblings (same immediate parent)

**Example**:
- **Correct Word**: "Canary" (yellow songbird)
- **Parent**: "Finch"
- **Wrong Definitions**:
  - "A European finch with orange-red breast" (linnet)
  - "A small yellow American finch" (goldfinch)
  - "A small striped Old World finch" (serin)

**Player Requirement**: Must know specific distinguishing characteristics

**Implementation**: `getLevel3Distractors()`
- Find parent hypernym
- Get other children of same parent (siblings)
- All definitions are functionally similar

---

### Level 4: Hard - Structural Confusion (Parts vs Whole)

**Strategy**: Use meronyms (parts), hypernyms (general), and entailments

**Example**:
- **Correct Word**: "Bicycle"
- **Wrong Definitions**:
  - "A hand-operated brake on a bicycle" (meronym - part)
  - "A lever operated with the foot" (meronym - part)
  - "A wheeled motor vehicle" (hypernym - general category)

**Player Requirement**: Must distinguish object from its parts or from general category

**Implementation**: `getLevel4Distractors()`
- Priority 1: Get 2 meronyms (part_meronym, member_meronym, substance_meronym)
- Priority 2: Get 1 hypernym (general version)
- For verbs: Use entailments or troponyms

---

### Level 5: Hardest - Micro-Distinctions (Near-Synonyms)

**Strategy**: Words with very similar meanings but subtle differences

**Example**:
- **Correct Word**: "Irritated" (impatient anger)
- **Wrong Definitions**:
  - "Troubled persistently" (annoyed)
  - "Aroused to slight anger" (peeved)
  - "Caused to feel resentment" (nettled)

**Player Requirement**: Requires understanding of subtle semantic nuances

**Implementation**: `getLevel5Distractors()`
- For adjectives: Use "similar" link type
- For nouns/verbs: Use very tight siblings (same domain + same parent)
- For verbs: Use troponyms (manner-of-action)

---

## Key Features

### 1. Lemma-Level Exclusion

Unlike the current system (synset-only exclusion), the linguist system prevents duplicate lemmas:

```typescript
{
  excludeSynsetIds: [123, 456, 789],
  excludeLemmas: ['bank', 'apple', 'run'], // NEW: Case-insensitive
}
```

**Why?** Prevents showing "bank" (financial) as wrong answer when correct is "bank" (river).

### 2. Filter Compatibility

All game settings filters are supported:

| Filter | Applied? | Notes |
|--------|----------|-------|
| Word Length | ✅ Yes | All definitions match length preference |
| Category | ✅ Yes | Can use strict or smart mode |
| Obscure Words | ✅ Yes | Respects `allowObscureWords` setting |
| POS Matching | ✅ Yes | All definitions same part of speech |

### 3. Category Filter Modes

**Strict Mode** (default):
- All 4 definitions from selected categories
- Ensures thematic consistency

**Smart Mode** (future):
- Levels 1-2: Can mix categories (easier)
- Levels 3-5: Same category (harder)

### 4. Graceful Fallbacks

Each level has fallback strategies if ideal relationships aren't found:

- **Level 2**: Falls back to Level 1 (random different domain)
- **Level 3**: Falls back to same-domain words
- **Level 4**: Falls back to siblings if no meronyms
- **Level 5**: Falls back to any siblings if no "similar" links

## Comparison Metrics

### Tracking Strategy Usage

Each wrong definition includes a `strategy` field for analytics:

```typescript
{
  word: {...},
  strategy: 'level3_sibling', // Which strategy was used
  linkType: 'coordinate',      // Semantic relationship type
  semanticDistance: 1          // Hops in WordNet graph
}
```

### Recommended Analytics

Track these metrics to compare systems:

1. **Player Performance**:
   - Correct answer rate per difficulty level
   - Time to answer
   - Streak lengths

2. **Engagement**:
   - Session length
   - Return rate
   - Difficulty progression speed

3. **Strategy Effectiveness**:
   ```sql
   SELECT
     difficulty_band,
     definition_strategy,
     COUNT(*) as times_used,
     AVG(CASE WHEN correct THEN 1 ELSE 0 END) as success_rate
   FROM game_rounds
   GROUP BY difficulty_band, definition_strategy
   ```

## Testing Guide

### Manual Testing Checklist

For each difficulty level:

1. **Generate 10 words** at that level
2. **Verify** all 4 definitions:
   - ✅ Same word length range
   - ✅ No duplicate lemmas
   - ✅ Same part of speech
   - ✅ Appropriate semantic distance

3. **Check edge cases**:
   - Words with no hypernyms (Level 2)
   - Words with no siblings (Level 3)
   - Words with no meronyms (Level 4)
   - Words with no similar links (Level 5)

### Unit Test Examples

```typescript
describe('Linguist System - Level 3', () => {
  it('should return siblings with same parent', async () => {
    const correct = await getWordData('dog');
    const distractors = await getLevel3Distractors(correct, filters);

    // All should be animals with same parent hypernym
    expect(distractors).toHaveLength(3);
    expect(distractors.every(d => d.linkType === 'coordinate')).toBe(true);
  });

  it('should exclude correct word lemma', async () => {
    const correct = await getWordData('bank'); // financial institution
    const distractors = await getLevel3Distractors(correct, {
      excludeLemmas: ['bank']
    });

    // Should NOT include "bank" (river) even though different synset
    expect(distractors.every(d => d.word.lemma !== 'bank')).toBe(true);
  });
});
```

## Migration Path

### Phase 1: Parallel Testing (Current)
- ✅ Linguist system implemented
- ✅ Feature flag in place
- ⏳ Default: Current system
- ⏳ Can toggle to linguist for testing

### Phase 2: A/B Testing
1. Enable user-level preference
2. Randomly assign 50% to linguist
3. Run for 2-4 weeks
4. Collect analytics

### Phase 3: Decision
Based on data:
- **Keep current**: Remove linguist code
- **Keep linguist**: Make it default, deprecate current
- **Keep both**: Offer as user preference ("Classic" vs "Expert")

## FAQ

**Q: Can I use both systems for different difficulty bands?**
A: Not currently. It's all-or-nothing per user. Could be enhanced.

**Q: Will this break existing user progress?**
A: No. It only affects how wrong definitions are selected. Correct words and difficulty bands remain the same.

**Q: How do I revert to the current system?**
A: Change `WRONG_DEFINITION_STRATEGY` to `'current'` in `wordSelectionService.ts`.

**Q: Can users choose their preferred system?**
A: Not yet. Add `wrongDefinitionStrategy` to user preferences table to enable this.

**Q: What happens if a level can't find enough distractors?**
A: Each level has fallback strategies to ensure 3 wrong definitions are always returned.

---

## References

- **Linguistic Theory**: See `difficulty_rules.md` for full specifications
- **WordNet Documentation**: https://wordnet.princeton.edu/
- **Current System**: `wrongDefinitionService.ts`
- **Linguist System**: `linguistWrongDefinitionService.ts`

---

**Last Updated**: 2026-01-06
**Status**: ✅ Implemented, ready for testing
