# Frontend Architecture (apps/frontend)

## 1) Overview

This frontend is a React + Vite SPA for a real-time multiplayer game.

Core characteristics:
- Framework: React (functional components + hooks)
- Bundler: Vite
- State: Context + reducer (`GameProvider` + `gameReducer`)
- Realtime: Socket.io client service abstraction
- HTTP: API service layer for REST endpoints
- UX feedback: `sonner` toasts

Entry points:
- Bootstrap: `apps/frontend/src/main.tsx`
- Root app flow: `apps/frontend/src/App.tsx`

## 2) UI State Architecture

Global state is centralized in `GameContext`:
- Provider: `context/GameProvider.tsx`
- Reducer: `reducers/gameReducer.ts`
- Hook: `hooks/useGame.ts`

State responsibilities include:
- authenticated user
- room data
- game state and phase transitions
- connection and loading status
- global errors

Guideline:
- Dispatch reducer actions for cross-app state.
- Keep transient local UI state inside component-level `useState`.

## 3) Realtime and API Layers

Socket layer:
- `services/socket.ts` and `services/SocketClient.ts`
- Hook integration: `hooks/useSocket.ts`
- `useSocket` registers event listeners and bridges events to reducer actions.

HTTP layer:
- `services/apiService.ts` and related API helpers
- Used for auth and room discovery/join checks where HTTP is still required.

Persistence layer:
- `services/StorageService.ts` for token/session local storage.

Logging and error normalization:
- `services/Logger.ts` (`toError`, structured logger)

## 4) Rendering Flow

`App.tsx` rendering decisions:
1. On mount, attempt reconnection using stored token.
2. If loading, show reconnect UI.
3. If no user, render `AuthScreen`.
4. If user but no room, render `RoomDiscovery`.
5. If in room, render by phase:
   - `waiting` -> `Lobby`
   - `roles` -> `RoleScreen`
   - `clues` -> `CluePhase`
   - `voting` -> `VotingPhase`
   - `results` / `victory` -> `ResultsScreen`

## 5) Directory Structure (Active)

Important folders in `apps/frontend/src`:
- `components/` UI and feature components
- `context/` context provider/state wiring
- `reducers/` reducer logic
- `hooks/` reusable hooks (`useGame`, `useSocket`)
- `services/` API, socket, storage, logger
- `types/` frontend-local types (progressively aligned to shared contracts)
- `test/` test setup
- `config/`, `data/`, `lib/` support modules

## 6) Shared Types and Contracts

Shared package:
- `@impostor/types` (`packages/types`)

Usage rule:
- Use `@impostor/types` for frontend/backend contract payloads.
- Keep local `src/types/*` for UI-only shapes or transitional adapters.
- Prefer adding shared contract updates in `packages/types` instead of duplicating.

## 7) Error Handling and UX Feedback

Guidelines:
- Convert unknown errors with `toError` before logging.
- Show user-facing feedback with `toast`.
- Keep technical details in logger, not in end-user messages.
- Respect linting rules around `console`; use `Logger` abstraction.

## 8) Import and Naming Conventions

Imports:
- Prefer `@` alias for source imports (`@/services/...`, `@/components/...`).
- Avoid deep relative chains where alias is available.

Naming:
- Components/files: PascalCase (e.g., `RoomDiscovery.tsx`).
- Hooks: `useXxx`.
- Variables/functions: camelCase.
- Keep action names and event names explicit and stable.

## 9) Testing Strategy

Framework:
- Vitest + jsdom
- Setup file: `src/test/setup.ts`

Typical commands:
- `pnpm --filter ./apps/frontend test`
- `pnpm --filter ./apps/frontend test -- src/components/rooms/RoomDiscovery.test.tsx`
- `pnpm --filter ./apps/frontend test -- -t "joins room"`

When changing behavior:
- Add/adjust tests near the touched component/hook/service.
- Prefer targeted tests first, then broader suite.

## 10) Extension Playbook

When adding a new frontend capability:
1. Define/update types (`@impostor/types` if contract-related).
2. Add service changes (API/socket) before UI wiring.
3. Add reducer actions and context integration if state is global.
4. Implement/adjust components.
5. Add toast/error handling.
6. Add targeted tests.
7. Run validate (or format:check/lint:check/types:check/test) for frontend package.
