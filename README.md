# Wordigo - Vocabulary Quiz Web App

A vocabulary quiz game featuring word-definition matching gameplay powered by WordNet 3.1.

## Project Structure

This repository contains:

- **wordigo-backend/** - Node.js/Express backend API with PostgreSQL
- **wordigo-web/** - Next.js web application

## Features

### Core Gameplay
- Random word selection from 147,478 words
- Multiple-choice definition matching
- Difficulty-based timer (25-75 seconds)
- Strike system (3 strikes = game over)

### User Features
- User accounts with authentication
- Game history tracking
- Statistics and analytics
- Three difficulty levels
- Daily challenges with streaks

### Multiplayer
- Head-to-head competition
- Real-time matchmaking
- Global and friend leaderboards
- Live game state synchronization

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend Setup

```bash
cd wordigo-backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:push
npm run import:wordnet
npm run dev
```

### Web App Setup

```bash
cd wordigo-web
npm install
npm run dev
```

See individual README files in each directory for detailed setup instructions.

## Development Phases

### ✅ Phase 1: Setup & Database (Current)
- [x] Project structure created
- [x] Backend boilerplate (Express + Prisma)
- [x] Frontend boilerplate (Next.js web app)
- [x] Prisma schema for WordNet database
- [x] Database import script
- [ ] Core word selection API
- [ ] Basic quiz UI

### Phase 2: MVP - Core Quiz
- [ ] Word selection algorithm
- [ ] Wrong definition matching logic
- [ ] Timer component
- [ ] Strike counter
- [ ] Game flow implementation

### Phase 3: User Accounts & History
- [ ] Authentication (JWT)
- [ ] User registration/login
- [ ] Game history storage
- [ ] Statistics dashboard

### Phase 4: Difficulty & Challenges
- [ ] Readability scoring
- [ ] Difficulty level filtering
- [ ] Daily challenge generator
- [ ] Streak tracking
- [ ] Notifications

### Phase 5: Multiplayer
- [ ] Socket.io integration
- [ ] Matchmaking system
- [ ] Real-time game rooms
- [ ] Leaderboards
- [ ] Friend challenges

## Tech Stack

**Backend:**
- Express.js (Node.js framework)
- PostgreSQL (database)
- Prisma (ORM)
- Redis (caching)
- Socket.io (real-time)
- JWT (authentication)

**Frontend:**
- Next.js (React framework)
- TypeScript
- Tailwind CSS (styling)
- Zustand (state management)

## Database

The app uses WordNet 3.1, a lexical database containing:
- 147,478 unique words
- ~206,941 senses (word meanings)
- ~117,659 synsets (synonym groups)
- 45 lexical domains (semantic categories)


## License

MIT

## Credits

- WordNet 3.1 lexical database from Princeton University
- Original Wordigo web app concept
