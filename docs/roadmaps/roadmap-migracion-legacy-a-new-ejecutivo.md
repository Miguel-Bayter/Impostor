# Plan Ejecutivo (1 pagina) - Monorepo con apps y packages

## Objetivo

Escalar el repositorio a una estructura monorepo clara y sostenible:
- Apps activas en `apps/backend` y `apps/frontend`.
- Contratos compartidos iniciales en `packages/types`.
- Sin rutas activas a `deprecated/` (el directorio fue eliminado).

## Estado actual (2026-03-08)

- Estructura final activa validada en `apps/*` y `packages/types`.
- `@impostor/types` integrado en backend y frontend con adopcion incremental en curso.
- Validacion tecnica ejecutada desde root: build, lint, test y type-check en verde.
- Contratos canonicos fijados para interoperabilidad: `userId` y `winner`.

## Decisiones clave

- Modelo de repo: pnpm workspace con `apps/*` y `packages/*`.
- Apps deployables: solo `apps/backend` y `apps/frontend`.
- Compartido inicial: solo `packages/types` (sin sobre-ingenieria).
- Gameplay/salas: WebSocket-first; HTTP minimo (`auth/*`, `health`).

## Roadmap resumido

### Fase 1 - Estructura
- Mover apps activas a `apps/`.
- Validar que no existan referencias activas a `deprecated/`.

### Fase 2 - Workspace
- Actualizar `pnpm-workspace.yaml` a `apps/*` y `packages/*`.
- Ajustar scripts raiz para ejecutar ambas apps.

### Fase 3 - Shared types
- Crear `packages/types` con contratos base (auth, room, game, socket).
- Conectar `@impostor/types` en backend/frontend.

### Fase 4 - Adopcion incremental
- Migrar tipos compartidos por etapas, empezando por socket/auth.
- Mantener compatibilidad mientras convergen modelos.

### Fase 5 - Validacion y cierre
- Ejecutar install/build/lint/test/type-check desde root.
- Confirmar documentacion y flujo operativo final.

## Criterios de exito

- Estructura final: `apps/*` y `packages/types` (sin `deprecated/*`).
- Scripts root pnpm operativos para todo el equipo.
- Contratos compartidos disponibles y usados en ambos proyectos.
- Sin regresiones funcionales en flujo principal.

## Riesgos y mitigacion

- Paths rotos por movimiento -> barrido de referencias y smoke tests.
- Divergencia de tipos -> contrato compartido + migracion incremental.
- Desalineacion de tooling -> estandarizar ejecucion via scripts raiz.

## Hitos

- Hito A: estructura `apps/` establecida.
- Hito B: workspace pnpm operativo.
- Hito C: `packages/types` integrado.
- Hito D: validacion tecnica en verde y cierre.
