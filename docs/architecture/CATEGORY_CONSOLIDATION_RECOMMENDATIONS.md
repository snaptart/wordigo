# Category Consolidation Recommendations
**Based on Data Analysis of WordNet 3.1 Lexical Domains**

## Executive Summary

Analysis of 207,235 senses across 45 categories reveals significant opportunities for consolidation:
- **Top 5 categories** contain 47.6% of all words
- **Bottom 21 categories** (< 1%) contain only 11.4% of words combined
- **Recommendation**: Implement a 2-tier system with 15 consolidated categories for simple mode and all 45 for advanced mode

---

## Data-Driven Insights

### Category Size Distribution

| Tier | Category Count | % of Total Senses | Description |
|------|---------------|-------------------|-------------|
| Large (>5%) | 5 | 47.6% | adj.all, noun.person, noun.plant, noun.artifact, noun.animal |
| Medium (2-5%) | 7 | 25.1% | noun.act, noun.communication, noun.state, noun.attribute, adv.all, noun.location, noun.cognition |
| Small (1-2%) | 12 | 16.0% | Mid-sized categories |
| Sparse (<1%) | 21 | 11.4% | Long-tail categories |

### Key Findings

1. **Heavy Concentration**: Just 12 categories (27%) contain 72.7% of all senses
2. **Sparse Categories**: 21 categories (47%) each represent less than 1% individually
3. **Technical Categories**: `adj.pert`, `adj.ppl`, `noun.linkdef`, `noun.tops` are WordNet-specific, not user-friendly
4. **Clear Overlaps**: Several related categories can be logically grouped

---

## Recommended Consolidation Strategy

### ✅ Recommended: Two-Tier System

**Simple Mode (15 categories)** - Default for most users
**Advanced Mode (42 categories)** - For power users, excludes only technical categories

### Simple Mode Categories (15)

Based on semantic coherence and balanced distribution:

#### 1. **People & Society** (13.33% of words)
Combines:
- `noun.person` (10.17%) - 21,083 senses
- `noun.group` (2.09%) - 4,337 senses
- `verb.social` (1.06%) - 2,193 senses

**Rationale**: Natural grouping of human-related concepts

---

#### 2. **Nature & Living Things** (16.67% of words)
Combines:
- `noun.plant` (9.05%) - 18,747 senses
- `noun.animal` (7.13%) - 14,780 senses
- `noun.phenomenon` (0.49%) - 1,022 senses

**Rationale**: All natural/biological entities

---

#### 3. **Objects & Things** (10.19% of words)
Combines:
- `noun.artifact` (9.04%) - 18,743 senses
- `noun.object` (1.15%) - 2,383 senses

**Rationale**: Clear overlap - artifacts are manufactured objects

---

#### 4. **Actions & Events** (6.82% of words)
Combines:
- `noun.act` (5.35%) - 11,097 senses
- `noun.event` (0.89%) - 1,845 senses
- `noun.process` (0.58%) - 1,208 senses

**Rationale**: Events are types of actions; processes are ongoing actions

---

#### 5. **Communication & Expression** (5.99% of words)
Combines:
- `noun.communication` (4.49%) - 9,309 senses
- `verb.communication` (1.50%) - 3,111 senses

**Rationale**: Natural pairing of communication concepts and actions

---

#### 6. **Movement & Physical Action** (5.52% of words)
Combines:
- `verb.change` (2.01%) - 4,169 senses
- `verb.contact` (1.77%) - 3,666 senses
- `verb.motion` (1.20%) - 2,479 senses
- `verb.body` (0.54%) - 1,125 senses

**Rationale**: All involve physical action and change

---

#### 7. **Thinking & Knowledge** (3.42% of words)
Combines:
- `noun.cognition` (2.36%) - 4,882 senses
- `verb.cognition` (0.68%) - 1,404 senses
- `verb.perception` (0.39%) - 816 senses

**Rationale**: Mental processes and understanding

---

#### 8. **Materials & Substances** (4.12% of words)
Combines:
- `noun.substance` (2.30%) - 4,768 senses
- `noun.food` (1.82%) - 3,762 senses

**Rationale**: Food is a type of substance; natural grouping

---

#### 9. **Body & Health** (1.77% of words)
Keeps:
- `noun.body` (1.77%) - 3,674 senses

**Rationale**: Distinct enough to stand alone; important category

---

#### 10. **Places & Locations** (2.54% of words)
Keeps:
- `noun.location` (2.54%) - 5,261 senses

**Rationale**: Clear, discrete category; significant size

---

#### 11. **Qualities & Attributes** (3.14% of words)
Combines:
- `noun.attribute` (2.75%) - 5,707 senses
- `noun.feeling` (0.39%) - 818 senses

**Rationale**: Feelings are emotional attributes

---

#### 12. **States & Conditions** (2.86% of words)
Keeps:
- `noun.state` (2.86%) - 5,931 senses

**Rationale**: Large enough to stand alone; distinct concept

---

#### 13. **Time & Quantity** (1.96% of words)
Combines:
- `noun.quantity` (1.08%) - 2,241 senses
- `noun.time` (0.88%) - 1,833 senses

**Rationale**: Both are measurement concepts

---

#### 14. **Creation, Ownership & Possession** (3.27% of words)
Combines:
- `verb.creation` (0.56%) - 1,155 senses
- `noun.possession` (0.79%) - 1,633 senses
- `verb.possession` (0.69%) - 1,430 senses
- `verb.consumption` (0.23%) - 479 senses
- `verb.competition` (0.35%) - 731 senses

**Rationale**: All involve acquiring, having, or using resources

---

#### 15. **Descriptive Words** (14.88% of words)
Combines all adjectives and adverbs:
- `adj.all` (12.18%) - 25,247 senses
- `adv.all` (2.70%) - 5,592 senses

**Rationale**: Modifiers as one category; cleaner for users

**Excluded technical categories**:
- `adj.pert` (2.29%) - specialized adjective type
- `adj.ppl` (0.04%) - participial adjectives (very small)
- `noun.linkdef` (0.35%) - technical WordNet artifact
- `noun.tops` (0.04%) - root-level general category

---

### Advanced Mode Categories (42)

All original categories **except**:
- ❌ `adj.pert` (merge into `adj.all`)
- ❌ `adj.ppl` (merge into `adj.all`)
- ❌ `noun.linkdef` (exclude - technical artifact)

This gives advanced users fine-grained control while removing purely technical categories.

---

## Implementation Plan

### Phase 1: Backend Updates

1. **Update** [userPreferencesService.ts:236-283](wordigo-backend/src/services/userPreferencesService.ts#L236-L283)

Add category group mappings:

```typescript
// Category groups for Simple Mode
const CATEGORY_GROUPS = {
  'people_society': {
    displayName: 'People & Society',
    categories: ['noun.person', 'noun.group', 'verb.social'],
    icon: '👥'
  },
  'nature_living': {
    displayName: 'Nature & Living Things',
    categories: ['noun.plant', 'noun.animal', 'noun.phenomenon'],
    icon: '🌿'
  },
  'objects_things': {
    displayName: 'Objects & Things',
    categories: ['noun.artifact', 'noun.object'],
    icon: '🔧'
  },
  'actions_events': {
    displayName: 'Actions & Events',
    categories: ['noun.act', 'noun.event', 'noun.process'],
    icon: '⚡'
  },
  'communication': {
    displayName: 'Communication & Expression',
    categories: ['noun.communication', 'verb.communication'],
    icon: '💬'
  },
  'movement_physical': {
    displayName: 'Movement & Physical Action',
    categories: ['verb.change', 'verb.contact', 'verb.motion', 'verb.body'],
    icon: '🏃'
  },
  'thinking_knowledge': {
    displayName: 'Thinking & Knowledge',
    categories: ['noun.cognition', 'verb.cognition', 'verb.perception'],
    icon: '🧠'
  },
  'materials_substances': {
    displayName: 'Materials & Substances',
    categories: ['noun.substance', 'noun.food'],
    icon: '🧪'
  },
  'body_health': {
    displayName: 'Body & Health',
    categories: ['noun.body'],
    icon: '❤️'
  },
  'places_locations': {
    displayName: 'Places & Locations',
    categories: ['noun.location'],
    icon: '📍'
  },
  'qualities_attributes': {
    displayName: 'Qualities & Attributes',
    categories: ['noun.attribute', 'noun.feeling'],
    icon: '✨'
  },
  'states_conditions': {
    displayName: 'States & Conditions',
    categories: ['noun.state'],
    icon: '🔄'
  },
  'time_quantity': {
    displayName: 'Time & Quantity',
    categories: ['noun.quantity', 'noun.time'],
    icon: '⏰'
  },
  'creation_ownership': {
    displayName: 'Creation, Ownership & Possession',
    categories: ['verb.creation', 'noun.possession', 'verb.possession', 'verb.consumption', 'verb.competition'],
    icon: '🎨'
  },
  'descriptive_words': {
    displayName: 'Descriptive Words',
    categories: ['adj.all', 'adj.pert', 'adv.all'],
    icon: '📝'
  }
};
```

2. **Add new API endpoints**:
```typescript
// Get categories based on mode
export async function getCategoriesByMode(mode: 'simple' | 'advanced'): Promise<CategoryResponse[]>

// Convert user selection from simple mode to lexdomainnames
export function expandCategoryGroups(groupIds: string[]): string[]
```

### Phase 2: API Updates

Add new route in [src/routes/index.ts](wordigo-backend/src/routes/index.ts):
```typescript
router.get('/categories/:mode', userPreferencesController.getCategoriesByMode);
```

### Phase 3: Frontend Updates

1. Add category mode toggle (Simple/Advanced)
2. Update category selection UI
3. Show category icons in simple mode
4. Display sense counts per category

### Phase 4: Migration & Testing

1. **No migration needed** - both modes use same underlying data
2. Test preference selection in both modes
3. Verify word selection respects category filters
4. Performance testing with multiple categories selected

---

## Benefits of This Approach

### ✅ Pros

1. **No Breaking Changes**: Existing preferences work unchanged
2. **Flexibility**: Users choose complexity level
3. **Evidence-Based**: Groups reflect actual word distribution
4. **Intuitive**: Simple mode categories make semantic sense
5. **Balanced**: Simple categories have roughly similar sizes (except descriptive words)
6. **Performance**: Fewer categories = faster UI, easier decisions

### ⚠️ Considerations

1. **15 categories** still might be many for casual users (could reduce to 10-12)
2. Some categories blend nouns/verbs (acceptable if clearly labeled)
3. Need clear UI to explain what each group contains
4. Icon selection important for quick recognition

---

## Alternative: Ultra-Simple Mode (10 Categories)

If 15 is still too many, further consolidate to 10:

1. **Living Things** (Nature + Animals + Plants + People)
2. **Objects & Places** (Objects + Locations)
3. **Actions** (All verbs except mental ones)
4. **Thinking & Feeling** (Cognition + Emotions + Attributes)
5. **Communication** (Communication nouns + verbs)
6. **Body & Health** (Body)
7. **Materials & Food** (Substances + Food)
8. **States & Qualities** (States + Attributes)
9. **Time & Numbers** (Time + Quantity)
10. **Descriptive Words** (Adj + Adv)

---

## Next Steps

1. ✅ Review this recommendation
2. Choose between 15-category or 10-category simple mode
3. Implement category groupings in backend
4. Update API with mode parameter
5. Design frontend category selector UI
6. User testing with both modes

---

## Appendix: Full Category Mapping

### Simple Mode → Lexdomainnames Mapping

| Simple Category | Included Lexdomainnames | Total Senses |
|----------------|------------------------|--------------|
| People & Society | noun.person, noun.group, verb.social | 27,613 |
| Nature & Living Things | noun.plant, noun.animal, noun.phenomenon | 34,549 |
| Objects & Things | noun.artifact, noun.object | 21,126 |
| Actions & Events | noun.act, noun.event, noun.process | 14,150 |
| Communication & Expression | noun.communication, verb.communication | 12,420 |
| Movement & Physical Action | verb.change, verb.contact, verb.motion, verb.body | 11,439 |
| Thinking & Knowledge | noun.cognition, verb.cognition, verb.perception | 7,102 |
| Materials & Substances | noun.substance, noun.food | 8,530 |
| Body & Health | noun.body | 3,674 |
| Places & Locations | noun.location | 5,261 |
| Qualities & Attributes | noun.attribute, noun.feeling | 6,525 |
| States & Conditions | noun.state | 5,931 |
| Time & Quantity | noun.quantity, noun.time | 4,074 |
| Creation, Ownership & Possession | verb.creation, noun.possession, verb.possession, verb.consumption, verb.competition | 5,428 |
| Descriptive Words | adj.all, adj.pert, adv.all | 35,586 |

**Total**: 203,408 senses (98.2% of all senses)
**Excluded**: 3,827 senses (1.8%) - technical categories

