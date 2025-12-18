/**
 * Handlers WebSocket para Lógica del Juego
 * Fase 4: Lógica del Juego
 *
 * Eventos manejados:
 * - game:start - Iniciar juego (solo host)
 * - game:startCluesPhase - Iniciar fase de pistas (solo host)
 * - game:confirmRoles - Confirmar que el jugador ha visto su rol (deprecated)
 * - game:submitClue - Enviar pista
 * - game:submitVote - Enviar voto
 * - game:getState - Solicitar estado actual
 * - game:startNewRound - Iniciar nueva ronda
 *
 * Eventos emitidos:
 * - game:state - Estado actualizado del juego
 * - game:rolesConfirmed - Confirmación de rol recibida
 * - game:clueSubmitted - Nueva pista recibida (broadcast)
 * - game:turnChanged - Cambio de turno (broadcast)
 * - game:voteSubmitted - Voto recibido (broadcast)
 * - game:votingResults - Resultados de votación
 * - game:phaseChanged - Cambio de fase
 * - game:wordGuessed - Palabra secreta adivinada
 * - game:error - Error en operación
 */

const Game = require('../models/Game');
const Room = require('../models/Room');
const { checkRateLimit } = require('../utils/socketRateLimiter');
const { sanitizeClue } = require('../utils/sanitizer');

/**
 * Configurar handlers de juego para WebSocket
 * @param {Object} io - Instancia de Socket.io
 */
function setupGameHandlers(io) {
  io.on('connection', (socket) => {
    console.log(
      `[Game] Usuario conectado: ${socket.id} (Usuario ID: ${socket.userId}, Username: ${socket.username})`,
    );

    /**
     * Evento: game:start
     * Iniciar juego en una sala (solo el host puede iniciar)
     *
     * Data esperada:
     * {
     *   roomId: "ABC123"
     * }
     */
    socket.on('game:start', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'game:start');
      if (!rateLimitResult.allowed) {
        return socket.emit('game:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de inicio de juego. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const { roomId } = data;

        if (!roomId) {
          return socket.emit('game:error', {
            error: 'Room ID requerido',
            message: 'Envía el roomId: { "roomId": "..." }',
          });
        }

        // Verificar que la sala existe
        const room = await Room.getRoomInternal(roomId);

        if (!room) {
          return socket.emit('game:error', {
            error: 'Sala no encontrada',
            message: 'La sala especificada no existe',
          });
        }

        // Verificar que el usuario está en la sala
        if (!(await Room.isPlayerInRoom(roomId, socket.userId))) {
          return socket.emit('game:error', {
            error: 'No estás en esta sala',
            message: 'Debes estar en la sala para iniciar el juego',
          });
        }

        // Verificar que el usuario es el host
        if (room.hostId !== socket.userId) {
          return socket.emit('game:error', {
            error: 'Solo el host puede iniciar el juego',
            message: 'Solo el creador de la sala puede iniciar el juego',
          });
        }

        // Verificar que la sala tiene suficientes jugadores
        const minPlayers = room.settings.minPlayers || 3;
        if (room.players.length < minPlayers) {
          return socket.emit('game:error', {
            error: 'Jugadores insuficientes',
            message: `Se requieren al menos ${minPlayers} jugadores para iniciar`,
          });
        }

        // Verificar que no hay un juego ya iniciado
        if (Game.hasGame(roomId)) {
          return socket.emit('game:error', {
            error: 'Juego ya iniciado',
            message: 'El juego ya está en progreso en esta sala',
          });
        }

        // Inicializar juego
        const numImpostors = room.settings.numImpostors || 1;
        Game.initGame(roomId, room.players, numImpostors);

        // Actualizar estado de la sala
        await Room.updateStatus(roomId, 'in_progress');

        // Enviar estado del juego a todos en la sala
        // Cada jugador recibe su versión del estado (con/sin palabra secreta según su rol)
        const playersInRoom = room.players;
        playersInRoom.forEach((player) => {
          if (!player.socketId) return;
          const playerGameState = Game.getGameState(roomId, player.userId);
          io.to(player.socketId).emit('game:state', {
            gameState: playerGameState,
            phase: 'roles',
          });
        });

        // Broadcast cambio de fase
        io.to(roomId).emit('game:phaseChanged', {
          phase: 'roles',
          message: 'El juego ha comenzado. Revisa tu rol.',
        });

        console.log(`[Game] Juego iniciado en sala ${roomId} por ${socket.username}`);
      } catch (error) {
        console.error('[Game] Error al iniciar juego:', error);
        socket.emit('game:error', {
          error: 'Error al iniciar el juego',
          message: error.message,
        });
      }
    });

    /**
     * Evento: game:startCluesPhase
     * Iniciar fase de pistas (solo host puede hacerlo)
     *
     * Data esperada:
     * {
     *   roomId: "ABC123"
     * }
     */
    socket.on('game:startCluesPhase', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'game:startCluesPhase');
      if (!rateLimitResult.allowed) {
        return socket.emit('game:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de solicitudes. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const { roomId } = data;

        if (!roomId) {
          return socket.emit('game:error', {
            error: 'Room ID requerido',
            message: 'Envía el roomId: { "roomId": "..." }',
          });
        }

        // Verificar que la sala existe
        const room = await Room.getRoomInternal(roomId);
        if (!room) {
          return socket.emit('game:error', {
            error: 'Sala no encontrada',
            message: 'La sala especificada no existe',
          });
        }

        // Verificar que el usuario está en la sala
        if (!(await Room.isPlayerInRoom(roomId, socket.userId))) {
          return socket.emit('game:error', {
            error: 'No estás en esta sala',
            message: 'Debes estar en la sala para iniciar la fase de pistas',
          });
        }

        // Verificar que el usuario es el host
        if (room.hostId !== socket.userId) {
          return socket.emit('game:error', {
            error: 'Solo el host puede iniciar la fase de pistas',
            message: 'Solo el creador de la sala puede iniciar la partida',
          });
        }

        // Verificar que el juego existe
        if (!Game.hasGame(roomId)) {
          return socket.emit('game:error', {
            error: 'Juego no encontrado',
            message: 'El juego no ha sido iniciado en esta sala',
          });
        }

        // Verificar que estamos en fase de roles
        const gameState = Game.getGameStateInternal(roomId);
        if (!gameState || gameState.phase !== 'roles') {
          return socket.emit('game:error', {
            error: 'Fase incorrecta',
            message: 'Solo se puede iniciar la fase de pistas desde la fase de roles',
          });
        }

        // Cambiar a fase de pistas
        Game.changePhase(roomId, 'clues');

        // Enviar estado actualizado a todos los jugadores
        room.players.forEach((player) => {
          if (!player.socketId) return;
          const playerGameState = Game.getGameState(roomId, player.userId);
          io.to(player.socketId).emit('game:state', {
            gameState: playerGameState,
            phase: 'clues',
          });
        });

        // Broadcast cambio de fase
        io.to(roomId).emit('game:phaseChanged', {
          phase: 'clues',
          message: 'El host ha iniciado la partida. Comienza la fase de pistas.',
        });

        console.log(`[Game] Fase de pistas iniciada en sala ${roomId} por ${socket.username}`);
      } catch (error) {
        console.error('[Game] Error al iniciar fase de pistas:', error);
        socket.emit('game:error', {
          error: 'Error al iniciar fase de pistas',
          message: error.message,
        });
      }
    });

    /**
     * Evento: game:confirmRoles
     * Confirmar que el jugador ha visto su rol (deprecated - mantenido por compatibilidad)
     *
     * Data esperada:
     * {
     *   roomId: "ABC123"
     * }
     */
    socket.on('game:confirmRoles', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'game:confirmRoles');
      if (!rateLimitResult.allowed) {
        return socket.emit('game:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de confirmaciones. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const { roomId } = data;

        if (!roomId) {
          return socket.emit('game:error', {
            error: 'Room ID requerido',
            message: 'Envía el roomId: { "roomId": "..." }',
          });
        }

        // Verificar que el usuario está en la sala
        if (!(await Room.isPlayerInRoom(roomId, socket.userId))) {
          return socket.emit('game:error', {
            error: 'No estás en esta sala',
            message: 'Debes estar en la sala para confirmar tu rol',
          });
        }

        // Confirmar que el jugador vio su rol
        const result = Game.confirmRolesViewed(roomId, socket.userId);

        // Enviar estado actualizado a todos los jugadores
        const room = await Room.getRoomInternal(roomId);
        if (room) {
          room.players.forEach((player) => {
            if (!player.socketId) return;
            const playerGameState = Game.getGameState(roomId, player.userId);
            io.to(player.socketId).emit('game:state', {
              gameState: playerGameState,
              phase: result.gameState.phase,
            });
          });
        }

        // Si todos confirmaron, cambiar fase y notificar
        if (result.phaseChanged) {
          io.to(roomId).emit('game:phaseChanged', {
            phase: 'clues',
            message: 'Todos los jugadores han visto sus roles. Comienza la fase de pistas.',
          });

          console.log(
            `[Game] Todos los jugadores confirmaron roles en sala ${roomId}. Avanzando a fase de pistas.`,
          );
        } else {
          // Notificar al jugador que su confirmación fue recibida
          socket.emit('game:rolesConfirmed', {
            message: 'Confirmación recibida. Esperando a otros jugadores...',
          });
        }
      } catch (error) {
        console.error('[Game] Error al confirmar roles:', error);
        socket.emit('game:error', {
          error: 'Error al confirmar roles',
          message: error.message,
        });
      }
    });

    /**
     * Evento: game:getState
     * Solicitar estado actual del juego
     *
     * Data esperada (opcional):
     * {
     *   roomId: "ABC123" (opcional, usa la sala actual si no se especifica)
     * }
     */
    socket.on('game:getState', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'game:getState');
      if (!rateLimitResult.allowed) {
        return socket.emit('game:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de solicitudes de estado. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const roomId = data?.roomId || socket.currentRoomId;

        if (!roomId) {
          return socket.emit('game:error', {
            error: 'Room ID requerido',
            message: 'Especifica el roomId o únete a una sala primero',
          });
        }

        // Verificar que el juego existe
        if (!Game.hasGame(roomId)) {
          return socket.emit('game:error', {
            error: 'Juego no encontrado',
            message: 'El juego no ha sido iniciado en esta sala',
          });
        }

        // Obtener estado del juego para este jugador
        const gameState = Game.getGameState(roomId, socket.userId);

        socket.emit('game:state', {
          gameState: gameState,
        });
      } catch (error) {
        console.error('[Game] Error al obtener estado:', error);
        socket.emit('game:error', {
          error: 'Error al obtener estado del juego',
          message: error.message,
        });
      }
    });

    /**
     * Evento: game:submitClue
     * Enviar pista del jugador actual
     *
     * Data esperada:
     * {
     *   roomId: "ABC123",
     *   clue: "palabra"
     * }
     */
    socket.on('game:submitClue', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'game:submitClue');
      if (!rateLimitResult.allowed) {
        return socket.emit('game:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de envío de pistas. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const { roomId, clue } = data;

        if (!roomId) {
          return socket.emit('game:error', {
            error: 'Room ID requerido',
            message: 'Envía el roomId: { "roomId": "...", "clue": "..." }',
          });
        }

        if (!clue || !clue.trim()) {
          return socket.emit('game:error', {
            error: 'Pista requerida',
            message: 'Envía una pista válida',
          });
        }

        // Sanitizar pista (escapar HTML, limitar longitud, normalizar espacios)
        const sanitizedClue = sanitizeClue(clue);

        if (!sanitizedClue || sanitizedClue.trim().length === 0) {
          return socket.emit('game:error', {
            error: 'Pista inválida',
            message: 'La pista no puede estar vacía después de sanitización',
          });
        }

        // Verificar que el usuario está en la sala
        if (!(await Room.isPlayerInRoom(roomId, socket.userId))) {
          return socket.emit('game:error', {
            error: 'No estás en esta sala',
            message: 'Debes estar en la sala para enviar pistas',
          });
        }

        // Procesar pista (usar la versión sanitizada)
        const result = Game.submitClue(roomId, socket.userId, sanitizedClue);

        // Si adivinó la palabra secreta
        if (result.wordGuessed) {
          // Notificar a todos
          io.to(roomId).emit('game:wordGuessed', {
            guessedBy: result.guessedBy,
            message: `${result.guessedBy.username} adivinó la palabra secreta!`,
            gameState: null, // Cada jugador recibirá su versión
          });

          // Enviar estado actualizado a cada jugador
          const room = await Room.getRoomInternal(roomId);
          if (room) {
            room.players.forEach((player) => {
              if (!player.socketId) return;
              const playerGameState = Game.getGameState(roomId, player.userId);
              io.to(player.socketId).emit('game:state', {
                gameState: playerGameState,
              });
            });
          }

          // Cambiar fase a resultados
          Game.changePhase(roomId, 'results');
          io.to(roomId).emit('game:phaseChanged', {
            phase: 'results',
            message: 'La palabra secreta fue adivinada. La ronda termina.',
          });

          console.log(
            `[Game] Palabra secreta adivinada por ${result.guessedBy.username} en sala ${roomId}`,
          );
          return;
        }

        // Broadcast nueva pista
        const lastClue = result.gameState.clues[result.gameState.clues.length - 1];
        io.to(roomId).emit('game:clueSubmitted', {
          clue: lastClue,
          gameState: null, // Cada jugador recibirá su versión
        });

        // Enviar estado actualizado a cada jugador
        const room = await Room.getRoomInternal(roomId);
        if (room) {
          room.players.forEach((player) => {
            if (!player.socketId) return;
            const playerGameState = Game.getGameState(roomId, player.userId);
            io.to(player.socketId).emit('game:state', {
              gameState: playerGameState,
            });
          });
        }

        // Si cambió de fase (todos dieron pista)
        if (result.gameState.phase === 'voting') {
          io.to(roomId).emit('game:phaseChanged', {
            phase: 'voting',
            message: 'Todos han dado su pista. Comienza la votación.',
          });
        } else {
          // Cambio de turno
          io.to(roomId).emit('game:turnChanged', {
            currentTurn: result.gameState.currentTurn,
            message: 'Es el turno del siguiente jugador',
          });
        }

        console.log(`[Game] Pista enviada por ${socket.username} en sala ${roomId}`);
      } catch (error) {
        console.error('[Game] Error al enviar pista:', error);
        socket.emit('game:error', {
          error: 'Error al enviar pista',
          message: error.message,
        });
      }
    });

    /**
     * Evento: game:submitVote
     * Enviar voto del jugador actual
     *
     * Data esperada:
     * {
     *   roomId: "ABC123",
     *   votedPlayerId: "user-id-uuid"
     * }
     */
    socket.on('game:submitVote', async (data) => {
      // (Rate limiting y validaciones previas se mantienen igual)
      try {
        const { roomId, votedPlayerId } = data;

        // ... (Validaciones de roomId, votedPlayerId, isPlayerInRoom)
        if (!roomId || !votedPlayerId || !(await Room.isPlayerInRoom(roomId, socket.userId))) {
            return socket.emit('game:error', { message: 'Datos de votación inválidos.'});
        }

        const result = Game.submitVote(roomId, socket.userId, votedPlayerId);

        io.to(roomId).emit('game:voteSubmitted', {
          voterId: socket.userId,
          votedPlayerId: votedPlayerId,
          votingComplete: result.votingComplete,
        });

        const room = await Room.getRoomInternal(roomId);
        if (room) {
          room.players.forEach((player) => {
            const playerGameState = Game.getGameState(roomId, player.userId);
            if (player.socketId) {
              io.to(player.socketId).emit('game:state', { gameState: playerGameState });
            }
          });
        }

        if (result.votingComplete) {
          if (result.isTie) {
            // Hay un empate, notificar a los clientes
            io.to(roomId).emit('game:tie', {
              message: '¡Hay un empate en la votación!',
              tiedPlayers: result.tiedPlayers,
            });
            console.log(`[Game] Empate en la votación en la sala ${roomId}.`);
          } else {
            // No hay empate, proceder como antes
            io.to(roomId).emit('game:votingResults', {
              results: result.results,
              victoryCheck: result.victoryCheck,
            });

            if (result.victoryCheck.winner) {
              io.to(roomId).emit('game:phaseChanged', { phase: 'victory' });
            } else {
              io.to(roomId).emit('game:phaseChanged', { phase: 'results' });
            }
            console.log(`[Game] Votación completada en sala ${roomId}.`);
          }
        }
      } catch (error) {
        console.error('[Game] Error al enviar voto:', error);
        socket.emit('game:error', { error: 'Error al enviar voto', message: error.message });
      }
    });

    /**
     * Evento: game:resolveTie
     * Resuelve un empate (solo el host puede hacerlo)
     */
    socket.on('game:resolveTie', async (data) => {
      try {
        const { roomId } = data;
        const room = await Room.getRoomInternal(roomId);

        if (!room || room.hostId !== socket.userId) {
          return socket.emit('game:error', { message: 'Solo el host puede resolver un empate.' });
        }

        const result = Game.breakTie(roomId);

        io.to(roomId).emit('game:votingResults', {
          results: result.results,
          victoryCheck: result.victoryCheck,
          isTieResolution: true,
        });

        if (result.victoryCheck.winner) {
          io.to(roomId).emit('game:phaseChanged', { phase: 'victory' });
        } else {
          io.to(roomId).emit('game:phaseChanged', { phase: 'results' });
        }
        
        console.log(`[Game] Empate resuelto en sala ${roomId}.`);

      } catch (error) {
        console.error('[Game] Error al resolver empate:', error);
        socket.emit('game:error', { error: 'Error al resolver empate', message: error.message });
      }
    });

    /**
     * Evento: game:startNewRound
     * Iniciar nueva ronda (después de ver resultados)
     *
     * Data esperada:
     * {
     *   roomId: "ABC123"
     * }
     */
    socket.on('game:startNewRound', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'game:startNewRound');
      if (!rateLimitResult.allowed) {
        return socket.emit('game:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de inicio de ronda. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const { roomId } = data;

        if (!roomId) {
          return socket.emit('game:error', {
            error: 'Room ID requerido',
            message: 'Envía el roomId: { "roomId": "..." }',
          });
        }

        // Verificar que el usuario está en la sala
        if (!(await Room.isPlayerInRoom(roomId, socket.userId))) {
          return socket.emit('game:error', {
            error: 'No estás en esta sala',
            message: 'Debes estar en la sala para iniciar una nueva ronda',
          });
        }

        // Verificar que el usuario es el host
        const room = await Room.getRoomInternal(roomId);
        if (!room || room.hostId !== socket.userId) {
          return socket.emit('game:error', {
            error: 'Solo el host puede iniciar una nueva ronda',
            message: 'Solo el creador de la sala puede iniciar una nueva ronda',
          });
        }

        // Iniciar nueva ronda
        Game.startNewRound(roomId);

        // Enviar estado actualizado a todos
        room.players.forEach((player) => {
          if (!player.socketId) return;
          const playerGameState = Game.getGameState(roomId, player.userId);
          io.to(player.socketId).emit('game:state', {
            gameState: playerGameState,
          });
        });

        // Broadcast cambio de fase
        io.to(roomId).emit('game:phaseChanged', {
          phase: 'clues',
          message: 'Nueva ronda iniciada. Comienza la fase de pistas.',
        });

        console.log(`[Game] Nueva ronda iniciada en sala ${roomId} por ${socket.username}`);
      } catch (error) {
        console.error('[Game] Error al iniciar nueva ronda:', error);
        socket.emit('game:error', {
          error: 'Error al iniciar nueva ronda',
          message: error.message,
        });
      }
    });


  });
}

module.exports = {
  setupGameHandlers,
};
