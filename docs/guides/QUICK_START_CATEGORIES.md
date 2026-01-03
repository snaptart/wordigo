# Two-Tier Category System - Quick Start

## Installation (5 minutes)

```bash
# 1. Navigate to backend
cd wordigo-backend

# 2. Update database schema
npx prisma db push

# 3. Seed category data
npx ts-node seed-category-groups.ts

# 4. Regenerate Prisma client
npx prisma generate

# 5. Test the system
npx ts-node test-category-system.ts

# 6. Start backend
npm run dev
```

---

## API Quick Reference

### Get Categories (Simple Mode)
```bash
GET /api/categories?mode=simple&counts=true
```

### Get Categories (Advanced Mode)
```bash
GET /api/categories?mode=advanced
```

### Get Specific Group
```bash
GET /api/categories/groups/people_society
```

### Expand Group Keys
```bash
POST /api/categories/expand
Content-Type: application/json

{
  "groupKeys": ["people_society", "nature_living"]
}
```

---

## The 15 Categories

| Icon | Name | Lexdomains |
|------|------|------------|
| 👥 | People & Society | 3 |
| 🌿 | Nature & Living Things | 3 |
| 🔧 | Objects & Things | 2 |
| ⚡ | Actions & Events | 3 |
| 💬 | Communication & Expression | 2 |
| 🏃 | Movement & Physical Action | 4 |
| 🧠 | Thinking & Knowledge | 3 |
| 🧪 | Materials & Substances | 2 |
| ❤️ | Body & Health | 1 |
| 📍 | Places & Locations | 1 |
| ✨ | Qualities & Attributes | 2 |
| 🔄 | States & Conditions | 1 |
| ⏰ | Time & Quantity | 2 |
| 🎨 | Creation, Ownership & Possession | 5 |
| 📝 | Descriptive Words | 3 |

**Total**: 15 groups → 45 lexdomains (covers 98.2% of words)

---

## Code Examples

### Fetch Simple Mode Categories
```typescript
const response = await fetch('/api/categories?mode=simple&counts=true');
const { data } = await response.json();

// Display categories
data.categories.forEach(cat => {
  console.log(`${cat.icon} ${cat.displayName} (${cat.senseCount} words)`);
});
```

### User Selects Categories
```typescript
// User selections
const selected = ['people_society', 'actions_events'];

// Expand to lexdomains
const expandResponse = await fetch('/api/categories/expand', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ groupKeys: selected })
});

const { data } = await expandResponse.json();
// data.lexdomainNames = ['noun.person', 'noun.group', ...]

// Save to preferences
updatePreferences({
  categoryPreferences: data.lexdomainNames,
  categoryMode: 'simple'
});
```

### Backend: Filter Words by Category
```typescript
import categoryGroupService from './services/categoryGroupService';

// Normalize user preferences
const lexdomains = await categoryGroupService.normalizeCategoryPreferences(
  user.categoryPreferences,
  user.categoryMode
);

// Use in word selection
const words = await selectWords({
  categoryPreferences: lexdomains
});
```

---

## Files Overview

| File | Purpose |
|------|---------|
| `migrations/add_category_groups.sql` | SQL migration |
| `seed-category-groups.ts` | Seed data script |
| `src/services/categoryGroupService.ts` | Business logic |
| `src/controllers/categoryController.ts` | API handlers |
| `src/routes/index.ts` | API routes |
| `src/types/index.ts` | TypeScript types |
| `test-category-system.ts` | Test suite |

---

## Testing Checklist

- [ ] Migration creates tables successfully
- [ ] Seed script populates 15 groups
- [ ] Seed script creates 45 mappings
- [ ] API returns Simple Mode categories
- [ ] API returns Advanced Mode categories
- [ ] Group expansion works correctly
- [ ] All tests pass

---

## Troubleshooting

**Problem**: Migration fails
```bash
# Check Prisma connection
npx prisma db pull
```

**Problem**: No categories returned
```bash
# Re-run seed
npx ts-node seed-category-groups.ts
```

**Problem**: TypeScript errors
```bash
# Regenerate client
npx prisma generate
```

---

## Next: Frontend Integration

1. Add mode toggle: Simple ↔ Advanced
2. Fetch categories: `/api/categories?mode=${mode}`
3. Display with icons (Simple) or list (Advanced)
4. Save: `{ categoryPreferences, categoryMode }`
5. Use normalized preferences for filtering

---

## Documentation

- **Full Guide**: `CATEGORY_TWO_TIER_IMPLEMENTATION.md`
- **Recommendations**: `CATEGORY_CONSOLIDATION_RECOMMENDATIONS.md`
- **Summary**: `CATEGORY_SUMMARY.md`
- **This Guide**: `QUICK_START_CATEGORIES.md`

