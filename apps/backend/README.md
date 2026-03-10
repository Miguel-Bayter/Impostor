# Impostor Backend

Backend for the multiplayer Impostor-style game. REST API + Socket.IO built with NestJS, TypeScript, and MongoDB/Redis. Shares contracts with `@impostor/types`.

## Requirements

- Node.js >= 20
- pnpm >= 10
- MongoDB and Redis (can be started with Docker from the repo root)

## Local Setup

From the monorepo root:

```bash
pnpm install
pnpm dc:up
```

Create the environment file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Start the backend:

```bash
pnpm --filter ./apps/backend dev
```

Local server:

- http://localhost:3001

## Environment Variables (minimum)

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/impostor
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:5173
```

## Production (backend on GCP or Azure)

### Option A: GCP Cloud Run

1. Build and publish a backend image.
2. Create a Cloud Run service listening on port 3001.
3. Define backend environment variables.

Suggested variables:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=replace_me
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/impostor
REDIS_URL=rediss://<host>:<port>
ALLOWED_ORIGINS=https://<your-frontend>.pages.dev
```

Notes:

- Use MongoDB Atlas or a managed MongoDB.
- Use managed Redis (Redis Cloud or similar).
- Configure CORS for the real frontend domain.

### Option B: Azure App Service

1. Deploy the backend to App Service (Linux).
2. Configure environment variables in Application Settings.
3. Ensure the exposed port is 3001.

Suggested variables (same as GCP):

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=replace_me
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/impostor
REDIS_URL=rediss://<host>:<port>
ALLOWED_ORIGINS=https://<your-frontend>.pages.dev
```

## Useful Commands

```bash
pnpm --filter ./apps/backend dev
pnpm --filter ./apps/backend build
pnpm --filter ./apps/backend test
pnpm --filter ./apps/backend types:check
pnpm --filter ./apps/backend validate
```

## Tooling

ESLint, Prettier, lint-staged, and Husky are centralized at the repository root. App scripts call root binaries via `pnpm -w exec`.
