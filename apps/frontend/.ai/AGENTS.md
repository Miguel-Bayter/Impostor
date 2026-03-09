# AGENTS.md

Guidance for coding agents working in `apps/frontend`.

## 1) Purpose

- Implement and maintain frontend features for the multiplayer game UI.
- Preserve frontend architecture flow, state model, and transport contracts.

## 2) Scope

- Primary scope: `apps/frontend/**`.
- Shared contract scope when needed: `packages/types/**`.
- Out of scope unless explicitly requested: unrelated backend changes.

## 3) Primary References

- Architecture source of truth:
  - `./ARCHITECTURE.md`
- Naming rules source of truth:
  - `./NAMING_CONVENTIONS.md`
- Monorepo-wide guidance:
  - `../../AGENTS.md`

Always follow local `.ai` documents first for frontend-specific decisions.

## 4) Frontend Commands

Run from repository root.

- Dev:
  - `pnpm --filter ./apps/frontend dev`
- Build:
  - `pnpm --filter ./apps/frontend build`
- Type-check:
  - `pnpm --filter ./apps/frontend types:check`
- Validate:
  - `pnpm --filter ./apps/frontend validate`
- Lint check:
  - `pnpm --filter ./apps/frontend lint:check`
- Lint fix:
  - `pnpm --filter ./apps/frontend lint:fix`
- Format check:
  - `pnpm --filter ./apps/frontend format:check`
- Format fix:
  - `pnpm --filter ./apps/frontend format:fix`
- Tests:
  - `pnpm --filter ./apps/frontend test`

Single test examples:
- `pnpm --filter ./apps/frontend test -- src/components/rooms/RoomDiscovery.test.tsx`
- `pnpm --filter ./apps/frontend test -- -t "joins room"`

## 5) Implementation Rules

- Respect architecture flow in `./ARCHITECTURE.md`:
  - services/hook wiring before UI wiring when changing behavior
  - reducer/context for global state
  - component-local state for local concerns
- Prefer `@` imports over deep relative paths.
- Keep names aligned with `./NAMING_CONVENTIONS.md`.
- Avoid `any`; prefer precise interfaces/types and narrowing.
- Reuse shared contracts from `@impostor/types` for cross-app payloads.

## 6) Error and UX Rules

- Normalize unknown errors with logger helpers.
- Show user-facing feedback via toast in interaction-critical flows.
- Avoid raw `console.log` unless justified by existing patterns.

## 7) Testing Rules

- Add or update tests near changed components/hooks/services.
- Prefer targeted tests first, then broader test runs.
- Validate critical UI flow changes (auth, room join, game phase transitions).

## 8) Done Checklist

- Change matches `./ARCHITECTURE.md` flow and boundaries.
- Naming follows `./NAMING_CONVENTIONS.md`.
- `types:check` passes.
- Lint passes.
- Relevant tests pass.
- Shared contracts updated in `packages/types` if payloads changed.
