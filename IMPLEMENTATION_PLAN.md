# Plan de Implementación – Fase 2 (Proyecto Impostor)

## Resumen Ejecutivo
- Objetivo: preparar el proyecto para producción temprana, reforzando seguridad, calidad y persistencia.
- Enfoque: iteraciones cortas con entregables verificables por fase, sin introducir deuda técnica.
- Métricas clave: errores de autenticación bloqueados, tiempos de respuesta WS, cobertura de tests, estabilidad en reconexiones.

## Alcance
- Backend (Node.js + Express + Socket.io), Frontend (HTML/CSS/JS).
- Seguridad (JWT, CORS, rate limiting), DX (lint/tests/CI), persistencia (User/Room en DB), robustez del juego, observabilidad.
- Sin cambios disruptivos al protocolo WS; mantener compatibilidad de eventos actuales.

## Checklist de Fases
- [x] Fase 1 — Seguridad y Configuración
- [ ] Fase 2 — Calidad y DX
- [ ] Fase 3 — Persistencia Inicial
- [ ] Fase 4 — Rate Limiting y Sesiones con Redis
- [ ] Fase 5 — Robustez del Juego
- [ ] Fase 6 — Mejoras de Frontend
- [ ] Fase 7 — Observabilidad y CI/CD

## Fase 1 — Seguridad y Configuración (Semana 1–2)
- Objetivos:
  - Requerir `JWT_SECRET` y eliminar fallback inseguro.
  - Unificar política CORS/Socket.io y restringir orígenes en producción.
  - Añadir rate limiting al namespace `/auth` por WS.
  - Validar y sanitizar nombre de sala en REST.
- Entregables:
  - [x] Inicio del servidor falla sin `JWT_SECRET`.
  - [x] Lista de orígenes permitidos configurable por entorno.
  - [x] Límite de intentos para `auth:register` y `auth:login` por usuario/IP.
  - [x] Validación de `room name` en `rooms/create`.
- Cambios previstos:
  - `backend/utils/jwt.js:9` (eliminar fallback, validar presencia).
  - `backend/server.js:28`, `backend/server.js:45` (alinear CORS/Socket.io origins).
  - `backend/server.js:76` (rate limiting en `/auth` WS).
  - `backend/utils/sanitizer.js:160` (usar en rutas de sala).
- Criterios de aceptación:
  - [x] Lanzar sin `.env` válido produce error claro y bloquea el arranque.
  - [x] Peticiones desde orígenes no permitidos son rechazadas en HTTP/WS.
  - [x] Exceder límites en `/auth` WS devuelve error consistente y se registra.
  - [x] `rooms/create` rechaza nombres inválidos con mensaje útil.
- Riesgos y mitigación:
  - Corte por `JWT_SECRET` ausente: documentar `.env.example` y mensajes de arranque.
  - Falsos positivos de CORS: incluir modo desarrollo con comodín solo local.

## Fase 2 — Calidad y DX (Semana 1–2, en paralelo)
- Objetivos:
  - Añadir scripts `lint`, `format`, `test` en ambos `package.json`.
  - Definir base de pruebas unitarias para `utils` y pruebas de integración para rutas.
  - Opcional: pre-commit con formateo/linteo.
- Entregables:
  - [x] Scripts ejecutables: `npm run lint`, `npm run test`, `npm run format`.
  - [x] Tests mínimos para `gameLogic`, `sanitizer`, `jwt`.
  - [x] Integración: `auth` y `rooms`.
- Cambios previstos:
  - `backend/package.json`, `frontend/package.json` (scripts y deps).
- Checklist de estado:
  - [x] Scripts definidos en `backend/package.json:9-11` y `frontend/package.json:9-11`.
  - [x] Unit tests `utils` presentes: `backend/tests/utils/gameLogic.test.mjs`, `backend/tests/utils/sanitizer.test.mjs`, `backend/tests/utils/jwt.test.mjs`.
  - [x] Tests de integración de rutas: `backend/tests/routes/auth.test.mjs`, `backend/tests/routes/rooms.test.mjs`.
  - [ ] Lint sin errores en ejecución local/CI.
  - [ ] Cobertura inicial ≥ 40% en `utils`.
  - [ ] Tests de rutas pasan con servidor en modo test (verificación de ejecución).
- Criterios de aceptación:
  - [ ] Lint sin errores en CI local.
  - [ ] Cobertura inicial ≥ 40% en `utils`.
  - [ ] Tests de rutas pasan con servidor en modo test.
- Riesgos y mitigación:
  - Falta de framework de test: seleccionar minimalista (p. ej. Vitest/Jest para Node, sin romper estructura).
 
### Cómo completar Fase 2
- Ejecutar `npm run lint` en `backend` y `frontend` y corregir cualquier error de estilo.
- Añadir script de cobertura y medir cobertura de `utils`:
  - Backend: agregar `\"test:coverage\": \"vitest --coverage\"` en `backend/package.json` y ejecutar `npm run test:coverage` apuntando a `backend/tests`.
  - Frontend: agregar `\"test:coverage\": \"vitest --coverage\"` en `frontend/package.json` si se desea cobertura de utilidades del front.
- Verificar que los tests de rutas e integración pasan:
  - Ejecutar `npm run test` en `backend` para `auth` y `rooms`. Asegurar que las pruebas usen `process.env.JWT_SECRET` de test y que los mocks de modelos limpios (`User.clear()`, `Room.clear()`) se ejecuten antes de cada test.
- Opcional: configurar pre-commit con `lint-staged` para formateo/linteo automático.

## Fase 3 — Persistencia Inicial (Semana 3–4)
- Objetivos:
  - Migrar `User` y `Room` desde memoria a DB (MongoDB o PostgreSQL).
  - Mantener API/WS actuales; introducir repositorios y capa de acceso a datos.
- Entregables:
  - Modelos y esquemas para `User` y `Room`.
  - Repositorios con CRUD y transacciones básicas.
  - Ruta de migración (no destructiva) y adaptadores de in-memory → DB.
- Cambios previstos:
  - `backend/models/User.js:14`, `backend/models/Room.js:11` (adaptar a persistencia).
  - Nueva capa `backend/repositories/*` y `backend/db/*`.
  - Configuración de conexión por entorno.
- Criterios de aceptación:
  - Crear/join room persiste y se recupera tras reinicio.
  - Usuarios y sesiones se referencian correctamente.
  - Degradación controlada si DB no está disponible (modo in-memory solo dev).
- Riesgos y mitigación:
  - Consistencia WS al reinicio: cache de estado mínimo y rehidratación de sala.

## Fase 4 — Rate Limiting y Sesiones con Redis (Semana 4–5)
- Objetivos:
  - Externalizar rate limiting WS a Redis para precisión y escalabilidad.
  - Gestionar sesiones/transitorios (socket/user bindings) en Redis.
- Entregables:
  - Adaptadores para `backend/utils/socketRateLimiter.js:39`.
  - Mapa `userId → socketId` resiliente a reconexiones.
- Criterios de aceptación:
  - Límites consistentes bajo carga (>100 conexiones).
  - Reconexión reasigna límites sin perder estado.
- Riesgos y mitigación:
  - Redis caído: fallback a in-memory con avisos y métricas.

## Fase 5 — Robustez del Juego (Semana 4–6)
- Objetivos:
  - Reasignación automática de `socketId` al reconectar.
  - Revisar UX de desempate de votaciones.
- Entregables:
  - Hook en `connection` que sincronice `socket.userId` y `currentRoomId` con `Room.updatePlayerSocket` (`backend/models/Room.js:214`).
  - Mecánica de desempate configurable (segundo voto o sorteo con feedback).
- Cambios previstos:
  - `backend/sockets/gameSocket.js:*` y `backend/sockets/roomSocket.js:*` (rebind y UX).
  - `backend/utils/gameLogic.js:257` (política de empate).
- Criterios de aceptación:
  - Reconexión del jugador recupera estado sin interacción manual.
  - Empate no sorprende: mensaje y flujo claro.

## Fase 6 — Mejoras de Frontend (Semana 2–3, paralelo)
- Objetivos:
  - Simplificar `frontend/config.js:20` evitando `process?.env` en navegador.
  - Eliminar duplicados en `frontend/words.js` (`tren`, `maleta`, `mañana`).
  - Feedback visual para rate limiting y errores.
- Entregables:
  - `SERVER_URL` única y documentada.
  - Lista de palabras sin duplicados.
  - Componente de mensajes integrado con `rateLimitExceeded`.
- Criterios de aceptación:
  - Selección de servidor consistente por entorno.
  - UI muestra bloqueos de rate limit claramente.

## Fase 7 — Observabilidad y CI/CD (Semana 6+)
- Objetivos:
  - Logs estructurados, métricas básicas y tracing ligero.
  - Pipeline CI con lint, tests y análisis estático.
- Entregables:
  - Middleware de logging con correlación por `socket.id`/`userId`.
  - Métricas: latencia de eventos WS, errores por evento, reconexiones.
  - Workflow CI con gates de calidad.
- Criterios de aceptación:
  - Alertas básicas ante picos de errores WS.
  - PRs bloqueados si fallan lint/tests.

## Plan de Pruebas
- Seguridad:
  - Token inválido rechazado en WS (`backend/middleware/auth.js:66`).
  - CORS: orígenes no permitidos bloqueados en HTTP/WS.
  - Rate limit `/auth`: bloqueo y mensaje consistente.
- Juego:
  - Palabra secreta oculta a impostores (`backend/models/Game.js:117`).
  - Rate limit pistas activo (`backend/utils/socketRateLimiter.js:41`).
  - Transición `roles → clues` solo host (`backend/sockets/gameSocket.js:193`, `backend/sockets/gameSocket.js:219`).
- Persistencia:
  - Reinicio recupera salas y usuarios activos.
  - Reconexión reasigna `socketId` automáticamente.

## Despliegue y Rollout
- Entornos:
  - `dev`: CORS laxo solo localhost; in-memory permitido.
  - `staging`: DB y Redis obligatorios; métricas activas.
  - `prod`: orígenes restringidos, secretos requeridos, CI/CD estricto.
- Estrategia:
  - Feature flags para nuevas políticas (empate, rebind).
  - Despliegue gradual con monitoreo de errores WS.

## KPIs y Seguimiento
- Seguridad: 0 arranques sin `JWT_SECRET`, 0 peticiones desde orígenes no permitidos en prod.
- Calidad: cobertura `utils` ≥ 60% al final de Fase 2, lint 0 errores.
- Estabilidad: tasa de reconexión exitosa ≥ 95%, latencia WS p95 < 300ms.
- Disponibilidad: errores por evento WS < 1% en picos.

## Riesgos Globales
- Complejidad añadida por DB/Redis: abordar con capas y adaptadores claros.
- Cambios de políticas (CORS/limites) afectando dev: perfilar por entorno y documentar.
- Falta de CI: priorizar Fase 2 para evitar regresiones tempranas.

## Cronograma Tentativo
- Semanas 1–2: Fase 1 y Fase 2 (parcial Frontend).
- Semanas 3–4: Fase 3.
- Semanas 4–5: Fase 4.
- Semanas 4–6: Fase 5.
- Semanas 6+: Fase 7 y ajustes.

