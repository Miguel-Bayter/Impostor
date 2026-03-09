# Análisis Técnico del Proyecto Impostor

## Resumen
- Proyecto dividido en `backend` (Node.js + Express + Socket.io) y `frontend` (HTML/CSS/JS).
- Arquitectura orientada a tiempo real con autenticación JWT, sistema de salas y lógica de juego en memoria.
- Buen enfoque de seguridad: sanitización, rate limiting REST y WebSocket, separación de namespace `/auth`.
- Estado del juego y salas se almacenan en memoria; adecuado para desarrollo, limitado para producción.
- Frontend bien estructurado, modular y con cliente Socket.io robusto.

## Arquitectura
- Backend expone API REST (`/api`) y WebSocket (namespace `/auth` sin token y `/` con token) en `backend/server.js:75`, `backend/server.js:207`.
- CORS y Socket.io configurados con orígenes dinámicos en `backend/server.js:28` y `backend/server.js:45`.
- Rutas REST: autenticación y salas (`backend/routes/auth.js:29`, `backend/routes/rooms.js:31`).
- Handlers WS: salas y juego (`backend/sockets/roomSocket.js:26`, `backend/sockets/gameSocket.js:32`).
- Modelos en memoria: `User` (`backend/models/User.js:14`), `Room` (`backend/models/Room.js:11`), `Game` (`backend/models/Game.js:12`).
- Utilidades: JWT (`backend/utils/jwt.js:18`), sanitización (`backend/utils/sanitizer.js:32`), lógica del juego (`backend/utils/gameLogic.js:98`), rate limit WS (`backend/utils/socketRateLimiter.js:39`).
- Frontend: detección de entorno y URLs (`frontend/config.js:7`), cliente Socket (`frontend/socket-client.js:8`), UI y flujo (`frontend/game.js:25`).

## Fortalezas
- Autenticación JWT consistente HTTP/WS:
  - Extracción y verificación token en headers y handshake (`backend/middleware/auth.js:16`, `backend/middleware/auth.js:66`).
  - Namespace `/auth` separado para registro/login por WS (`backend/server.js:76`).
- Seguridad proactiva:
  - Sanitización inputs (clues, username, email) (`backend/utils/sanitizer.js:32`, `backend/utils/sanitizer.js:63`, `backend/utils/sanitizer.js:98`).
  - Rate limiting REST diferenciados (`backend/middleware/rateLimiter.js:18`, `backend/middleware/rateLimiter.js:38`, `backend/middleware/rateLimiter.js:57`).
  - Rate limiting WS por usuario y evento (`backend/utils/socketRateLimiter.js:39`).
  - Guía y script de pruebas de seguridad (`backend/SECURITY_TESTING.md:27`, `backend/test-security.js:1`).
- Lógica de juego clara y validada:
  - Reglas al iniciar (`backend/utils/gameLogic.js:309`).
  - Fases y transiciones (`backend/models/Game.js:320`).
  - Turnos, pistas, votaciones y resultados (`backend/models/Game.js:147`, `backend/models/Game.js:228`).
  - Condiciones de victoria (`backend/utils/gameLogic.js:274`).
  - Palabra secreta visible solo a ciudadanos (`backend/models/Game.js:117`).
- Frontend robusto:
  - Cliente Socket con reconexión y callbacks (`frontend/socket-client.js:267`, `frontend/socket-client.js:150`).
  - Persistencia de sesión con `localStorage` y verificación (`frontend/socket-client.js:352`).
  - Flujo de pantallas bien organizado (`frontend/game.js:230`, `frontend/game.js:581`).

## Debilidades y Riesgos
- Persistencia en memoria:
  - Usuarios, salas y juegos se pierden al reiniciar proceso; no hay DB ni recuperación.
  - Reconexiones dependen de re-join manual; `socketId` se guarda, pero no hay rebind automático salvo rejoin (`backend/models/Room.js:214`, `frontend/socket-client.js:95`).
- JWT secret por defecto inseguro:
  - `fallback_secret_change_in_production` si falta `.env` (`backend/utils/jwt.js:9`). Riesgo alto.
- CORS y orígenes:
  - Socket.io permite `'*'` en origen por defecto (`backend/server.js:28`), mientras Express CORS no; puede generar discrepancias y riesgo en producción.
- Rate limiting WS antes de autenticación:
  - El namespace principal usa `io.use(authenticateSocket)` (`backend/server.js:207`), correcto; `/auth` no limita intentos de registro/login por WS (solo REST está limitado).
- Documentación desactualizada:
  - README raíz indica fases pendientes que ya están implementadas (`README.md:55`). Puede confundir.
- Lógica de empate en votaciones:
  - Empates se resuelven al azar (`backend/utils/gameLogic.js:257`); puede ser aceptable, pero quizá requiera UX de desempate.
- Duplicados menores en base de palabras del frontend:
  - `tren`, `maleta`, `mañana` repetidos (`frontend/words.js:33`, `frontend/words.js:46`, `frontend/words.js:70`).
- Frontend configuración producción:
  - Usa constante `PRODUCTION_SERVER_URL` y referencias a `process?.env` en navegador (`frontend/config.js:20`), que normalmente no existen; el fallback es correcto pero puede ser frágil.
- Testing y calidad:
  - Sin unit tests ni scripts de lint/typecheck en ambos proyectos. Solo script de seguridad.

## Observaciones de Implementación
- Flujo de inicio de juego:
  - Host inicia juego (`backend/sockets/gameSocket.js:45`) y se asignan roles (`backend/models/Game.js:49`).
  - Fase `roles`→ host puede transicionar a `clues` (`backend/sockets/gameSocket.js:155`).
  - Confirmación de roles existe (deprecated) y puede avanzar automáticamente si todos confirman (`backend/models/Game.js:342`, `backend/sockets/gameSocket.js:255`).
- Manejo de estado WS:
  - Broadcasts de estado per jugador para ocultar `secretWord` a impostores (`backend/sockets/gameSocket.js:119`, `backend/models/Game.js:117`).
  - Eventos semánticos coherentes: `game:state`, `game:phaseChanged`, `room:state`, `room:error`.
- Rate limiting WS:
  - Ventana por evento configurable; p.ej. `game:submitClue` 1 por 2s (`backend/utils/socketRateLimiter.js:41`).
- Sanitización:
  - `validator.escape` aplicado y normalización de espacios en pistas (`backend/utils/sanitizer.js:46`, `backend/utils/sanitizer.js:49`).
  - Username permite acentos y guiones/underscore, valida longitud (`backend/utils/sanitizer.js:71`, `backend/utils/sanitizer.js:81`).
- Backend despliegue:
  - `railway.json` con Nixpacks y comandos simples (`backend/railway.json:3`, `backend/railway.json:8`).

## Sugerencias Prioritarias
- Seguridad y configuración
  - Enforce `JWT_SECRET` requerido y eliminar fallback inseguro (`backend/utils/jwt.js:9`). Recomendado: fallar al iniciar si falta.
  - Unificar política CORS y orígenes de Socket.io; evitar `'*'` en producción (`backend/server.js:28`, `backend/server.js:45`).
  - Agregar rate limiting al namespace `/auth` para `auth:register` y `auth:login` por WS.
- Persistencia y escalabilidad
  - Migrar modelos `User`, `Room`, `Game` a DB (MongoDB/PostgreSQL). Comenzar con `User` (autenticación) y `Room`.
  - Almacenar `rooms` y `game` con estados clave y referencias a usuarios; considerar Redis para rate limiting WS y sesiones.
- Robustez del juego
  - Añadir re-asignación de `socketId` automática al reconectar: hook en `connection` que sincronice `socket.userId` con `Room.updatePlayerSocket` (`backend/models/Room.js:214`) para `socket.currentRoomId`.
  - Diseñar desempate de votaciones más explícito (p.ej. segunda ronda de voto entre empatados).
  - Añadir validación de entrada en `rooms/create` para nombre de sala (usar `sanitizeRoomName`) (`backend/utils/sanitizer.js:160`).
- Calidad y DX
  - Añadir scripts `lint`, `format` y `test` en ambos `package.json`.
  - Agregar pruebas unitarias mínimas para utilidades (`gameLogic`, `sanitizer`, `jwt`) y pruebas de integración para `routes`.
  - Actualizar documentación del README raíz (estado de fases) (`README.md:55`).
- Frontend
  - Simplificar `config.js` eliminando referencias a `process.env` en navegador y documentar `SERVER_URL` única (`frontend/config.js:20`).
  - Eliminar duplicados en `words.js` (`frontend/words.js:33`, `frontend/words.js:46`, `frontend/words.js:70`).
  - Mostrar feedback visual de rate limiting y errores (ya hay `global-error`; integrar mensajes de `rateLimitExceeded`).

## Roadmap Propuesto
- Corto plazo (1–2 semanas)
  - Enforce `JWT_SECRET` y CORS seguros.
  - Rate limiting en `/auth` WS y sanitización de `room name` en REST.
  - Actualizar README y corregir duplicados `words.js`.
  - Scripts `lint` y base de tests para `utils`.
- Medio plazo (3–6 semanas)
  - Persistencia en DB para `User` y `Room`.
  - Redis para rate limiting WS y sesiones; clusterización de Socket.io si escala.
  - Rejoin automático con `updatePlayerSocket` y restauración de estado de sala.
  - UX de desempate y más métricas de juego.
- Largo plazo
  - Persistencia de `Game` y reanudación de partidas.
  - Observabilidad: logs estructurados, métricas y tracing.
  - CI/CD con tests y análisis estático.

## Verificaciones Sugeridas
- Script de seguridad ya disponible (`backend/test-security.js:32`).
- Manual:
  - Token inválido rechazado en WS (`backend/middleware/auth.js:66`).
  - Palabra secreta no visible a impostores (`backend/models/Game.js:117`).
  - Rate limiting de pistas se activa (`backend/utils/socketRateLimiter.js:41`).
  - Fase `roles`→`clues` solo por host (`backend/sockets/gameSocket.js:193`, `backend/sockets/gameSocket.js:219`).

## Conclusión
- El proyecto muestra buen diseño y preocupación por seguridad y claridad de estados.
- Para producción es clave eliminar el almacenamiento en memoria, reforzar secretos/CORS y mejorar DX con pruebas y lint.
- Frontend y backend están alineados en eventos y fases; pequeñas mejoras de configuración y documentación aumentarán confiabilidad y mantenibilidad.

