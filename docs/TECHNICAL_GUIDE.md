# Technical Guide

Consolidated technical guide for the Impostor monorepo project.

## Architecture

- `apps/backend`: REST API + WebSocket gateway (NestJS + Socket.IO).
- `apps/frontend`: web client (React + Vite + TypeScript).
- `packages/types`: shared contracts (`@impostor/types`).

Current contract conventions:

- Canonical user identifier: `userId`.
- Canonical game result: `winner` (singular).

## Requirements

- Node.js >= 20
- pnpm >= 10
- MongoDB (local or remote)
- Redis (depending on backend configuration)

Quick check:

```bash
node -v
pnpm -v
```

## Environment Configuration

### Backend (`apps/backend/.env`)

Based on `apps/backend/.env.example`.

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/impostor
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (`apps/frontend/.env`)

Based on `apps/frontend/.env.example`.

```env
VITE_SERVER_URL=http://localhost:3001
```

## Running the Application

From the repository root:

```bash
pnpm install
pnpm dev
```

Expected services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Standard Scripts

### Root

```bash
pnpm dev
pnpm build
pnpm validate
pnpm format:check
pnpm format:fix
pnpm lint:check
pnpm lint:fix
pnpm types:check
pnpm test
```

### Backend

```bash
pnpm --filter ./apps/backend dev
pnpm --filter ./apps/backend build
pnpm --filter ./apps/backend validate
pnpm --filter ./apps/backend format:check
pnpm --filter ./apps/backend format:fix
pnpm --filter ./apps/backend lint:check
pnpm --filter ./apps/backend lint:fix
pnpm --filter ./apps/backend types:check
pnpm --filter ./apps/backend test
```

### Frontend

```bash
pnpm --filter ./apps/frontend dev
pnpm --filter ./apps/frontend build
pnpm --filter ./apps/frontend validate
pnpm --filter ./apps/frontend format:check
pnpm --filter ./apps/frontend format:fix
pnpm --filter ./apps/frontend lint:check
pnpm --filter ./apps/frontend lint:fix
pnpm --filter ./apps/frontend types:check
pnpm --filter ./apps/frontend test
```

## Recommended Validation Before Integrating Changes

```bash
pnpm validate
pnpm build
pnpm test
```

## Quick Troubleshooting

- Frontend cannot connect to backend:
  - check `VITE_SERVER_URL` in `apps/frontend/.env`
  - validate `ALLOWED_ORIGINS` in `apps/backend/.env`
- Database connection fails:
  - validate `MONGODB_URI`
- Backend fails to start due to configuration:
  - validate `JWT_SECRET`, `PORT`, `REDIS_URL`, and required variables
