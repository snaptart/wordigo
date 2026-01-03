# Two-Tier Category System Implementation Guide

## Overview

This document describes the implementation of a two-tier category system for Wordigo, which consolidates 45 WordNet lexical domains into 15 user-friendly category groups while maintaining an advanced mode for power users.

## Database Schema

### Tables Created

#### 1. `category_groups`
Stores the 15 simplified category groups for Simple Mode.

```sql
CREATE TABLE category_groups (
    id SERIAL PRIMARY KEY,
    group_key VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key
- `group_key`: Unique identifier (e.g., `'people_society'`)
- `display_name`: User-facing name (e.g., `'People & Society'`)
- `description`: Explanation of what the group contains
- `icon`: Emoji or icon character for UI
- `sort_order`: Display order in UI
- `is_active`: Enable/disable groups without deletion

#### 2. `category_group_mappings`
Maps category groups to their constituent lexdomains.

```sql
CREATE TABLE category_group_mappings (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    lexdomain_id INTEGER NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES category_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (lexdomain_id) REFERENCES lexdomains(lexdomainid) ON DELETE CASCADE,
    UNIQUE(group_id, lexdomain_id)
);
```

**Columns:**
- `id`: Primary key
- `group_id`: Reference to category_groups
- `lexdomain_id`: Reference to lexdomains
- Unique constraint ensures no duplicate mappings

### Schema Updates

Updated `prisma/schema.prisma` to include:
- New `category_groups` model
- New `category_group_mappings` model
- Relation in `lexdomains` model to `category_group_mappings`

## Category Group Definitions

### Simple Mode (15 Categories)

| Group Key | Display Name | Icon | Lexdomains | Senses |
|-----------|--------------|------|------------|--------|
| `people_society` | People & Society | 👥 | noun.person, noun.group, verb.social | 27,613 |
| `nature_living` | Nature & Living Things | 🌿 | noun.plant, noun.animal, noun.phenomenon | 34,549 |
| `objects_things` | Objects & Things | 🔧 | noun.artifact, noun.object | 21,126 |
| `actions_events` | Actions & Events | ⚡ | noun.act, noun.event, noun.process | 14,150 |
| `communication` | Communication & Expression | 💬 | noun.communication, verb.communication | 12,420 |
| `movement_physical` | Movement & Physical Action | 🏃 | verb.change, verb.contact, verb.motion, verb.body | 11,439 |
| `thinking_knowledge` | Thinking & Knowledge | 🧠 | noun.cognition, verb.cognition, verb.perception | 7,102 |
| `materials_substances` | Materials & Substances | 🧪 | noun.substance, noun.food | 8,530 |
| `body_health` | Body & Health | ❤️ | noun.body | 3,674 |
| `places_locations` | Places & Locations | 📍 | noun.location | 5,261 |
| `qualities_attributes` | Qualities & Attributes | ✨ | noun.attribute, noun.feeling | 6,525 |
| `states_conditions` | States & Conditions | 🔄 | noun.state | 5,931 |
| `time_quantity` | Time & Quantity | ⏰ | noun.quantity, noun.time | 4,074 |
| `creation_ownership` | Creation, Ownership & Possession | 🎨 | verb.creation, noun.possession, verb.possession, verb.consumption, verb.competition | 5,428 |
| `descriptive_words` | Descriptive Words | 📝 | adj.all, adj.pert, adv.all | 35,586 |

**Coverage**: 203,408 senses (98.2% of all senses)

### Advanced Mode (42 Categories)

All original WordNet lexdomains **except**:
- `noun.tops` (root category - 85 senses)
- `noun.linkdef` (technical metadata - 719 senses)
- `adj.ppl` (participial adjectives - merged into `adj.all`)

**Coverage**: 204,151 senses (98.5% of all senses)

## Files Created

### Migration & Seed
- `wordigo-backend/migrations/add_category_groups.sql` - SQL migration script
- `wordigo-backend/seed-category-groups.ts` - TypeScript seed script

### Services
- `wordigo-backend/src/services/categoryGroupService.ts` - Business logic for category groups

### Controllers
- `wordigo-backend/src/controllers/categoryController.ts` - HTTP request handlers

### Types
- Updated `wordigo-backend/src/types/index.ts` with:
  - `CategoryMode` type
  - `CategoryGroup` interface
  - `CategoryGroupWithDomains` interface
  - `LexdomainCategory` interface
  - `CategoryResponse` interface

### Routes
- Updated `wordigo-backend/src/routes/index.ts` with new category endpoints

## API Endpoints

### GET `/api/categories`
Get categories based on mode (simple or advanced).

**Query Parameters:**
- `mode` (optional): `'simple'` or `'advanced'` (default: `'simple'`)
- `counts` (optional): `'true'` or `'false'` (default: `'false'`) - include word counts

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "simple",
    "categories": [
      {
        "id": 1,
        "groupKey": "people_society",
        "displayName": "People & Society",
        "description": "Human beings, social groups, and social interactions",
        "icon": "👥",
        "sortOrder": 1,
        "lexdomainCount": 3,
        "senseCount": 27613
      }
      // ... more categories
    ]
  }
}
```

### GET `/api/categories/groups`
Get all category groups (Simple Mode only).

**Query Parameters:**
- `counts` (optional): Include sense counts

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "groupKey": "people_society",
      "displayName": "People & Society",
      "description": "Human beings, social groups, and social interactions",
      "icon": "👥",
      "sortOrder": 1,
      "lexdomainCount": 3
    }
    // ... more groups
  ]
}
```

### GET `/api/categories/groups/:groupKey`
Get a specific category group with its lexdomains.

**Example:** `/api/categories/groups/people_society`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "groupKey": "people_society",
    "displayName": "People & Society",
    "description": "Human beings, social groups, and social interactions",
    "icon": "👥",
    "sortOrder": 1,
    "lexdomainCount": 3,
    "lexdomains": [
      { "lexdomainId": 18, "lexdomainName": "noun.person" },
      { "lexdomainId": 14, "lexdomainName": "noun.group" },
      { "lexdomainId": 41, "lexdomainName": "verb.social" }
    ]
  }
}
```

### GET `/api/categories/lexdomains`
Get all lexdomains (Advanced Mode).

**Query Parameters:**
- `counts` (optional): Include sense counts

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "lexdomainId": 0,
      "lexdomainName": "adj.all",
      "displayName": "Descriptive (Adjectives)",
      "pos": "a",
      "senseCount": 25247
    }
    // ... more lexdomains
  ]
}
```

### POST `/api/categories/expand`
Expand category group keys to lexdomain names.

**Request Body:**
```json
{
  "groupKeys": ["people_society", "nature_living"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groupKeys": ["people_society", "nature_living"],
    "lexdomainNames": [
      "noun.person",
      "noun.group",
      "verb.social",
      "noun.plant",
      "noun.animal",
      "noun.phenomenon"
    ]
  }
}
```

## Service Functions

### `categoryGroupService.ts`

```typescript
// Get all category groups (Simple Mode)
getCategoryGroups(includeCounts?: boolean): Promise<CategoryGroup[]>

// Get specific group by ID
getCategoryGroupById(groupId: number): Promise<CategoryGroupWithDomains | null>

// Get specific group by key
getCategoryGroupByKey(groupKey: string): Promise<CategoryGroupWithDomains | null>

// Expand group keys to lexdomain IDs
expandGroupKeysToLexdomainIds(groupKeys: string[]): Promise<number[]>

// Expand group keys to lexdomain names
expandGroupKeysToLexdomainNames(groupKeys: string[]): Promise<string[]>

// Get all lexdomains (Advanced Mode)
getAdvancedModeCategories(includeCounts?: boolean): Promise<LexdomainCategory[]>

// Get categories by mode
getCategoriesByMode(mode: CategoryMode, includeCounts?: boolean): Promise<CategoryGroup[] | LexdomainCategory[]>

// Normalize preferences (convert group keys to lexdomain names if needed)
normalizeCategoryPreferences(preferences: string[], mode: CategoryMode): Promise<string[]>
```

## Usage Examples

### Frontend: Fetching Simple Mode Categories

```typescript
const response = await fetch('/api/categories?mode=simple&counts=true');
const { data } = await response.json();

// Display categories
data.categories.forEach(category => {
  console.log(`${category.icon} ${category.displayName} (${category.senseCount} words)`);
});
```

### Frontend: User Selects Categories (Simple Mode)

```typescript
// User selects these groups in UI
const selectedGroups = ['people_society', 'nature_living', 'objects_things'];

// Expand to lexdomain names for filtering
const response = await fetch('/api/categories/expand', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ groupKeys: selectedGroups })
});

const { data } = await response.json();
// data.lexdomainNames = ['noun.person', 'noun.group', 'verb.social', ...]

// Save to user preferences
await updateUserPreferences({
  categoryPreferences: data.lexdomainNames,
  categoryMode: 'simple'
});
```

### Backend: Word Selection with Category Filter

```typescript
import categoryGroupService from './services/categoryGroupService';

// User has preferences stored
const userPrefs = {
  categoryPreferences: ['people_society', 'actions_events'],
  categoryMode: 'simple'
};

// Normalize to lexdomain names
const lexdomainNames = await categoryGroupService.normalizeCategoryPreferences(
  userPrefs.categoryPreferences,
  userPrefs.categoryMode
);

// Use in word selection query
const words = await selectWords({
  categoryPreferences: lexdomainNames
  // ... other options
});
```

## Installation Steps

### 1. Run Database Migration

**Option A: Using psql**
```bash
cd wordigo-backend
psql -U your_username -d wordigo_db -f migrations/add_category_groups.sql
```

**Option B: Using Prisma**
```bash
cd wordigo-backend
npx prisma db push
```

### 2. Seed Category Groups

```bash
cd wordigo-backend
npx ts-node seed-category-groups.ts
```

Expected output:
```
🌱 Starting category groups seed...
🧹 Clearing existing category group data...
✅ Cleared existing data

📁 Creating group: People & Society
   ✓ Added 3 lexdomain mappings
📁 Creating group: Nature & Living Things
   ✓ Added 3 lexdomain mappings
...

✅ Successfully seeded 15 category groups
✅ Created 45 category-to-lexdomain mappings

📊 Verification:
   Category Groups: 15
   Mappings: 45

🎉 Seed completed successfully!
```

### 3. Generate Prisma Client

```bash
cd wordigo-backend
npx prisma generate
```

### 4. Test API Endpoints

```bash
# Test Simple Mode
curl "http://localhost:3000/api/categories?mode=simple&counts=true"

# Test Advanced Mode
curl "http://localhost:3000/api/categories?mode=advanced"

# Test Specific Group
curl "http://localhost:3000/api/categories/groups/people_society"

# Test Expansion
curl -X POST "http://localhost:3000/api/categories/expand" \
  -H "Content-Type: application/json" \
  -d '{"groupKeys": ["people_society", "nature_living"]}'
```

## User Preferences Schema Update

### Add `category_mode` Column

```sql
ALTER TABLE user_preferences
ADD COLUMN category_mode VARCHAR(20) DEFAULT 'simple';
```

### Update Prisma Schema

Already updated in `prisma/schema.prisma`:
```prisma
model user_preferences {
  // ... existing fields
  category_mode String? @default("simple") @db.VarChar(20)
}
```

## Migration Path for Existing Users

Existing users with `categoryPreferences` stored as lexdomain names:

1. **No migration needed** if they want to use Advanced Mode
   - Set `category_mode = 'advanced'`
   - Keep existing `category_preferences` array

2. **Optional conversion** to Simple Mode
   - Map existing lexdomain names to group keys
   - Update `category_mode = 'simple'`
   - Update `category_preferences` with group keys

## Frontend Integration Checklist

- [ ] Add category mode toggle (Simple/Advanced) to preferences UI
- [ ] Implement category selection UI for Simple Mode (15 groups with icons)
- [ ] Implement category selection UI for Advanced Mode (42 lexdomains)
- [ ] Save both `categoryPreferences` and `categoryMode` to backend
- [ ] Show word counts next to each category (optional)
- [ ] Add tooltips/descriptions for category groups
- [ ] Test category filtering in word selection

## Performance Considerations

### Indexes Created
- `category_groups.group_key` - Fast lookup by key
- `category_groups.sort_order` - Fast ordering for display
- `category_group_mappings.group_id` - Fast mapping lookup
- `category_group_mappings.lexdomain_id` - Reverse mapping support

### Query Optimization
- All group expansion queries use indexed joins
- Sense counts are optional (set `counts=false` for faster response)
- Mappings are cached in memory (consider adding Redis for production)

## Testing

### Unit Tests

```typescript
// Test category group retrieval
test('getCategoryGroups returns 15 groups', async () => {
  const groups = await categoryGroupService.getCategoryGroups();
  expect(groups).toHaveLength(15);
});

// Test group expansion
test('expandGroupKeys expands correctly', async () => {
  const lexdomains = await categoryGroupService.expandGroupKeysToLexdomainNames([
    'people_society'
  ]);
  expect(lexdomains).toContain('noun.person');
  expect(lexdomains).toContain('noun.group');
  expect(lexdomains).toContain('verb.social');
});
```

### Integration Tests

```typescript
// Test API endpoint
test('GET /api/categories?mode=simple returns groups', async () => {
  const response = await request(app).get('/api/categories?mode=simple');
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.categories).toHaveLength(15);
});
```

## Future Enhancements

1. **Custom Category Groups**
   - Allow users to create their own category groups
   - Save to user-specific table

2. **Category Analytics**
   - Track which categories are most popular
   - Show difficulty distribution per category

3. **Dynamic Groupings**
   - A/B test different grouping strategies
   - Machine learning to optimize groupings

4. **Internationalization**
   - Translate category names and descriptions
   - Support multiple languages

## Troubleshooting

### Issue: Seed script fails with "relation does not exist"
**Solution**: Run Prisma migration first
```bash
npx prisma db push
```

### Issue: API returns empty categories
**Solution**: Check that seed script ran successfully
```bash
npx ts-node seed-category-groups.ts
```

### Issue: Word counts are incorrect
**Solution**: Verify lexdomain mappings
```sql
SELECT cg.display_name, COUNT(DISTINCT se.senseid) as sense_count
FROM category_groups cg
JOIN category_group_mappings cgm ON cg.id = cgm.group_id
JOIN synsets sy ON sy.lexdomainid = cgm.lexdomain_id
JOIN senses se ON se.synsetid = sy.synsetid
GROUP BY cg.id, cg.display_name
ORDER BY cg.sort_order;
```

## Documentation Files

- `CATEGORY_CONSOLIDATION_ANALYSIS.md` - Initial analysis
- `CATEGORY_CONSOLIDATION_RECOMMENDATIONS.md` - Detailed recommendations
- `CATEGORY_SUMMARY.md` - Executive summary
- `CATEGORY_TWO_TIER_IMPLEMENTATION.md` - This file

## Support

For questions or issues, refer to:
1. This implementation guide
2. API documentation in `wordigo-backend/README.md`
3. Service code comments in `categoryGroupService.ts`

