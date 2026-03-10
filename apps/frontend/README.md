# Impostor Frontend

Web frontend for the multiplayer Impostor-style game. React 19 + Vite + TypeScript. Consumes the backend REST API and Socket.IO.

## Requirements

- Node.js >= 20
- pnpm >= 10
- Backend available (local or cloud)

## Local Setup

From the monorepo root:

```bash
pnpm install
```

Create the environment file:

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Set `VITE_SERVER_URL` in `apps/frontend/.env`:

```env
VITE_SERVER_URL=http://localhost:3001
```

Start the frontend:

```bash
pnpm --filter ./apps/frontend dev
```

Local server:
- http://localhost:5173

## Production (Cloudflare Pages)

1. Ensure the backend is publicly available (GCP/Azure) and CORS is correct.
2. Build the frontend:

```bash
pnpm --filter ./apps/frontend build
```

3. Deploy to Cloudflare Pages.
4. Set the build environment variable:

```env
VITE_SERVER_URL=https://<your-backend-domain>
```

Notes:
- In Vite, `VITE_*` variables are injected at build time.
- If you change `VITE_SERVER_URL`, you need a new build.

## Useful Commands

```bash
pnpm --filter ./apps/frontend dev
pnpm --filter ./apps/frontend build
pnpm --filter ./apps/frontend test
pnpm --filter ./apps/frontend types:check
pnpm --filter ./apps/frontend validate
```

## Tooling

ESLint, Prettier, lint-staged, and Husky are centralized at the repository root. App scripts call root binaries via `pnpm -w exec`.
