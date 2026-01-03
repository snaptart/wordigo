# Category Consolidation Analysis

## Current State

The system has **45 lexical domain categories** from WordNet 3.1, with a mapping system in [userPreferencesService.ts:236-283](wordigo-backend/src/services/userPreferencesService.ts#L236-L283) that provides user-friendly display names.

### Current Categories by Type

#### Adjectives (3)
- `adj.all` → "Descriptive (Adjectives)"
- `adj.pert` → Not mapped
- `adj.ppl` → Not mapped

#### Adverbs (1)
- `adv.all` → "Modifiers (Adverbs)"

#### Nouns (26)
- `noun.Tops` → "General"
- `noun.act` → "Actions & Events"
- `noun.animal` → "Animals"
- `noun.artifact` → "Objects & Artifacts"
- `noun.attribute` → "Attributes & Properties"
- `noun.body` → "Body & Anatomy"
- `noun.cognition` → "Knowledge & Thought"
- `noun.communication` → "Communication"
- `noun.event` → "Events & Occurrences"
- `noun.feeling` → "Feelings & Emotions"
- `noun.food` → "Food & Drink"
- `noun.group` → "Groups & Collections"
- `noun.location` → "Places & Locations"
- `noun.motive` → "Motives & Intentions"
- `noun.object` → "Objects"
- `noun.person` → "People"
- `noun.phenomenon` → "Natural Phenomena"
- `noun.plant` → "Plants & Vegetation"
- `noun.possession` → "Possessions & Property"
- `noun.process` → "Processes"
- `noun.quantity` → "Quantities & Measures"
- `noun.relation` → "Relations"
- `noun.shape` → "Shapes & Forms"
- `noun.state` → "States & Conditions"
- `noun.substance` → "Substances & Materials"
- `noun.time` → "Time"
- `noun.linkdef` → Not mapped

#### Verbs (15)
- `verb.body` → "Body Actions"
- `verb.change` → "Changes"
- `verb.cognition` → "Mental Actions"
- `verb.communication` → "Communication Actions"
- `verb.competition` → "Competition & Sports"
- `verb.consumption` → "Consumption"
- `verb.contact` → "Contact & Touch"
- `verb.creation` → "Creation"
- `verb.emotion` → "Emotional Actions"
- `verb.motion` → "Movement"
- `verb.perception` → "Perception"
- `verb.possession` → "Possession"
- `verb.social` → "Social Actions"
- `verb.stative` → "States of Being"
- `verb.weather` → "Weather"

## Issues Identified

### 1. Unmapped Categories
- `adj.pert` (pertaining adjectives)
- `adj.ppl` (participial adjectives)
- `noun.linkdef` (linked definitions)

These are technical WordNet categories that might not be useful for user filtering.

### 2. Overlapping/Similar Categories

#### Nouns - Object-Related (Can consolidate)
- `noun.artifact` → "Objects & Artifacts"
- `noun.object` → "Objects"
- **Recommendation**: Merge into single "Objects & Artifacts" category

#### Nouns - Action/Event (Can consolidate)
- `noun.act` → "Actions & Events"
- `noun.event` → "Events & Occurrences"
- `noun.process` → "Processes"
- **Recommendation**: Merge into "Actions & Events" (processes are ongoing actions)

#### Nouns - Mental/Cognitive (Can consolidate)
- `noun.cognition` → "Knowledge & Thought"
- `noun.motive` → "Motives & Intentions"
- **Recommendation**: Merge into "Thought & Reasoning"

#### Nouns - Property/Attribute (Can consolidate)
- `noun.attribute` → "Attributes & Properties"
- `noun.possession` → "Possessions & Property"
- **Recommendation**: Keep separate - "possession" is ownership, "attribute" is characteristics

#### Verbs - Cognitive (Already well organized)
- `verb.cognition` → "Mental Actions"
- `verb.perception` → "Perception"
- **Recommendation**: Could merge, but distinct enough to keep separate

## Consolidation Proposals

### Option 1: Minimal Consolidation (Conservative)
**Reduce from 45 → 35 categories**

Consolidate only the most obvious overlaps:
1. Merge `noun.artifact` + `noun.object` → "Objects & Artifacts"
2. Merge `noun.act` + `noun.event` → "Actions & Events"
3. Keep `noun.process` separate but rename to "Processes & Procedures"
4. Remove unmapped technical categories (`adj.pert`, `adj.ppl`, `noun.linkdef`)

**Impact**: Minor reduction, maintains granularity for power users

### Option 2: Moderate Consolidation (Recommended)
**Reduce from 45 → 25-28 categories**

Group into broader, user-friendly themes:

#### Living Things (3 categories)
- **Nature & Living Things** (merge `noun.animal` + `noun.plant` + `noun.phenomenon`)
- **People & Society** (`noun.person` + `noun.group`)
- **Body & Health** (`noun.body` + `verb.body`)

#### Objects & Physical World (4 categories)
- **Objects & Things** (`noun.artifact` + `noun.object`)
- **Substances & Materials** (`noun.substance` + `noun.food`)
- **Places & Locations** (`noun.location`)
- **Shapes & Forms** (`noun.shape`)

#### Abstract Concepts (6 categories)
- **Qualities & Attributes** (`noun.attribute`)
- **Knowledge & Thinking** (`noun.cognition` + `noun.motive`)
- **Feelings & Emotions** (`noun.feeling` + `verb.emotion`)
- **Time & Quantity** (`noun.time` + `noun.quantity`)
- **Ownership & Property** (`noun.possession`)
- **Relations & States** (`noun.relation` + `noun.state`)

#### Actions (8 categories)
- **Actions & Events** (`noun.act` + `noun.event` + `noun.process`)
- **Communication** (`noun.communication` + `verb.communication`)
- **Movement & Motion** (`verb.motion` + `verb.contact`)
- **Creation & Change** (`verb.creation` + `verb.change`)
- **Mental Actions** (`verb.cognition` + `verb.perception`)
- **Social Actions** (`verb.social` + `verb.competition`)
- **Consumption & Possession** (`verb.consumption` + `verb.possession`)
- **Weather & Nature** (`verb.weather` + `verb.stative`)

#### General (2 categories)
- **Adjectives (Descriptive)** (`adj.all` + `adj.pert` + `adj.ppl`)
- **Adverbs (Modifiers)** (`adv.all`)

**Impact**: More intuitive for casual users, still offers good granularity

### Option 3: Aggressive Consolidation (Simplest)
**Reduce from 45 → 12-15 categories**

Create high-level super-categories:
1. **Nature & Living Things** (animals, plants, phenomena, body)
2. **People & Society** (people, groups, social actions)
3. **Objects & Things** (artifacts, objects, substances, food, shapes)
4. **Places** (locations)
5. **Ideas & Thinking** (cognition, knowledge, motives)
6. **Feelings** (emotions, feelings)
7. **Communication** (communication nouns & verbs)
8. **Actions & Events** (acts, events, processes, changes)
9. **Movement** (motion, contact)
10. **Creation & Making** (creation, consumption, possession)
11. **Time & Quantity** (time, quantity)
12. **Qualities & States** (attributes, states, relations)
13. **Descriptive Words** (all adjectives)
14. **Modifying Words** (all adverbs)

**Impact**: Easiest for beginners, might be too broad for advanced users

## Implementation Considerations

### Database Impact
- Categories are stored in `user_preferences.category_preferences` as JSON array of strings
- Currently stores lexdomainname (e.g., `"noun.person"`)
- Options:
  1. **Keep lexdomainname, map on display**: No DB changes needed
  2. **Store consolidated IDs**: Requires migration + backward compatibility
  3. **Store both original + consolidated**: Flexible but more complex

### Backward Compatibility
If users already have preferences stored:
- Map old categories to new consolidated ones
- Provide migration script
- Or: Allow both old and new format

### UI/UX Impact
- Fewer checkboxes = easier decision making
- Could offer "Simple" vs "Advanced" category selection modes
- Show word count per category to help users decide

## Recommendation

**Use Option 2 (Moderate Consolidation)** with a hybrid approach:

1. **Default "Simple Mode"**: 12-15 consolidated categories for most users
2. **Advanced Mode Toggle**: Show all 45 original categories for power users
3. **Backend**: Store original lexdomainnames, apply consolidation mapping on selection
4. **No Migration Needed**: Existing preferences work with both modes

### Implementation Steps

1. Create `categoryGroups` mapping object in [userPreferencesService.ts](wordigo-backend/src/services/userPreferencesService.ts)
2. Add `getCategoriesGrouped()` function for simple mode
3. Keep `getAvailableCategories()` for advanced mode
4. Frontend chooses which to display based on user setting
5. Both modes store same format (original lexdomainnames)

## Word Distribution Analysis Needed

Before finalizing, we should query the database to see:
- How many words/senses are in each category?
- Are some categories extremely sparse?
- Which categories have the most overlap?

This data would help make evidence-based consolidation decisions.

## Next Steps

1. Query word distribution across categories
2. Decide on consolidation strategy
3. Implement grouped category mapping
4. Update API to support both simple/advanced modes
5. Update frontend category selector
6. Test with sample user preferences

