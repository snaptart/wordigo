# Two-Tier Category System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Web/Mobile)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐           ┌──────────────────┐             │
│  │  Simple Mode    │           │  Advanced Mode   │             │
│  │  (15 Groups)    │  ◄─────►  │  (42 Lexdomains) │             │
│  └─────────────────┘           └──────────────────┘             │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          │                                       │
│                          ▼                                       │
│              ┌───────────────────────┐                           │
│              │  Category Selector UI │                           │
│              └───────────────────────┘                           │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API ROUTES                             │   │
│  │  GET  /api/categories?mode=simple|advanced&counts=true    │   │
│  │  GET  /api/categories/groups                              │   │
│  │  GET  /api/categories/groups/:groupKey                    │   │
│  │  GET  /api/categories/lexdomains                          │   │
│  │  POST /api/categories/expand                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CATEGORY CONTROLLER                          │   │
│  │  • getCategories()                                        │   │
│  │  • getCategoryGroups()                                    │   │
│  │  • getCategoryGroup()                                     │   │
│  │  • getLexdomains()                                        │   │
│  │  • expandGroupKeys()                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           CATEGORY GROUP SERVICE                          │   │
│  │  • getCategoryGroups(includeCounts)                       │   │
│  │  • getCategoryGroupById(groupId)                          │   │
│  │  • getCategoryGroupByKey(groupKey)                        │   │
│  │  • expandGroupKeysToLexdomainIds(groupKeys)               │   │
│  │  • expandGroupKeysToLexdomainNames(groupKeys)             │   │
│  │  • getAdvancedModeCategories(includeCounts)               │   │
│  │  • getCategoriesByMode(mode, includeCounts)               │   │
│  │  • normalizeCategoryPreferences(prefs, mode)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼ Prisma ORM
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐        ┌───────────────────────────┐   │
│  │  category_groups    │        │ category_group_mappings   │   │
│  ├─────────────────────┤        ├───────────────────────────┤   │
│  │ id (PK)             │◄───┐   │ id (PK)                   │   │
│  │ group_key           │    │   │ group_id (FK) ───────────►│   │
│  │ display_name        │    │   │ lexdomain_id (FK) ────┐   │   │
│  │ description         │    │   │ created_at            │   │   │
│  │ icon                │    └───┤ UNIQUE(group_id,      │   │   │
│  │ sort_order          │        │        lexdomain_id)  │   │   │
│  │ is_active           │        └───────────────────────┘   │   │
│  │ created_at          │                    │               │   │
│  │ updated_at          │                    │               │   │
│  └─────────────────────┘                    │               │   │
│           │                                 │               │   │
│           │                                 ▼               │   │
│           │                    ┌────────────────────────┐   │   │
│           │                    │     lexdomains         │   │   │
│           │                    ├────────────────────────┤   │   │
│           │                    │ lexdomainid (PK) ◄─────┘   │   │
│           │                    │ lexdomainname          │   │   │
│           │                    │ lexdomain              │   │   │
│           │                    │ pos                    │   │   │
│           │                    └────────────────────────┘   │   │
│           │                                │                │   │
│           │                                ▼                │   │
│           │                    ┌────────────────────────┐   │   │
│           │                    │       synsets          │   │   │
│           │                    ├────────────────────────┤   │   │
│           │                    │ synsetid (PK)          │   │   │
│           │                    │ lexdomainid (FK)       │   │   │
│           │                    │ pos, definition        │   │   │
│           │                    └────────────────────────┘   │   │
│           │                                │                │   │
│           │                                ▼                │   │
│           │                    ┌────────────────────────┐   │   │
│           │                    │       senses           │   │   │
│           │                    ├────────────────────────┤   │   │
│           │                    │ senseid (PK)           │   │   │
│           │                    │ synsetid (FK)          │   │   │
│           │                    │ wordid                 │   │   │
│           │                    └────────────────────────┘   │   │
│           │                                                 │   │
│           │ User Preferences ┌────────────────────────┐     │   │
│           └─────────────────►│  user_preferences      │     │   │
│                              ├────────────────────────┤     │   │
│                              │ id (PK)                │     │   │
│                              │ user_id                │     │   │
│                              │ category_preferences   │     │   │
│                              │ category_mode          │     │   │
│                              │ ... other prefs        │     │   │
│                              └────────────────────────┘     │   │
│                                                             │   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: User Selects Categories (Simple Mode)

```
┌──────────┐
│  USER    │
└────┬─────┘
     │ 1. Opens category selector
     ▼
┌─────────────────┐
│   FRONTEND      │
└────┬────────────┘
     │ 2. GET /api/categories?mode=simple&counts=true
     ▼
┌─────────────────────────┐
│  CATEGORY CONTROLLER    │
│  getCategories()        │
└────┬────────────────────┘
     │ 3. Call service
     ▼
┌──────────────────────────────┐
│  CATEGORY GROUP SERVICE      │
│  getCategoryGroups(true)     │
└────┬─────────────────────────┘
     │ 4. Query database
     ▼
┌──────────────────────────────┐
│  DATABASE                    │
│  • category_groups           │
│  • category_group_mappings   │
│  • synsets + senses (counts) │
└────┬─────────────────────────┘
     │ 5. Return 15 groups with counts
     ▼
┌─────────────────┐
│   FRONTEND      │
│  Displays:      │
│  👥 People & Society (27,613)   │
│  🌿 Nature & Living... (34,549) │
│  🔧 Objects & Things (21,126)   │
│  ...                            │
└────┬────────────┘
     │ 6. User selects 3 groups
     ▼
┌──────────────────────────────┐
│  SELECTED:                   │
│  ['people_society',          │
│   'actions_events',          │
│   'communication']           │
└────┬─────────────────────────┘
     │ 7. POST /api/categories/expand
     ▼
┌──────────────────────────────┐
│  CATEGORY CONTROLLER         │
│  expandGroupKeys()           │
└────┬─────────────────────────┘
     │ 8. Call service
     ▼
┌──────────────────────────────────────┐
│  CATEGORY GROUP SERVICE              │
│  expandGroupKeysToLexdomainNames()   │
└────┬─────────────────────────────────┘
     │ 9. Query mappings
     ▼
┌──────────────────────────────┐
│  DATABASE                    │
│  category_group_mappings     │
│  → lexdomains                │
└────┬─────────────────────────┘
     │ 10. Return expanded list
     ▼
┌──────────────────────────────┐
│  EXPANDED TO:                │
│  ['noun.person',             │
│   'noun.group',              │
│   'verb.social',             │
│   'noun.act',                │
│   'noun.event',              │
│   'noun.process',            │
│   'noun.communication',      │
│   'verb.communication']      │
└────┬─────────────────────────┘
     │ 11. Save to user_preferences
     ▼
┌──────────────────────────────┐
│  user_preferences            │
│  category_preferences: [...] │
│  category_mode: 'simple'     │
└──────────────────────────────┘
```

### Flow 2: Word Selection with Category Filter

```
┌──────────┐
│  USER    │
│  Starts  │
│  Game    │
└────┬─────┘
     │ 1. GET /api/word
     ▼
┌────────────────────┐
│  WORD CONTROLLER   │
│  getWord()         │
└────┬───────────────┘
     │ 2. Get user preferences
     ▼
┌────────────────────────────┐
│  user_preferences          │
│  category_preferences:     │
│    ['people_society']      │
│  category_mode: 'simple'   │
└────┬───────────────────────┘
     │ 3. Normalize preferences
     ▼
┌────────────────────────────────────┐
│  CATEGORY GROUP SERVICE            │
│  normalizeCategoryPreferences()    │
└────┬───────────────────────────────┘
     │ 4. Expand if Simple Mode
     ▼
┌────────────────────────────────┐
│  EXPANDED TO:                  │
│  ['noun.person',               │
│   'noun.group',                │
│   'verb.social']               │
└────┬───────────────────────────┘
     │ 5. Word selection query
     ▼
┌─────────────────────────────────────────┐
│  SELECT senses                          │
│  FROM senses                            │
│  JOIN synsets ON senses.synsetid        │
│  JOIN lexdomains ON synsets.lexdomainid │
│  WHERE lexdomains.lexdomainname IN (    │
│    'noun.person',                       │
│    'noun.group',                        │
│    'verb.social'                        │
│  )                                      │
│  AND ... (difficulty, length filters)   │
│  ORDER BY RANDOM()                      │
│  LIMIT 1                                │
└────┬────────────────────────────────────┘
     │ 6. Return word
     ▼
┌──────────────┐
│  WORD PAIR   │
│  Correct +   │
│  Wrong       │
└──────────────┘
```

---

## Component Relationships

```
┌──────────────────────────────────────────────────────────┐
│                    categoryController.ts                  │
│                                                           │
│  • Handles HTTP requests/responses                       │
│  • Input validation                                      │
│  • Error handling                                        │
│  • Calls service layer                                   │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼ uses
┌──────────────────────────────────────────────────────────┐
│                 categoryGroupService.ts                   │
│                                                           │
│  • Business logic                                        │
│  • Data transformation                                   │
│  • Mode detection (simple vs advanced)                  │
│  • Query orchestration                                   │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼ uses
┌──────────────────────────────────────────────────────────┐
│                      Prisma Client                        │
│                                                           │
│  • Database queries                                      │
│  • Type-safe ORM                                         │
│  • Connection pooling                                    │
│  • Query optimization                                    │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼ queries
┌──────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                    │
│                                                           │
│  Tables:                                                 │
│  • category_groups (15 rows)                             │
│  • category_group_mappings (45 rows)                     │
│  • lexdomains (45 rows)                                  │
│  • synsets (~117k rows)                                  │
│  • senses (~207k rows)                                   │
└──────────────────────────────────────────────────────────┘
```

---

## Type System Hierarchy

```
┌──────────────────────────────────────┐
│          CategoryMode                │
│   'simple' | 'advanced'              │
└────────┬─────────────────────────────┘
         │
         ├─────► Simple Mode
         │       ┌────────────────────────────┐
         │       │   CategoryGroup            │
         │       ├────────────────────────────┤
         │       │ • id: number               │
         │       │ • groupKey: string         │
         │       │ • displayName: string      │
         │       │ • description: string?     │
         │       │ • icon: string?            │
         │       │ • sortOrder: number        │
         │       │ • lexdomainCount: number   │
         │       │ • senseCount?: number      │
         │       └────────────────────────────┘
         │                 │
         │                 ▼ extends
         │       ┌────────────────────────────┐
         │       │ CategoryGroupWithDomains   │
         │       ├────────────────────────────┤
         │       │ • ...all above             │
         │       │ • lexdomains: Array<{      │
         │       │     lexdomainId: number    │
         │       │     lexdomainName: string  │
         │       │   }>                       │
         │       └────────────────────────────┘
         │
         └─────► Advanced Mode
                 ┌────────────────────────────┐
                 │   LexdomainCategory        │
                 ├────────────────────────────┤
                 │ • lexdomainId: number      │
                 │ • lexdomainName: string    │
                 │ • displayName: string      │
                 │ • pos: string?             │
                 │ • senseCount?: number      │
                 └────────────────────────────┘

┌──────────────────────────────────────┐
│       CategoryResponse               │
├──────────────────────────────────────┤
│ • mode: CategoryMode                 │
│ • categories:                        │
│     CategoryGroup[] |                │
│     LexdomainCategory[]              │
└──────────────────────────────────────┘
```

---

## Database Schema Details

### Relationships

```
category_groups
    │
    │ 1:N
    ▼
category_group_mappings
    │
    │ N:1
    ▼
lexdomains
    │
    │ 1:N
    ▼
synsets
    │
    │ 1:N
    ▼
senses
```

### Cardinality

- 1 category_group → N category_group_mappings (avg: 3)
- 1 lexdomain → N category_group_mappings (0-1, most are 1)
- 1 lexdomain → N synsets (avg: ~2,600)
- 1 synset → N senses (avg: ~1.8)

### Indexes

```
category_groups:
  - PRIMARY KEY (id)
  - UNIQUE (group_key)
  - INDEX (sort_order)

category_group_mappings:
  - PRIMARY KEY (id)
  - UNIQUE (group_id, lexdomain_id)
  - INDEX (group_id)
  - INDEX (lexdomain_id)

lexdomains:
  - PRIMARY KEY (lexdomainid)
  - INDEX (lexdomainname)
```

---

## Caching Strategy (Future)

```
┌──────────────┐
│   FRONTEND   │ ◄── Cache category lists
└──────┬───────┘     (rarely change)
       │
       ▼
┌──────────────┐
│  API LAYER   │ ◄── Response caching
└──────┬───────┘     (ETags, Cache-Control)
       │
       ▼
┌──────────────┐
│    REDIS     │ ◄── Cache expanded mappings
└──────┬───────┘     (TTL: 1 hour)
       │
       ▼
┌──────────────┐
│  DATABASE    │ ◄── Source of truth
└──────────────┘
```

---

## Error Handling Flow

```
┌────────────────┐
│   API Request  │
└────────┬───────┘
         │
         ▼
┌────────────────────────┐
│  Controller Validation │
│  • Mode valid?         │
│  • Parameters present? │
└────┬───────────────────┘
     │ Invalid
     ├────────────► 400 Bad Request
     │
     │ Valid
     ▼
┌────────────────────────┐
│  Service Layer         │
│  • Business logic      │
│  • Data processing     │
└────┬───────────────────┘
     │ Error
     ├────────────► 500 Internal Error
     │
     │ Success
     ▼
┌────────────────────────┐
│  Database Query        │
│  • Prisma query        │
│  • Transaction         │
└────┬───────────────────┘
     │ Not Found
     ├────────────► 404 Not Found
     │
     │ Success
     ▼
┌────────────────────────┐
│  JSON Response         │
│  { success: true,      │
│    data: {...} }       │
└────────────────────────┘
```

---

## Deployment Considerations

### Database Migrations
```
Development: npx prisma db push
Production:  npx prisma migrate deploy
```

### Environment Variables
```
DATABASE_URL=postgresql://user:pass@host:5432/wordigo_db
```

### Startup Sequence
```
1. Database connection
2. Prisma client initialization
3. Verify category tables exist
4. Optional: Warm up cache
5. Start API server
```

### Health Check
```
GET /api/categories/groups
→ Should return 15 groups
→ If not, run seed script
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Type safety throughout
- ✅ Efficient database queries
- ✅ Scalable caching strategy
- ✅ Comprehensive error handling
- ✅ Easy testing and maintenance

