# Quick Start Guide - User Options

## Setup (5 minutes)

### 1. Apply Database Migration

```bash
cd wordigo-backend

# Using psql
psql -U postgres -d wordigo -f migrations/add_user_preferences.sql

# Or using Prisma (if not locked)
npx prisma generate
npx prisma db push
```

### 2. Restart Backend

```bash
npm run dev
```

That's it! The backend is ready.

---

## API Quick Reference

### Get Preferences
```bash
GET /api/preferences/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "defaultDifficulty": "adaptive",
    "wordLengthFilter": "all",
    "allowObscureWords": true,
    "categoryPreferences": null,
    "soundEnabled": true,
    "hapticFeedbackEnabled": true
  }
}
```

### Update Preferences
```bash
PUT /api/preferences/:userId
Content-Type: application/json

{
  "defaultDifficulty": "hard",
  "wordLengthFilter": "medium",
  "soundEnabled": false
}
```

### Get Categories
```bash
GET /api/preferences/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "noun.person", "displayName": "People" },
    { "id": 2, "name": "noun.animal", "displayName": "Animals" }
  ]
}
```

---

## Frontend Integration Example

```javascript
// 1. Load user preferences on login
const loadPreferences = async (userId) => {
  const response = await fetch(`/api/preferences/${userId}`);
  const { data } = await response.json();
  return data;
};

// 2. Update preferences from settings screen
const updatePreferences = async (userId, updates) => {
  const response = await fetch(`/api/preferences/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// 3. Start game (preferences auto-applied)
const startGame = async (userId) => {
  const response = await fetch('/api/game/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      difficulty: 'medium',
      userId: userId,  // ← Triggers preference loading
      sessionId: 'session123',
      timerEnabled: true
    })
  });
  return response.json();
};
```

---

## Available Options

### Difficulty Levels
- `easy` → Band 1 (easiest words)
- `less_easy` → Band 2
- `medium` → Band 3
- `hard` → Band 4
- `hardest` → Band 5
- `adaptive` → Auto-adjusts based on performance

### Word Length Filters
- `short` → ≤6 letters
- `medium` → 7-12 letters
- `long` → ≥13 letters
- `all` → No filter

### UI Settings
- `soundEnabled` → true/false
- `hapticFeedbackEnabled` → true/false
- `allowObscureWords` → true/false

### Category Examples
```javascript
[
  "noun.person",      // People
  "noun.animal",      // Animals
  "noun.food",        // Food & Drink
  "verb.cognition",   // Mental Actions
  "verb.motion",      // Movement
  "adj.all",          // Adjectives
  // ... see /api/preferences/categories for full list
]
```

---

## Testing Endpoints

```bash
# Test with curl
curl http://localhost:3001/api/preferences/1
curl http://localhost:3001/api/preferences/categories

curl -X PUT http://localhost:3001/api/preferences/1 \
  -H "Content-Type: application/json" \
  -d '{"defaultDifficulty":"hard"}'

# Or use Postman/Insomnia/Thunder Client
```

---

## Files to Review

| File | Purpose |
|------|---------|
| [USER_OPTIONS_IMPLEMENTATION.md](USER_OPTIONS_IMPLEMENTATION.md) | Complete implementation details |
| [USER_PREFERENCES_API.md](wordigo-backend/USER_PREFERENCES_API.md) | Full API documentation |
| [userPreferencesService.ts](wordigo-backend/src/services/userPreferencesService.ts) | Service logic |
| [schema.prisma](wordigo-backend/prisma/schema.prisma) | Database schema |
| [migrations/add_user_preferences.sql](wordigo-backend/migrations/add_user_preferences.sql) | SQL migration |

---

## How Adaptive Difficulty Works

1. **Initial State**: Starts at Band 3 (medium)
2. **Tracking**: Records last 20 game results
3. **Evaluation**: Checks last 10 games
4. **Adjustment**:
   - ≥80% success → Increase difficulty
   - ≤40% success → Decrease difficulty
   - 40-80% → Stay same
5. **Update**: After each word answer

**No user action needed** - it just works!

---

## Common Use Cases

### Case 1: Beginner User
```javascript
{
  "defaultDifficulty": "easy",
  "wordLengthFilter": "short",
  "allowObscureWords": false
}
```

### Case 2: Advanced User
```javascript
{
  "defaultDifficulty": "hardest",
  "wordLengthFilter": "all",
  "allowObscureWords": true
}
```

### Case 3: Let System Adapt
```javascript
{
  "defaultDifficulty": "adaptive",
  "wordLengthFilter": "all",
  "allowObscureWords": true
}
```

### Case 4: Topic-Focused Learning
```javascript
{
  "defaultDifficulty": "medium",
  "categoryPreferences": ["noun.person", "verb.social", "noun.communication"],
  "wordLengthFilter": "all"
}
```

---

## Need Help?

1. Check [USER_PREFERENCES_API.md](wordigo-backend/USER_PREFERENCES_API.md) for detailed docs
2. Review [USER_OPTIONS_IMPLEMENTATION.md](USER_OPTIONS_IMPLEMENTATION.md) for architecture
3. Look at inline code comments in service files
4. Test endpoints with curl/Postman

**Everything is ready to go!** 🚀
