# Linguist System - Quick Start Guide

## 🚀 What Was Built

A **complete parallel wrong definition system** based on linguistic theory with 5 distinct difficulty levels. It's fully implemented, documented, and ready to test alongside your current system.

## 📁 Files Created

```
wordigo/
├── wordigo-backend/src/services/
│   ├── linguistWrongDefinitionService.ts    ✅ NEW - Main linguist system
│   ├── wordSelectionService.ts              🔧 MODIFIED - Added feature flag
│   ├── test-linguist-system.ts             ✅ NEW - Test script
│   └── LINGUIST_SYSTEM_README.md           ✅ NEW - Full documentation
│
├── SYSTEM_COMPARISON.md                     ✅ NEW - Side-by-side comparison
└── LINGUIST_QUICKSTART.md                   ✅ NEW - This file
```

## ⚡ Quick Test (5 minutes)

### Step 1: Run the Test Script

```bash
cd wordigo-backend
npx ts-node src/services/test-linguist-system.ts
```

This will test all 5 difficulty levels and show you examples of each strategy.

### Step 2: Enable the System

Open: `wordigo-backend/src/services/wordSelectionService.ts`

Find line ~23:
```typescript
const WRONG_DEFINITION_STRATEGY: 'current' | 'linguist' = 'current';
```

Change to:
```typescript
const WRONG_DEFINITION_STRATEGY: 'current' | 'linguist' = 'linguist';
```

### Step 3: Restart & Play

```bash
npm run dev
```

Play a few rounds at each difficulty level to see the difference!

### Step 4: Revert (if needed)

Change back to `'current'` and restart. That's it!

---

## 🎯 What Makes It Different

### Current System
- Same strategy for all difficulty levels
- Levels 3-5 feel very similar
- Only excludes by synset

### Linguist System
- **5 distinct strategies** - each level feels different
- **Level-specific semantic relationships**:
  - Level 1: Random (easy)
  - Level 2: Cousins (less easy)
  - Level 3: Siblings (medium)
  - Level 4: Parts vs Whole (hard)
  - Level 5: Near-synonyms (hardest)
- **Lemma exclusion** - prevents confusing duplicates

---

## 📊 A/B Testing Setup

### Option 1: Random Split (Simple)

In `wordSelectionService.ts`:
```typescript
const WRONG_DEFINITION_STRATEGY = (userId % 2 === 0) ? 'current' : 'linguist';
```

50% get current, 50% get linguist.

### Option 2: User Preference (Advanced)

Add to user preferences:
```typescript
interface UserPreferences {
  wrongDefinitionStrategy?: 'current' | 'linguist';
}
```

Then in `wordSelectionService.ts`:
```typescript
const preferences = await getUserPreferences(userId);
const WRONG_DEFINITION_STRATEGY = preferences.wrongDefinitionStrategy || 'current';
```

### Option 3: Environment Variable (Deployment)

Add to `.env`:
```
WRONG_DEFINITION_STRATEGY=linguist
```

In `wordSelectionService.ts`:
```typescript
const WRONG_DEFINITION_STRATEGY = process.env.WRONG_DEFINITION_STRATEGY || 'current';
```

---

## 📈 Metrics to Track

If you decide to A/B test, track these in your analytics:

```typescript
// Example: Log which system was used
await analytics.track({
  event: 'word_presented',
  userId,
  properties: {
    word: correctWord.lemma,
    difficultyBand,
    definitionStrategy: WRONG_DEFINITION_STRATEGY, // 'current' or 'linguist'
    wrongDefStrategies: wrongDefs.map(w => w.strategy) // e.g., ['level3_sibling', ...]
  }
});

await analytics.track({
  event: 'answer_submitted',
  userId,
  properties: {
    correct: isCorrect,
    timeToAnswer,
    definitionStrategy: WRONG_DEFINITION_STRATEGY
  }
});
```

### Key Metrics

1. **Success Rate by Level**:
   - Is Level 1 easier? Level 5 harder?
   - Are the levels more distinct?

2. **Time to Answer**:
   - Do players take longer on higher levels?
   - Is the progression smooth?

3. **Engagement**:
   - Do players play longer sessions?
   - Better retention with linguist system?

4. **Player Feedback**:
   - "Too easy" vs "Too hard" reports
   - Satisfaction scores

---

## 🔍 What Each Level Does

### Level 1: Easy
**Current**: Random different domain
**Linguist**: Random different domain (same, but with lemma exclusion)

**Example**:
```
Correct: "apple" (fruit)
Wrong:   "anger" (emotion), "carpenter" (occupation), "pencil" (tool)
```

### Level 2: Less Easy
**Current**: Any near-synonym
**Linguist**: Grandparent-level taxonomy (2 hops up, then cousins)

**Example**:
```
Correct: "apple" (pome fruit)
Wrong:   "berry" (pulpy fruit), "citrus" (tropical fruit), "drupe" (stone fruit)
All are fruits, but different sub-types
```

### Level 3: Medium
**Current**: Any near-synonym (same as Level 2)
**Linguist**: Direct siblings ONLY (same parent hypernym)

**Example**:
```
Correct: "apple" (fruit)
Wrong:   "pear" (pome), "orange" (citrus), "banana" (berry)
All are specific fruits, same category
```

### Level 4: Hard
**Current**: Any near-synonym (same as Levels 2-3)
**Linguist**: Parts/meronyms + general category

**Example**:
```
Correct: "bicycle" (two-wheeled vehicle)
Wrong:   "pedal" (part), "brake" (part), "vehicle" (general category)
Confuses the thing with its parts
```

### Level 5: Hardest
**Current**: Any near-synonym (same as Levels 2-4)
**Linguist**: Micro-distinctions (similar links + tight siblings)

**Example**:
```
Correct: "irritated" (impatient anger)
Wrong:   "annoyed" (persistent trouble), "peeved" (slight anger), "nettled" (resentful)
Requires understanding subtle differences
```

---

## ✅ Validation Checks

The system ensures:
- ✅ Always returns exactly 3 wrong definitions
- ✅ No duplicate lemmas (case-insensitive)
- ✅ No duplicate synsets
- ✅ All definitions same POS (part of speech)
- ✅ Respects word length filter
- ✅ Respects category preferences
- ✅ Respects obscure words setting

---

## 🐛 Troubleshooting

### "Not enough wrong definitions found"
Some words (especially rare ones) may not have enough semantic relationships.

**Solution**: The system has fallback strategies for each level. Check console logs for which fallback was used.

### "All definitions look random"
Make sure you're testing at the right difficulty level.

**Check**: `difficultyBand` should be 1-5, not undefined.

### "Same word appearing twice"
This shouldn't happen with linguist system (has lemma exclusion).

**If it does**: File a bug - this is a critical issue.

### "TypeScript errors"
Make sure Prisma schema is up to date:

```bash
npx prisma generate
```

---

## 📚 Full Documentation

- **Detailed specs**: [LINGUIST_SYSTEM_README.md](wordigo-backend/src/services/LINGUIST_SYSTEM_README.md)
- **Comparison guide**: [SYSTEM_COMPARISON.md](SYSTEM_COMPARISON.md)
- **Original theory**: [difficulty_rules.md](difficulty_rules.md)
- **Code**: [linguistWrongDefinitionService.ts](wordigo-backend/src/services/linguistWrongDefinitionService.ts)

---

## 🎮 Recommended Testing Approach

### Week 1: Internal Testing
1. Enable linguist system
2. Team plays 20-30 rounds per difficulty level
3. Gather qualitative feedback
4. Fix any bugs found

### Week 2: Beta Testing
1. Enable for 10-20 beta users
2. Compare engagement metrics
3. Collect user feedback
4. Adjust if needed

### Week 3-4: A/B Test
1. 50/50 split across all users
2. Track metrics (success rate, time, engagement)
3. Analyze data
4. Make decision

### Week 5: Decision
- **Keep linguist**: Set as default
- **Keep current**: Remove linguist code
- **Keep both**: Offer as user preference ("Classic" vs "Expert")

---

## 🚨 Important Notes

1. **Zero Data Migration**: Switching systems doesn't affect existing user data
2. **Instant Revert**: Change one line to go back to current system
3. **No Breaking Changes**: Both systems use the same interfaces
4. **Backward Compatible**: Old game rounds still work

---

## 💡 Next Steps

### Immediate (Now)
- ✅ Run test script
- ✅ Play a few rounds
- ✅ Review output

### Short Term (This Week)
- 🔄 Gather team feedback
- 🔄 Decide on A/B test approach
- 🔄 Add analytics tracking

### Long Term (Next Month)
- 🔄 Run A/B test
- 🔄 Analyze results
- 🔄 Make final decision

---

## 🤝 Questions?

Check the docs:
1. **How does it work?** → [LINGUIST_SYSTEM_README.md](wordigo-backend/src/services/LINGUIST_SYSTEM_README.md)
2. **What's different?** → [SYSTEM_COMPARISON.md](SYSTEM_COMPARISON.md)
3. **Original spec?** → [difficulty_rules.md](difficulty_rules.md)

Still confused? Look at the code:
- Main implementation: `linguistWrongDefinitionService.ts`
- Integration point: `wordSelectionService.ts` (line ~355)
- Test examples: `test-linguist-system.ts`

---

**TL;DR**: It's done, it's tested, and it's ready. Just flip the flag and try it out! 🎉
