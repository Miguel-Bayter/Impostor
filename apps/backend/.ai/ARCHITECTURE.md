# Backend Architecture (apps/backend)

## 1) Overview

This backend is a NestJS application focused on real-time multiplayer gameplay.

Core characteristics:

- Framework: NestJS (modular architecture)
- Transport: HTTP (`/api/*`) + Socket.io gateways
- Persistence: MongoDB (Mongoose schemas + repositories)
- Fast state/cache: Redis service module
- Validation: global `ValidationPipe` + DTOs
- Security: JWT guards for HTTP and WebSocket

Entry points:

- App bootstrap: `apps/backend/src/main.ts`
- Root module: `apps/backend/src/app.module.ts`

## 2) Runtime Flow

Server startup sequence:

1. Create Nest app from `AppModule`.
2. Enable global validation (`whitelist`, `forbidNonWhitelisted`, `transform`).
3. Read environment config (`ConfigService`).
4. Enable CORS using `ALLOWED_ORIGINS`.
5. Set global API prefix to `/api`.
6. Start listening on `PORT` (default `3001`).

## 3) Module Boundaries

Application modules under `apps/backend/src/modules`:

- `auth`: registration, login, token verification, JWT strategy, auth gateway/controller.
- `rooms`: room lifecycle, join/leave/list/get logic, room gateway.
- `game`: game phases, clues, voting, winner resolution, game gateway.
- `redis`: Redis integration and caching/rate-related infra support.

Cross-cutting layers:

- `common/guards`: HTTP + WS auth guards.
- `common/utils`: sanitization and game helper utilities.
- `database/`: schemas and repositories.
- `config/`: environment schema validation.
- `types/`: backend-local type definitions (incrementally aligned with `@impostor/types`).

## 4) Data Access Pattern

Repository-first data access:

- `database/repositories/*` isolate persistence details from service logic.
- `database/schemas/*` define Mongo document shapes.
- Services should not bypass repositories unless strictly necessary.

Guideline:

- Business logic in `*.service.ts`.
- Persistence operations in repositories.
- Transport adaptation in controllers/gateways.

## 5) API + WebSocket Contract

HTTP:

- Global prefix: `/api`.
- Auth endpoints live in `AuthController` (`/api/auth/*`).
- Use DTOs + guard(s) + explicit return types.

WebSocket:

- Auth namespace and gameplay events are handled in gateways.
- Use `WsJwtGuard` for protected game/room events.
- Emit typed payloads and keep event names consistent with frontend socket layer.

Shared contracts:

- Prefer `@impostor/types` for shared payload definitions.
- Keep backend-specific internal types local when not part of client contract.

## 6) Error Handling Rules

Backend must fail explicitly and predictably:

- Throw Nest exceptions in services/controllers (`UnauthorizedException`, `ConflictException`, etc.).
- Do not swallow errors unless intentionally returning a safe fallback.
- Validate/sanitize external input before persistence or game transitions.
- Keep error messages actionable but avoid leaking internals.

## 7) Configuration and Environment

Primary env file:

- `apps/backend/.env.example`

Key variables:

- `PORT`, `NODE_ENV`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `MONGODB_URI`, `REDIS_URL`
- `ALLOWED_ORIGINS`
- throttling/game tuning values

Important:

- Do not use root-level env examples for active apps.

## 8) Testing Strategy

Test frameworks:

- Unit/integration: Jest (`src/**/*.spec.ts`)
- E2E: Jest with `test/jest-e2e.json`

Typical commands:

- `pnpm --filter ./apps/backend test`
- `pnpm --filter ./apps/backend test -- src/modules/auth/auth.service.spec.ts`
- `pnpm --filter ./apps/backend test:e2e -- test/app.e2e-spec.ts`

When changing logic:

- Add or update nearby tests.
- Prioritize targeted tests before full suite.

## 9) Implementation Conventions

Naming:

- Nest files: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.gateway.ts`, `*.guard.ts`, `*.dto.ts`.

Typing:

- Avoid `any`.
- Prefer explicit function return types.
- Use `unknown` + narrowing when input is untrusted.

Async:

- No floating promises.
- Await all async operations unless intentionally fire-and-forget with explicit handling.

## 10) Extension Playbook

When adding a new backend capability:

1. Add/extend DTOs for transport input.
2. Implement business logic in a service.
3. Reuse repositories for persistence.
4. Expose through controller and/or gateway.
5. Add guards/validation as needed.
6. Add targeted tests.
7. If payload is shared with frontend, update `packages/types`.
