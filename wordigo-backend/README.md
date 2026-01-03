# Wordigo Backend

Backend API for the Wordigo vocabulary quiz mobile app.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+ (for caching and sessions)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens
- Other configuration as needed

### 3. Setup PostgreSQL Database

Create a new PostgreSQL database:

```bash
createdb wordigo
```

Or using psql:

```sql
CREATE DATABASE wordigo;
```

### 4. Import WordNet Data

Ensure the `wordnet_3_1.sql` file is in the parent directory (wordigo root), then run:

```bash
# Push Prisma schema to database (creates tables)
npm run db:push

# Import WordNet data from SQL dump
npm run import:wordnet
```

This will import:
- 147,478 words
- ~206,941 senses
- ~117,659 synsets
- 45 lexdomains
- Casedwords (proper nouns)
- Pre-computed difficulty metrics

The import may take 10-15 minutes depending on your system.

### 5. Verify Database

Check that the data was imported correctly:

```bash
npm run db:studio
```

This opens Prisma Studio where you can browse the database.

### 6. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run import:wordnet` - Import WordNet SQL dump
- `npm run compute:difficulty` - Compute difficulty metrics (if not pre-computed)
- `npm run seed:cache` - Generate SQLite cache file for mobile app

## Project Structure

```
src/
├── config/          # Database, Redis, Socket.io configuration
├── services/        # Business logic (word selection, game logic)
├── controllers/     # Route handlers
├── middleware/      # Auth, validation, rate limiting
├── routes/          # API routes
├── sockets/         # WebSocket handlers for multiplayer
├── types/           # TypeScript type definitions
└── index.ts         # Entry point

prisma/
├── schema.prisma    # Database schema
└── migrations/      # Database migrations

scripts/
├── importWordNet.ts    # SQL import script
├── computeDifficulty.ts # Difficulty calculation
└── seedCache.ts        # SQLite cache generator
```

## API Endpoints

### Game
- `GET /api/word` - Get random word with definitions
- `POST /api/game/answer` - Submit answer and get validation

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh access token

### History
- `GET /api/history` - Get user's game history
- `GET /api/stats/summary` - Get user statistics

### Challenges
- `GET /api/challenges/daily` - Get today's daily challenge

### Multiplayer
- `POST /api/multiplayer/match` - Start matchmaking
- `GET /api/leaderboard` - Get rankings

## Database Schema

Main tables:
- `words` - Word lemmas (147k+ entries)
- `senses` - Word meanings linked to synsets
- `synsets` - Synonym sets with definitions
- `lexdomains` - Semantic categories (45 domains)
- `wordigo_difficulty` - Pre-computed readability metrics
- `wordigo_history` - Game play records
- `users` - User accounts
- `daily_challenges` - Curated daily word sets
- `multiplayer_matches` - Head-to-head game sessions

## Development

### Adding New Routes

1. Create controller in `src/controllers/`
2. Add route in `src/routes/`
3. Update types in `src/types/`

### Database Changes

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Update services/controllers as needed

## Troubleshooting

### Import fails with "out of memory"
The import script processes in batches. If you still hit memory limits, reduce BATCH_SIZE in `importWordNet.ts`.

### Redis connection error
Ensure Redis is running: `redis-cli ping` should return `PONG`

### Database connection error
Verify PostgreSQL is running and DATABASE_URL is correct in `.env`

## License

MIT
