# Roadmap de Implementacion - Monorepo Escalable con apps y packages

## 1) Objetivo

Consolidar el proyecto en un monorepo con pnpm usando una estructura escalable:
- Apps activas en `apps/`.
- Tipos compartidos iniciales en `packages/types`.
- Sin dependencias de rutas legacy en `deprecated/` (el directorio fue eliminado).

Estructura objetivo:
- `apps/backend`
- `apps/frontend`
- `packages/types` (shared contracts)

## Estado de avance (2026-03-08)

- Fase 1 (estructura): completada.
- Fase 2 (workspace pnpm): completada.
- Fase 3 (`packages/types`): completada y consumida por backend/frontend.
- Fase 4 (adopcion de tipos compartidos): continuada con contratos ampliados en `packages/types` y adaptacion de tipos frontend/backend.
- Fase 5 (validacion tecnica): ejecutada desde root con `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm type-check`.

Decisiones de contrato vigentes:
- Identificador de usuario canonico: `userId`.
- Resultado de partida canonico: `winner` (singular).

---

## 2) Alcance

### Incluye
- Reorganizacion fisica a `apps/*`.
- Configuracion de workspace pnpm con `apps/*` y `packages/*`.
- Creacion de `packages/types` como primer paquete compartido.
- Conexion de `@impostor/types` en backend/frontend.
- Actualizacion de roadmap y plan ejecutivo en `docs/`.

### No incluye
- Migrar toda la logica a paquetes compartidos.
- Crear mas paquetes (config-eslint, config-ts, utils, ui) en esta fase.
- Recuperar o reintroducir codigo legacy eliminado.

---

## 3) Arquitectura objetivo

- Monorepo con pnpm workspaces.
- Apps deployables:
  - `apps/backend`
  - `apps/frontend`
- Paquetes compartidos:
  - `packages/types`
- Historico:
  - Carpeta `deprecated/` eliminada del repositorio.

Estrategia funcional:
- Salas y juego: WebSocket-first.
- HTTP minimo recomendado: `auth/*` y `health`.

---

## 4) Fases de implementacion

## Fase 1 - Reorganizacion del repositorio
**Objetivo:** separar apps activas de codigo legacy.

### Tareas
- Crear `apps/`.
- Mover apps activas a `apps/backend` y `apps/frontend`.
- Validar que no queden referencias activas a `deprecated/`.

### Criterio de salida
- No existen carpetas activas en raiz tipo `backend/` o `frontend/`.
- Apps activas disponibles unicamente en `apps/*`.

---

## Fase 2 - Workspace pnpm
**Objetivo:** centralizar ejecucion y dependencias.

### Tareas
- Actualizar `pnpm-workspace.yaml`:
  - `apps/*`
  - `packages/*`
- Ajustar scripts raiz para operar sobre `apps/backend` y `apps/frontend`.
- Regenerar lockfile pnpm.

### Criterio de salida
- Scripts del root ejecutan build/lint/test/type-check en apps activas.

---

## Fase 3 - Introducir `packages/types`
**Objetivo:** iniciar contratos compartidos sin sobrecargar la migracion.

### Tareas
- Crear paquete `packages/types` con contratos base:
  - auth
  - room
  - game
  - socket
- Publicar export principal via `@impostor/types`.
- Agregar dependencia `workspace:*` en backend y frontend.

### Criterio de salida
- Ambos proyectos resuelven `@impostor/types` correctamente.
- Types compartidos disponibles para adopcion incremental.

---

## Fase 4 - Adopcion gradual de tipos compartidos
**Objetivo:** reducir divergencia frontend/backend sin romper flujos existentes.

### Tareas
- Migrar imports de tipos de socket/auth primero.
- Mantener adapters locales donde existan diferencias de modelo.
- Normalizar contratos compartidos por iteraciones.

### Criterio de salida
- Contratos core reutilizados en ambos lados.
- Sin regresiones funcionales por cambio de tipado.

---

## Fase 5 - QA tecnico y cierre
**Objetivo:** validar que la nueva estructura es estable.

### Tareas
- Ejecutar `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm type-check`.
- Smoke test de backend y frontend en paralelo.
- Ajustar documentacion operativa de comandos y estructura.

### Criterio de salida
- Flujo de desarrollo estable desde raiz.
- Documentacion alineada al estado real del repo.

---

## 5) Cronograma sugerido

- Semana 1: Fase 1 + Fase 2
- Semana 2: Fase 3 + inicio Fase 4
- Semana 3: cierre Fase 4 + Fase 5

---

## 6) Riesgos y mitigacion

- Riesgo: imports rotos por movimiento de carpetas.
  - Mitigacion: barrido global de rutas + smoke tests.

- Riesgo: divergencia de modelos frontend/backend.
  - Mitigacion: contratos compartidos en `packages/types` + adopcion gradual.

- Riesgo: mezcla npm/pnpm.
  - Mitigacion: lockfile pnpm en raiz y uso estandar de scripts root.

---

## 7) Definition of Done

La migracion queda completa cuando:
1. Apps activas residen solo en `apps/backend` y `apps/frontend`.
2. No existe carpeta `deprecated/` ni referencias activas a esa ruta.
3. Workspace pnpm opera con `apps/*` y `packages/*`.
4. `packages/types` existe y es consumible por backend y frontend.
5. Build/lint/test/type-check se ejecutan desde la raiz.

---

## 8) Backlog recomendado

- Ampliar `packages/types` para cubrir todos los contratos WS.
- Crear `packages/config-eslint` y `packages/config-ts`.
- Evaluar Turborepo/Nx cuando crezca el numero de paquetes.
