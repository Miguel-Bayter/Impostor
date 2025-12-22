# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Impostor** is a multiplayer social deduction game where players must identify the impostor among them. This repository contains three projects:

- `backend/` - Node.js server with Express and Socket.io (completed)
- `frontend/` - Original vanilla JavaScript frontend (legacy)
- `frontend-new/` - **Active migration to React + TypeScript + Vite** (in progress)

**Current Focus**: Migrating from vanilla JS to a modern React stack with TypeScript, Tailwind CSS, and shadcn/ui components.

## Development Commands

### Backend (Port 3001)
```bash
cd backend
npm install
npm run dev      # Start with nodemon (hot reload)
npm start        # Production start
npm test         # Run tests with Vitest
npm run lint     # ESLint
```

### Frontend (Legacy - Not Active)
```bash
cd frontend
npm install
npm run dev      # http-server on port 5500
```

### Frontend-new (Active Migration)
```bash
cd frontend-new
npm install
npm run dev      # Vite dev server
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Migration Status

Refer to `MIGRATION_PLAN.md` for detailed migration phases. Current status:

- ✅ Phase 1-3: Project setup, types, components (completed)
- 🔄 Phase 4: Business logic and lifecycle (in progress)
  - Needs: Automatic reconnection with stored tokens
  - Needs: State sync between server and client
  - Needs: Phase transitions (Roles → Clues → Voting → Results)
- ⏳ Phase 5: Premium UI refinement (pending)

**Note**: When working on the frontend, ALWAYS work in `frontend-new/`, not `frontend/`.

## Architecture

### Backend Architecture
- **Express.js** server with Socket.io for real-time communication
- **MongoDB** (Mongoose) for user/room persistence
- **Redis** for session management and caching
- **JWT** authentication with bcrypt password hashing
- **Rate limiting** and CORS protection

**Key Backend Files**:
- `backend/server.js` - Main entry point
- `backend/controllers/` - Business logic
- `backend/models/` - Mongoose schemas
- `backend/utils/` - Game logic and helpers

### Frontend-new Architecture (React + TypeScript)

**State Management**:
- Central state managed via `useReducer` + Context API
- `GameContext` (src/context/GameContext.ts) provides global game state
- `gameReducer` (src/reducers/gameReducer.ts) handles state updates

**Socket Communication**:
- `SocketService` singleton (src/services/socket.ts) wraps Socket.io client
- `useSocket` hook (src/hooks/useSocket.ts) connects components to socket events
- Real-time events: room updates, phase changes, player actions, votes

**Component Structure**:
```
src/
├── components/
│   ├── auth/          # Login, Register
│   ├── game/          # Lobby, RoleScreen, CluePhase, VotingPhase, ResultsScreen
│   ├── layout/        # Header, MainLayout
│   └── rooms/         # CreateRoomModal, JoinRoomByCode, RoomDiscovery
├── context/           # GameContext, GameProvider
├── hooks/             # useGame, useSocket
├── reducers/          # gameReducer (state actions)
├── services/          # socket.ts (WebSocket client)
├── types/             # TypeScript interfaces (Player, Room, GameState, etc.)
└── data/              # words.ts (game word list)
```

**TypeScript Types** (src/types/game.ts):
- `Phase`: Game phases (waiting, roles, clues, voting, results, victory)
- `Player`: Player info with role, status, score
- `Room`: Room metadata, players list, settings
- `GameState`: Current game state with phase, clues, votes
- `User`: Authenticated user data

**Path Alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig)

### Game Flow
1. **Auth**: User logs in/registers → receives JWT token
2. **Room Selection**: Create room, join by code, or discover public rooms
3. **Lobby**: Players gather, host starts game when ready
4. **Roles Phase**: Each player sees their role (Citizen or Impostor)
5. **Clues Phase**: Players submit one-word clues related to the secret word
6. **Voting Phase**: Players vote to eliminate suspected impostor
7. **Results**: Show voting results and reveal impostor (or continue rounds)
8. **Victory**: Game ends when impostor is eliminated or citizens are outnumbered

## Environment Configuration

### Backend (.env)
Required variables (see `backend/.env.example`):
```
PORT=3001
JWT_SECRET=your_secret_here
MONGODB_URI=mongodb://localhost:27017/impostor
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Note**: Backend runs on port 3001 (not 3000 as mentioned in older docs)

### Frontend-new (.env)
```
VITE_SERVER_URL=http://localhost:3000
```

**Port Mismatch**: Update `VITE_SERVER_URL` to `http://localhost:3001` if backend is on 3001.

## Key Integration Points

### Socket.io Events (Backend → Frontend)
- `connect` / `disconnect` - Connection status
- `loginSuccess` / `registerSuccess` - Auth responses
- `roomCreated` / `roomJoined` - Room lifecycle
- `playerJoined` / `playerLeft` - Player updates
- `gameStarted` / `phaseChanged` - Game state changes
- `clueSubmitted` / `voteSubmitted` - Action confirmations
- `gameOver` - End game with results

### Socket.io Events (Frontend → Backend)
- `login` / `register` - Authentication
- `createRoom` / `joinRoom` / `listRooms` - Room management
- `startGame` / `submitClue` / `submitVote` - Game actions
- `disconnect` - Cleanup

## Styling

**Current Stack**: Tailwind CSS 4.x with `@tailwindcss/vite` plugin

**Design Approach**: Clean, minimalist interface with solid colors
- No animations library (Framer Motion removed)
- Solid color backgrounds instead of gradients
- Simple CSS transitions (150ms duration)
- Clean borders instead of glassmorphism effects
- shadcn/ui components (installed in `src/components/ui/`)
- Lucide React icons (installed)

**Color Palette** (Minimalist - Solid Colors):
```css
--color-primary: #5b7fff      /* Soft blue - main accent */
--color-success: #22c55e      /* Green - success states */
--color-warning: #f59e0b      /* Amber - warnings */
--color-danger: #ef4444       /* Red - errors/impostor */
--color-bg-primary: #0f172a   /* Dark navy - main background */
--color-bg-card: #1a1f2e      /* Card background */
--color-bg-input: #2a3142     /* Input background */
--color-border: #2a3142       /* Default border */
--color-border-hover: #3a4152 /* Hover border */
```

**Design Principles**:
- Instant interactions (no entrance animations)
- Solid colors with opacity variants (e.g., `bg-primary/20`)
- Consistent border-radius: `rounded-2xl` (buttons/inputs), `rounded-3xl` (cards)
- Simple hover states: `hover:bg-primary/90`
- All transitions use `transition-colors duration-150`

## Testing

- **Backend**: Vitest test suite (`npm test` in backend/)
- **Frontend-new**: Vitest + React Testing Library configured (vitest.config.ts)
  - Run tests: `npm test` (when tests are written)
  - Test setup: src/test/setup.ts

## Common Pitfalls

1. **Port Confusion**: Backend uses port 3001, but some configs reference 3000
2. **Auth Flow**: Frontend currently uses fetch for login/register (socket.ts:44-61), should migrate to Socket.io events
3. **Type Safety**: Always define socket event payloads with TypeScript interfaces
4. **State Updates**: Use gameReducer actions, never mutate state directly
5. **Socket Lifecycle**: Ensure socket disconnects on unmount to prevent memory leaks

## Dependencies

### Frontend-new Key Libraries
- `react` 19.x - UI framework
- `socket.io-client` 4.x - WebSocket client
- `tailwindcss` 4.x - Styling (minimalist approach)
- `lucide-react` - Icons
- `@radix-ui/*` - Headless UI primitives (via shadcn/ui)
- `vitest` + `@testing-library/react` - Testing

### Backend Key Libraries
- `express` - HTTP server
- `socket.io` - WebSocket server
- `mongoose` - MongoDB ORM
- `ioredis` / `redis` - Session store
- `jsonwebtoken` + `bcrypt` - Auth
- `express-rate-limit` - Rate limiting
- `validator` - Input validation

## Git Workflow

Current branch: `master` (main development branch)

Recent work focuses on Phase 4-5 of migration (game logic and UI refinement).

When committing migration work, reference the phase in commit messages for traceability.
