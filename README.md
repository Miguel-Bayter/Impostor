# Impostor Monorepo

Multiplayer Impostor-style game, organized as a monorepo with TypeScript frontend and backend.

## Tech Stack

- Monorepo: pnpm workspaces
- Frontend: React 19, Vite, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript, Socket.IO
- Database: MongoDB
- Cache/queue (optional): Redis
- Shared types: `@impostor/types` (workspace package)

## Project Structure

```txt
apps/
  backend/      # REST API + WebSocket gateway (NestJS)
  frontend/     # Web client (React + Vite)
packages/
  types/        # Shared FE/BE type contracts
```

## Prerequisites

Install before running:

1. Node.js >= 20
2. pnpm >= 10
3. MongoDB running (local or remote)
4. Redis available (if your backend config requires it)

Verify versions:

```bash
node -v
pnpm -v
```

## Installation

From the repository root:

```bash
pnpm install
```

## Local Dependencies with Docker (Mongo + Redis)

If you do not want to install MongoDB and Redis locally, you can start them with Docker:

```bash
docker compose up -d
```

Or using the monorepo scripts:

```bash
pnpm dc:up
```

To stop them:

```bash
docker compose down
```

Or using the monorepo scripts:

```bash
pnpm dc:down
```

Logs and status:

```bash
pnpm dc:logs
pnpm dc:ps
```

## Environment Configuration

### Backend

File: `apps/backend/.env`
Use `apps/backend/.env.example` as a base.

Minimum recommended variables:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/impostor
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend

File: `apps/frontend/.env`
Use `apps/frontend/.env.example` as a base.

```env
VITE_SERVER_URL=http://localhost:3001
```

## Development Run

From the repository root (runs backend + frontend in parallel):

```bash
pnpm dev
```

Expected services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Useful Scripts (Root)

```bash
pnpm dev          # Run backend and frontend in parallel
pnpm build        # Build backend and frontend
pnpm validate     # Run format:check + lint:check + types:check in parallel per app
pnpm lint:check   # Lint in check mode
pnpm lint:fix     # Lint with auto-fix
pnpm test         # Backend and frontend tests
pnpm types:check  # TypeScript check for both apps
pnpm format:check # Format check
pnpm format:fix   # Format code
pnpm dc:up        # Start MongoDB + Redis (Docker)
pnpm dc:down      # Stop MongoDB + Redis (Docker)
pnpm dc:logs      # Docker Compose logs
pnpm dc:ps        # Docker services status
pnpm dc:restart   # Restart Docker services
```

## Tooling

ESLint, Prettier, lint-staged, and Husky are centralized at the repository root. App scripts call root binaries via `pnpm -w exec`.

## App Scripts

### Backend

```bash
pnpm --filter ./apps/backend dev
pnpm --filter ./apps/backend build
pnpm --filter ./apps/backend test
pnpm --filter ./apps/backend types:check
pnpm --filter ./apps/backend validate
pnpm --filter ./apps/backend lint:check
pnpm --filter ./apps/backend lint:fix
pnpm --filter ./apps/backend format:check
pnpm --filter ./apps/backend format:fix
```

### Frontend

```bash
pnpm --filter ./apps/frontend dev
pnpm --filter ./apps/frontend build
pnpm --filter ./apps/frontend test
pnpm --filter ./apps/frontend types:check
pnpm --filter ./apps/frontend validate
pnpm --filter ./apps/frontend lint:check
pnpm --filter ./apps/frontend lint:fix
pnpm --filter ./apps/frontend format:check
pnpm --filter ./apps/frontend format:fix
```

## Shared Contracts

The `@impostor/types` package defines shared contracts for frontend and backend.

Current conventions:

- User identifier: `userId`
- Game result: `winner` (singular)

## Quick Troubleshooting

- If the frontend does not connect to the backend:
  - check `VITE_SERVER_URL` in `apps/frontend/.env`
  - validate `ALLOWED_ORIGINS` in `apps/backend/.env`
- If DB connection fails:
  - verify `MONGODB_URI`
- If the backend fails to start due to config:
  - validate `JWT_SECRET`, `PORT`, and required `.env` variables
