# Frontend Naming Conventions

## 1) General Rules

- Use English for code identifiers.
- Keep UI labels/messages in the product language as needed.
- Prefer descriptive names that indicate intent.

## 2) Case Style

- `camelCase`: variables, functions, hooks internals, reducer state fields.
- `PascalCase`: React components, interfaces, types, enums.
- `UPPER_SNAKE_CASE`: reducer action constants and true constants.

## 3) Frontend File Naming (React)

- Components: `PascalCase.tsx` (`RoomDiscovery.tsx`, `RoleScreen.tsx`).
- Hooks: `useXxx.ts` (`useSocket.ts`, `useGame.ts`).
- Services: explicit role naming (`SocketClient.ts`, `StorageService.ts`, `apiService.ts`).
- Reducers: `xxxReducer.ts` (`gameReducer.ts`).
- Context: `XxxContext.ts` and `XxxProvider.tsx`.
- Tests: `*.test.ts` / `*.test.tsx`.

## 4) Component and Hook Naming

- Components must be `PascalCase` and match filename/export.
- Hooks must start with `use` and describe behavior (`useSocket`, `useGame`).
- Props interfaces should use `ComponentNameProps`.

## 5) State and Action Naming

- Reducer actions use explicit uppercase names (`SET_USER`, `SET_ROOM`, `RESET_GAME`).
- State booleans must use predicate prefixes (`isLoading`, `isConnected`, `hasError`).
- Keep event/state keys consistent with backend contracts.

## 6) Import Naming

- Prefer alias imports with `@/` for source code.
- Avoid deep relative import chains when alias exists.
- Keep import groups consistent: framework/libs first, local modules second.

## 7) Socket and API Naming

- Socket events should follow backend contract naming (`room:join`, `game:state`).
- Use explicit payload names (`roomId`, `playerName`, `voterId`).
- Avoid renamed aliases for well-known payload fields unless necessary.

## 8) Shared Types and Contracts

- Use `@impostor/types` for cross-app contracts.
- Keep `src/types/*` for UI-only/transitional shapes.
- Do not duplicate contract names already defined in shared package.

## 9) Env Variable Naming

- Frontend env variables must use `VITE_` prefix (`VITE_SERVER_URL`).
- Keep env keys in `UPPER_SNAKE_CASE`.

## 10) Anti-Patterns

- Avoid generic names (`obj`, `item`, `tmp`) when domain names are available.
- Avoid naming drift between component file, export, and usage.
- Avoid mixed naming styles for similar actions/events.
