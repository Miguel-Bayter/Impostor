# AGENTS.md

Guidance for coding agents working in `apps/backend`.

## 1) Purpose

- Implement and maintain backend features for the multiplayer game.
- Preserve backend architecture boundaries and contracts.

## 2) Scope

- Primary scope: `apps/backend/**`.
- Shared contract scope when needed: `packages/types/**`.
- Out of scope unless explicitly requested: `deprecated/**` and unrelated frontend changes.

## 3) Primary References

- Architecture source of truth:
  - `./ARCHITECTURE.md`
- Naming rules source of truth:
  - `./NAMING_CONVENTIONS.md`
- Monorepo-wide guidance:
  - `../../AGENTS.md`

Always follow local `.ai` documents first for backend-specific decisions.

## 4) Backend Commands

Run from repository root.

- Dev:
  - `pnpm --filter ./apps/backend dev`
- Build:
  - `pnpm --filter ./apps/backend build`
- Type-check:
  - `pnpm --filter ./apps/backend check-types`
- Lint (fix):
  - `pnpm --filter ./apps/backend lint`
- Lint (check):
  - `pnpm --filter ./apps/backend check-lint`
- Tests:
  - `pnpm --filter ./apps/backend test`
- E2E tests:
  - `pnpm --filter ./apps/backend test:e2e`

Single test examples:
- `pnpm --filter ./apps/backend test -- src/modules/auth/auth.service.spec.ts`
- `pnpm --filter ./apps/backend test -- --testNamePattern="register"`
- `pnpm --filter ./apps/backend test:e2e -- test/app.e2e-spec.ts`

## 5) Implementation Rules

- Respect NestJS layering:
  - controllers/gateways = transport
  - services = business logic
  - repositories = persistence
- Use DTO validation and guards consistently.
- Prefer shared payload contracts from `@impostor/types` for frontend-facing data.
- Avoid `any`; use explicit types and `unknown` narrowing.
- Keep file naming aligned with Nest conventions in `NAMING_CONVENTIONS.md`.

## 6) Error Handling Rules

- Throw Nest exceptions for expected failures (`UnauthorizedException`, `ConflictException`, etc.).
- Do not silently swallow errors.
- Sanitize and validate untrusted input.

## 7) Testing Rules

- Add/update tests near changed logic.
- Prefer targeted tests first, then broader runs.
- For behavior changes, include at least one failing-to-passing test path.

## 8) Done Checklist

- Change matches `./ARCHITECTURE.md` boundaries.
- Naming follows `./NAMING_CONVENTIONS.md`.
- `check-types` passes.
- Lint passes.
- Relevant tests pass.
- Shared contracts updated in `packages/types` if backend/frontend payload changed.
