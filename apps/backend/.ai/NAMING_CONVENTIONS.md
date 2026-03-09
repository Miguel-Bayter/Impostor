# Backend Naming Conventions

## 1) General Rules

- Use English for code identifiers.
- Use descriptive names over abbreviations.
- Keep naming consistent with existing NestJS patterns.

## 2) Case Style

- `camelCase`: variables, functions, methods, parameters.
- `PascalCase`: classes, interfaces, types, enums.
- `UPPER_SNAKE_CASE`: true constants and environment-like constants.

## 3) Backend File Naming (NestJS)

- `*.module.ts`: module declarations.
- `*.controller.ts`: HTTP transport layer.
- `*.service.ts`: business logic.
- `*.gateway.ts`: WebSocket transport layer.
- `*.guard.ts`: auth/authorization guards.
- `*.dto.ts`: validated request DTOs.
- `*.spec.ts`: unit/integration tests.
- `*.e2e-spec.ts`: end-to-end tests.

## 4) Class and Symbol Naming

- Modules: `AuthModule`, `RoomsModule`, `GameModule`.
- Controllers: `AuthController`.
- Services: `AuthService`.
- Gateways: `RoomsGateway`, `GameGateway`.
- Guards: `JwtAuthGuard`, `WsJwtGuard`.
- DTOs: `RegisterDto`, `JoinRoomDto`.

## 5) Variable and Method Naming

- Repository instances: `userRepository`, `roomRepository`.
- Service instances: `authService`, `gameService`.
- Methods should be verb-based: `createRoom`, `joinRoom`, `verifyToken`.
- Booleans should read as predicates: `isActive`, `isHost`, `hasPermission`.

## 6) API and Event Naming

- REST routes: lowercase, resource-oriented (`/api/auth/login`, `/api/auth/me`).
- Socket events: `domain:action` (`room:join`, `room:state`, `game:submitVote`).
- Keep payload field names stable and explicit (`roomId`, `playerId`, `votedPlayerId`).

## 7) Types and Contracts

- Prefer shared contracts from `@impostor/types` when payload crosses frontend/backend boundary.
- Keep backend-only internals in local `src/types/*`.
- Avoid duplicating type names for the same contract.

## 8) Env Variable Naming

- Use `UPPER_SNAKE_CASE` for all env keys.
- Use names aligned with current backend conventions (`JWT_SECRET`, `MONGODB_URI`, `ALLOWED_ORIGINS`).

## 9) Anti-Patterns

- Avoid `any`.
- Avoid ambiguous names like `data`, `temp`, `value1` in business logic.
- Avoid mixed styles for the same concept across modules.
