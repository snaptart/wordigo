# Wrong Definition System Comparison

## Quick Reference: Current vs Linguist

### Overview

| Aspect | Current System | Linguist System |
|--------|---------------|-----------------|
| **Philosophy** | Pragmatic, semantic relationships | Linguistically precise, graduated difficulty |
| **Strategies** | 2-3 strategies for all levels | 5 distinct level-specific strategies |
| **Exclusion** | Synset-only | Synset + Lemma (case-insensitive) |
| **Complexity** | Simpler, proven | More sophisticated, theory-based |
| **Status** | Production (default) | Testing/experimental |

---

## Difficulty Level Strategies

### LEVEL 1: Easy

| Current System | Linguist System |
|----------------|-----------------|
| **Strategy**: Random different domain | **Strategy**: Random different domain |
| Same approach ✅ | Enhanced with lemma exclusion |
| Focus: Any semantically unrelated word | Focus: Maximum semantic distance |
| **Example**: Apple → Hammer | **Example**: Apple → Anger |

---

### LEVEL 2: Less Easy

| Current System | Linguist System |
|----------------|-----------------|
| **Strategy**: Near-synonym (any link) | **Strategy**: Grandparent hypernyms |
| Uses hyponyms, hypernyms, similar | 2-hop navigation up tree |
| No specific semantic distance | Fixed 2-level distance |
| **Example**: Apple → Fruit (hypernym) | **Example**: Apple → Berry (cousin) |

**Key Difference**: Linguist uses **controlled semantic distance** (grandparent level), current uses **any semantic relationship**.

---

### LEVEL 3: Medium

| Current System | Linguist System |
|----------------|-----------------|
| **Strategy**: Near-synonym (priority order) | **Strategy**: Direct siblings only |
| Prioritizes hyponyms, hypernyms, similar | Only coordinate terms (same parent) |
| Falls back through many link types | Stricter sibling requirement |
| **Example**: Apple → Pear, Fruit, Seed | **Example**: Apple → Pear, Orange, Banana |

**Key Difference**: Linguist is **more strict** - only true siblings. Current has **broader fallbacks**.

---

### LEVEL 4: Hard

| Current System | Linguist System |
|----------------|-----------------|
| **Strategy**: Near-synonym (priority order) | **Strategy**: Meronyms + Hypernym mix |
| Same priority as Level 3 | Specifically targets parts/whole confusion |
| No special handling | Prioritizes meronyms first |
| **Example**: Bicycle → Vehicle, Wheel | **Example**: Bicycle → Pedal, Brake, Vehicle |

**Key Difference**: Linguist uses **structural relationships** (parts vs whole), current treats it like Level 3.

---

### LEVEL 5: Hardest

| Current System | Linguist System |
|----------------|-----------------|
| **Strategy**: Near-synonym (priority order) | **Strategy**: Micro-distinctions |
| Same priority as Levels 3-4 | "Similar" links + tight siblings |
| No differentiation from Level 4 | Special handling for adjectives |
| **Example**: Irritated → Angry, Annoyed | **Example**: Irritated → Annoyed, Peeved, Nettled |

**Key Difference**: Linguist seeks **minimal semantic distance**, current has **no special level 5 handling**.

---

## Technical Differences

### 1. Exclusion Logic

**Current System**:
```typescript
excludeSynsetIds: [123, 456, 789]
// Only prevents same synset from appearing twice
```

**Linguist System**:
```typescript
excludeSynsetIds: [123, 456, 789],
excludeLemmas: ['bank', 'apple', 'run']
// Prevents same word appearing with different meanings
```

**Impact**: Linguist prevents confusing scenarios like:
- Correct: "bank" (financial)
- Wrong: "bank" (river) ❌ Prevented in linguist, possible in current

---

### 2. Semantic Navigation

**Current System**:
```typescript
// Single comprehensive query gets ALL relationships
getSemanticRelatedWords(correctWord)
  → Returns ALL link types
  → Prioritize by link type
  → Pick first available
```

**Linguist System**:
```typescript
// Level-specific navigation
Level 1: Different domain (no relationship)
Level 2: Navigate 2 hops up, then random down
Level 3: Navigate 1 hop up, get siblings
Level 4: Get meronyms + hypernym
Level 5: Get 'similar' links + tight siblings
```

**Impact**: Linguist has **controlled difficulty progression**, current has **consistent strategy across levels**.

---

### 3. Fallback Strategies

**Current System**:
```
Try near-synonym → Try siblings → Try same domain → Random
(Same fallback chain for all levels)
```

**Linguist System**:
```
Level 1: Random only (no fallback needed)
Level 2: Cousins → Level 1 fallback
Level 3: Siblings → Same domain → Random
Level 4: Meronyms → Hypernym → Siblings
Level 5: Similar → Tight siblings → Any siblings
(Different fallback per level)
```

---

## Performance Considerations

### Current System

**Pros**:
- ✅ Single comprehensive query
- ✅ Well-tested in production
- ✅ Consistent performance

**Cons**:
- ⚠️ No clear difficulty progression
- ⚠️ Levels 3-5 feel similar

### Linguist System

**Pros**:
- ✅ Clear difficulty progression
- ✅ Linguistically precise
- ✅ Better player learning curve

**Cons**:
- ⚠️ Multiple queries per level (Level 2, 3)
- ⚠️ More complex, needs testing
- ⚠️ Fallbacks may reduce precision

---

## When to Use Each System

### Use Current System When:

1. **Performance is critical**
   - Mobile with slow connection
   - High concurrent users

2. **Simplicity is preferred**
   - Less code maintenance
   - Proven in production

3. **Difficulty distinction less important**
   - Casual gaming experience
   - Focus on word familiarity over nuance

### Use Linguist System When:

1. **Educational value is priority**
   - Teaching vocabulary nuances
   - Progressive difficulty learning

2. **Player engagement matters**
   - Competitive modes
   - Expert/hard-core players

3. **A/B testing shows improvement**
   - Better retention
   - Higher satisfaction scores

---

## Migration Strategy

### Step 1: Testing Phase (Current)
```typescript
// In wordSelectionService.ts
const WRONG_DEFINITION_STRATEGY = 'current'; // Safe default
```

### Step 2: Internal Testing
```typescript
const WRONG_DEFINITION_STRATEGY = 'linguist'; // Enable for testing
// Test with team, QA, beta users
```

### Step 3: A/B Testing
```typescript
const WRONG_DEFINITION_STRATEGY = userId % 2 === 0 ? 'current' : 'linguist';
// 50/50 split for real users
// Run for 2-4 weeks
// Collect metrics
```

### Step 4: Decision
Based on metrics, choose one:

**Option A: Keep Current**
```typescript
// Remove linguist files
// Delete: linguistWrongDefinitionService.ts
// Remove: feature flag code
```

**Option B: Switch to Linguist**
```typescript
const WRONG_DEFINITION_STRATEGY = 'linguist'; // New default
// Deprecate current system
```

**Option C: Offer Both**
```typescript
// Add to user preferences
interface UserPreferences {
  wrongDefinitionStrategy: 'current' | 'linguist';
}
// Let users choose: "Classic Mode" vs "Expert Mode"
```

---

## Metrics to Compare

### Player Performance
```sql
SELECT
  definition_strategy,
  difficulty_band,
  AVG(CASE WHEN correct THEN 1 ELSE 0 END) as success_rate,
  AVG(time_to_answer_ms) as avg_time
FROM game_rounds
WHERE created_at > NOW() - INTERVAL '2 weeks'
GROUP BY definition_strategy, difficulty_band
ORDER BY difficulty_band;
```

### Engagement
```sql
SELECT
  definition_strategy,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(session_length_seconds) as avg_session,
  AVG(words_per_session) as avg_words
FROM game_sessions
WHERE created_at > NOW() - INTERVAL '2 weeks'
GROUP BY definition_strategy;
```

### Strategy Distribution
```sql
SELECT
  definition_strategy,
  strategy_detail, -- e.g., 'level3_sibling', 'near_synonym_hypernym'
  COUNT(*) as times_used,
  AVG(CASE WHEN correct THEN 1 ELSE 0 END) as success_rate
FROM game_rounds
WHERE definition_strategy = 'linguist'
GROUP BY definition_strategy, strategy_detail
ORDER BY times_used DESC;
```

---

## File Locations

| File | Purpose | Status |
|------|---------|--------|
| `wrongDefinitionService.ts` | Current system | ✅ Production |
| `linguistWrongDefinitionService.ts` | New linguist system | ✅ Ready for testing |
| `wordSelectionService.ts` | Integration point | ✅ Feature flag added |
| `LINGUIST_SYSTEM_README.md` | Full linguist docs | ✅ Complete |
| `difficulty_rules.md` | Original spec | 📖 Reference |

---

## Quick Toggle Guide

**To enable linguist system:**

1. Open: [wordSelectionService.ts](wordigo-backend/src/services/wordSelectionService.ts#L23)
2. Find: `const WRONG_DEFINITION_STRATEGY`
3. Change: `'current'` → `'linguist'`
4. Restart server

**To revert:**
- Change back to `'current'`
- No database changes needed
- No user impact

---

## Summary

Both systems are **production-ready** and can coexist. The choice depends on your goals:

- **Current**: Proven, simple, consistent
- **Linguist**: Progressive, educational, precise

The feature flag allows **instant switching** with **zero data migration**, making this a **risk-free experiment**.

---

**Recommendation**: Start with A/B testing to let real player data guide the decision.
