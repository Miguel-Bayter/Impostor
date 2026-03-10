# AGENTS.md

Root router for agent context in this monorepo.

## Active Projects
- Backend: `apps/backend`
- Frontend: `apps/frontend`

## Local Agent Context (Source of Truth)
- Backend: `apps/backend/.ai/AGENTS.md`
- Frontend: `apps/frontend/.ai/AGENTS.md`

## Precedence
1. If changing `apps/backend/**`, follow `apps/backend/.ai/AGENTS.md`.
2. If changing `apps/frontend/**`, follow `apps/frontend/.ai/AGENTS.md`.
3. Use this root file only as a directory-level pointer.

## Local Infra (Dev)
- Docker Compose is used only for MongoDB and Redis.
- Use root scripts: `pnpm dc:up`, `pnpm dc:down`, `pnpm dc:logs`, `pnpm dc:ps`, `pnpm dc:restart`.
