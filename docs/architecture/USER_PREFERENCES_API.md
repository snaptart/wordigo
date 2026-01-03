# User Preferences API Documentation

This document describes the backend API endpoints for managing user preferences and options in Wordigo.

## Table of Contents
- [Overview](#overview)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Integration Guide](#integration-guide)

---

## Overview

The User Preferences system allows users to customize their Wordigo experience with:

### Difficulty Preferences
- **Default Difficulty**: Easy / Less Easy / Medium / Hard / Hardest / Adaptive
- **Word Length Filter**: Short (≤6 letters) / Medium (7-12) / Long (≥13) / All
- **Category Preferences**: Select preferred lexical domains (Science, Arts, etc.)
- **Allow Obscure Words**: Toggle for archaic/rare vocabulary

### User Interface Preferences
- **Sound Effects**: Enable/disable audio feedback
- **Haptic Feedback**: Enable/disable vibration (mobile)

### Adaptive Difficulty
The system automatically adjusts difficulty based on user performance:
- Tracks recent game results (last 10 games)
- Adjusts difficulty band (1-5) based on success rate
- Success rate ≥ 80% → increase difficulty
- Success rate ≤ 40% → decrease difficulty

---

## Data Models

### UserPreferences

```typescript
interface UserPreferences {
  id: number;
  userId: number;

  // Difficulty Preferences
  defaultDifficulty: 'easy' | 'less_easy' | 'medium' | 'hard' | 'hardest' | 'adaptive';
  wordLengthFilter: 'short' | 'medium' | 'long' | 'all';
  allowObscureWords: boolean;
  categoryPreferences?: string[] | null; // Array of lexdomain names

  // UI Preferences
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;

  // Adaptive Difficulty Data
  adaptiveDifficultyData?: {
    currentBand: number; // 1-5
    performanceHistory: PerformanceRecord[];
    adjustmentTimestamp: Date;
  } | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### Difficulty Level Mapping

| Difficulty Level | Difficulty Band | Description |
|-----------------|----------------|-------------|
| easy | 1 | Simplest words, common vocabulary |
| less_easy | 2 | Easy-to-medium difficulty |
| medium | 3 | Moderate difficulty |
| hard | 4 | Challenging words |
| hardest | 5 | Most difficult words |
| adaptive | Dynamic | Automatically adjusts based on performance |

---

## API Endpoints

### 1. Get User Preferences

**GET** `/api/preferences/:userId`

Retrieves the user's preferences. Creates default preferences if none exist.

**Parameters:**
- `userId` (path) - The user's ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "defaultDifficulty": "adaptive",
    "wordLengthFilter": "all",
    "allowObscureWords": true,
    "categoryPreferences": ["noun.person", "verb.cognition"],
    "soundEnabled": true,
    "hapticFeedbackEnabled": true,
    "adaptiveDifficultyData": {
      "currentBand": 1,
      "performanceHistory": [...],
      "adjustmentTimestamp": "2025-12-31T10:00:00Z"
    },
    "createdAt": "2025-12-31T09:00:00Z",
    "updatedAt": "2025-12-31T10:00:00Z"
  }
}
```

**Default Values** (created on first access):
- `defaultDifficulty`: "adaptive"
- `wordLengthFilter`: "all"
- `allowObscureWords`: true
- `soundEnabled`: true
- `hapticFeedbackEnabled`: true
- `adaptiveDifficultyData.currentBand`: 1 (easiest)

---

### 2. Update User Preferences

**PUT** `/api/preferences/:userId`

Updates user preferences. Only provided fields are updated.

**Parameters:**
- `userId` (path) - The user's ID

**Request Body:**
```json
{
  "defaultDifficulty": "hard",
  "wordLengthFilter": "medium",
  "allowObscureWords": false,
  "categoryPreferences": ["noun.cognition", "verb.communication"],
  "soundEnabled": false,
  "hapticFeedbackEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "defaultDifficulty": "hard",
    "wordLengthFilter": "medium",
    "allowObscureWords": false,
    // ... full preferences object
  }
}
```

**Validation:**
- `defaultDifficulty`: Must be one of: easy, less_easy, medium, hard, hardest, adaptive
- `wordLengthFilter`: Must be one of: short, medium, long, all
- `categoryPreferences`: Must be an array of valid lexdomain names
- Boolean fields must be actual booleans

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid difficulty level. Must be one of: easy, less_easy, medium, hard, hardest, adaptive"
}
```

---

### 3. Get Available Categories

**GET** `/api/preferences/categories`

Retrieves all available lexical domain categories for filtering.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "noun.person",
      "displayName": "People"
    },
    {
      "id": 2,
      "name": "noun.animal",
      "displayName": "Animals"
    },
    {
      "id": 15,
      "name": "verb.cognition",
      "displayName": "Mental Actions"
    },
    // ... more categories
  ]
}
```

**Category Mappings:**

| Lexdomain Name | Display Name |
|----------------|-------------|
| noun.person | People |
| noun.animal | Animals |
| noun.artifact | Objects & Artifacts |
| noun.cognition | Knowledge & Thought |
| noun.communication | Communication |
| noun.food | Food & Drink |
| verb.motion | Movement |
| verb.cognition | Mental Actions |
| verb.communication | Communication Actions |
| adj.all | Descriptive (Adjectives) |
| adv.all | Modifiers (Adverbs) |
| ... | ... |

See [userPreferencesService.ts:234-275](wordigo-backend/src/services/userPreferencesService.ts#L234-L275) for the complete mapping.

---

## Usage Examples

### Example 1: Setting User to Easy Difficulty with Short Words

```javascript
// Update preferences
await fetch(`/api/preferences/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    defaultDifficulty: 'easy',
    wordLengthFilter: 'short',
    allowObscureWords: false
  })
});

// Start a game - words will be automatically filtered
await fetch('/api/game/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    difficulty: 'easy',
    userId: userId,
    sessionId: sessionId,
    timerEnabled: true
  })
});
```

### Example 2: Using Adaptive Difficulty

```javascript
// Set to adaptive mode
await fetch(`/api/preferences/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    defaultDifficulty: 'adaptive'
  })
});

// Game will automatically adjust difficulty based on performance
// After each word answer, the system updates adaptive difficulty
```

### Example 3: Filtering by Category Preferences

```javascript
// Get available categories
const categoriesResponse = await fetch('/api/preferences/categories');
const { data: categories } = await categoriesResponse.json();

// User selects Science and Technology categories
const selectedCategories = categories
  .filter(cat => cat.displayName.includes('Science') || cat.name.includes('cognition'))
  .map(cat => cat.name);

// Update preferences with categories
await fetch(`/api/preferences/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    categoryPreferences: selectedCategories
  })
});

// Games will now only use words from selected categories
```

### Example 4: Disabling Sound and Haptic Feedback

```javascript
await fetch(`/api/preferences/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    soundEnabled: false,
    hapticFeedbackEnabled: false
  })
});
```

---

## Integration Guide

### How Preferences Affect Word Selection

When a game starts, the word selection service automatically applies user preferences:

1. **Difficulty Filter**
   - Maps difficulty level to difficulty band (1-5)
   - For adaptive mode, uses current adaptive band from performance history
   - Filters words by `def_avg_read_score_band`

2. **Word Length Filter**
   - Short: ≤6 characters
   - Medium: 7-12 characters
   - Long: ≥13 characters
   - Applied during word selection

3. **Category Preferences**
   - Filters words by lexdomain
   - Only selects words from chosen categories
   - If empty, all categories are included

4. **Obscure Words Filter**
   - When disabled, excludes words where `word_in_definition = true`
   - These words are easier (the word appears in its own definition)
   - Can also filter by tagcount (word frequency)

### Adaptive Difficulty Algorithm

The adaptive difficulty system tracks performance and adjusts automatically:

```typescript
// After each word is answered
if (recentGames.length >= 5) {
  const successRate = correctCount / totalCount;

  if (successRate >= 0.8 && currentBand < 5) {
    currentBand++; // Increase difficulty
  } else if (successRate <= 0.4 && currentBand > 1) {
    currentBand--; // Decrease difficulty
  }
  // 0.4-0.8 keeps current difficulty
}
```

**Performance Tracking:**
- Keeps last 20 game results
- Evaluates last 10 games for adjustments
- Updates after each word answer
- Stores in `adaptiveDifficultyData.performanceHistory`

### Backend Implementation

The preferences flow through the system:

1. **User sets preferences** → `PUT /api/preferences/:userId`
2. **Preferences stored** in `user_preferences` table
3. **Game starts** → `POST /api/game/start`
4. **Word selection** uses `getRandomWordWithPreferences()`
5. **Filters applied** based on user preferences
6. **Words returned** matching all criteria
7. **Answer submitted** → adaptive difficulty updated

### Database Schema

```sql
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    default_difficulty VARCHAR(20) NOT NULL DEFAULT 'adaptive',
    word_length_filter VARCHAR(20) NOT NULL DEFAULT 'all',
    allow_obscure_words BOOLEAN NOT NULL DEFAULT true,
    category_preferences JSONB,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    haptic_feedback_enabled BOOLEAN NOT NULL DEFAULT true,
    adaptive_difficulty_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "success": false,
  "error": "Invalid user ID"
}
```

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": "Invalid word length filter. Must be one of: short, medium, long, all"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to update user preferences"
}
```

### Fallback Behavior

If preferences cannot be applied (e.g., no words match the filters):
- System falls back to basic word selection
- Logs warning to console
- Game continues without preferences applied

---

## Testing

### Manual Testing Checklist

- [ ] Create new user - default preferences are created
- [ ] Update each preference field individually
- [ ] Update multiple fields simultaneously
- [ ] Verify validation errors for invalid values
- [ ] Test adaptive difficulty progression
- [ ] Test category filtering with various domains
- [ ] Test word length filtering
- [ ] Test obscure words toggle
- [ ] Verify preferences persist across sessions
- [ ] Test with no matching words (fallback)

### Example Test Scenarios

**Scenario 1: New User**
1. GET `/api/preferences/999` (non-existent user)
2. Should create default preferences
3. `defaultDifficulty` should be "adaptive"
4. `currentBand` should be 1

**Scenario 2: Adaptive Difficulty**
1. Set user to adaptive mode
2. Answer 10 words correctly
3. Check `adaptiveDifficultyData.currentBand`
4. Should increase if success rate ≥ 80%

**Scenario 3: Category Filtering**
1. Set `categoryPreferences` to ["noun.person"]
2. Start game
3. Verify all words are from noun.person domain

---

## Related Files

### Backend
- [userPreferencesService.ts](wordigo-backend/src/services/userPreferencesService.ts) - Service logic
- [userPreferencesController.ts](wordigo-backend/src/controllers/userPreferencesController.ts) - API handlers
- [wordSelectionService.ts](wordigo-backend/src/services/wordSelectionService.ts) - Word selection with filters
- [gameService.ts](wordigo-backend/src/services/gameService.ts) - Game integration
- [types/index.ts](wordigo-backend/src/types/index.ts) - TypeScript types
- [routes/index.ts](wordigo-backend/src/routes/index.ts) - API routes
- [schema.prisma](wordigo-backend/prisma/schema.prisma) - Database schema

### Database
- [add_user_preferences.sql](wordigo-backend/migrations/add_user_preferences.sql) - Migration script

---

## Next Steps

### Frontend Implementation
1. Create preferences UI component
2. Integrate with API endpoints
3. Add category selection interface
4. Display adaptive difficulty indicator
5. Store preferences in global state

### Future Enhancements
- [ ] Add difficulty presets (quick settings)
- [ ] Track category performance separately
- [ ] Add "favorite words" feature
- [ ] Implement word history (avoid repeats)
- [ ] Add custom difficulty ranges
- [ ] Export/import preferences
- [ ] Difficulty recommendations based on skill level
