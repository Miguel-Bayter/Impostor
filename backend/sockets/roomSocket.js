/**
 * Handlers WebSocket para Salas
 * Fase 3: Sistema de Salas
 *
 * Eventos manejados:
 * - room:join - Unirse a sala por WebSocket
 * - room:leave - Salir de sala
 * - room:state - Solicitar estado actual de la sala
 *
 * Eventos emitidos:
 * - room:joined - Confirmación de unión a sala
 * - room:left - Confirmación de salida de sala
 * - room:playerJoined - Notificación de nuevo jugador (broadcast)
 * - room:playerLeft - Notificación de jugador que salió (broadcast)
 * - room:state - Estado actual de la sala
 * - room:error - Error en operación de sala
 */

const Room = require('../models/Room');
const Game = require('../models/Game'); // Importar Game
const { checkRateLimit } = require('../utils/socketRateLimiter');

/**
 * Configurar handlers de salas para WebSocket
 * @param {Object} io - Instancia de Socket.io
 */
function setupRoomHandlers(io) {
  const HOST_MIGRATION_GRACE_MS = 15000;
  const GAME_DISCONNECT_GRACE_MS = 15000;
  const pendingHostMigrations = new Map();
  const pendingGameDisconnects = new Map();

  const cancelPendingHostMigration = (roomId, userId) => {
    const key = `${roomId}:${userId}`;
    const t = pendingHostMigrations.get(key);
    if (t) {
      clearTimeout(t);
      pendingHostMigrations.delete(key);
    }
  };

  const cancelPendingGameDisconnect = (roomId, userId) => {
    const key = `${roomId}:${userId}`;
    const t = pendingGameDisconnects.get(key);
    if (t) {
      clearTimeout(t);
      pendingGameDisconnects.delete(key);
    }
  };

  io.on('connection', (socket) => {
    console.log(
      `[Room] Usuario conectado: ${socket.id} (Usuario ID: ${socket.userId}, Username: ${socket.username})`,
    );

    // Almacenar la sala actual del socket
    socket.currentRoomId = null;

    // ---- INICIO: Lógica de Reconexión Automática ----
    const handleAutoReconnection = async () => {
      if (!socket.userId) return;

      try {
        const room = await Room.findRoomByPlayerId(socket.userId);
        if (room && room.id) {
          console.log(`[Reconnection] Usuario ${socket.username} encontrado en la sala ${room.id}. Reconectando...`);

          cancelPendingHostMigration(room.id, socket.userId);
          cancelPendingGameDisconnect(room.id, socket.userId);

          // Actualizar socketId y unir a la sala de Socket.io
          await Room.updatePlayerSocket(room.id, socket.userId, socket.id);
          socket.join(room.id);
          socket.currentRoomId = room.id;

          // Obtener el estado completo y actualizado de la sala y el juego
          const updatedRoom = await Room.findById(room.id);
          const gameState = Game.getGameState(room.id, socket.userId);

          // Notificar al jugador que se ha reconectado
          socket.emit('room:reconnected', {
            message: 'Te has reconectado a la sala.',
            room: updatedRoom,
            gameState: gameState,
          });

          // Notificar a los demás en la sala
          socket.to(room.id).emit('room:playerReconnected', {
            message: `${socket.username} se ha reconectado.`,
            player: {
              userId: socket.userId,
              username: socket.username,
            },
          });
          
          io.to(room.id).emit('room:state', { room: updatedRoom });

          console.log(`[Reconnection] Usuario ${socket.username} reconectado exitosamente a la sala ${room.id}.`);
        }
      } catch (error) {
        console.error('[Reconnection] Error al intentar reconectar automáticamente:', error);
        socket.emit('room:error', {
          error: 'Error de reconexión',
          message: 'Hubo un problema al intentar reconectarte a tu sala anterior.',
        });
      }
    };

    handleAutoReconnection();
    // ---- FIN: Lógica de Reconexión Automática ----


    /**
     * Evento: room:join
     * Unirse a una sala por WebSocket
     *
     * Data esperada:
     * {
     *   roomId: "ABC123"
     * }
     */
    socket.on('room:join', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'room:join');
      if (!rateLimitResult.allowed) {
        return socket.emit('room:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de uniones a salas. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const { roomId } = data;

        if (!roomId) {
          return socket.emit('room:error', {
            error: 'Room ID requerido',
            message: 'Envía el roomId: { "roomId": "..." }',
          });
        }

        // Verificar que la sala existe
        const room = await Room.getRoomInternal(roomId);

        if (!room) {
          return socket.emit('room:error', {
            error: 'Sala no encontrada',
            message: 'La sala especificada no existe',
          });
        }

        // Si el usuario ya está en la sala, permitir reconexión
        // (por ejemplo tras refrescar la página y perder el socket previo)
        if (await Room.isPlayerInRoom(roomId, socket.userId)) {
          // Si ya está en otra sala, salir primero
          if (socket.currentRoomId && socket.currentRoomId !== roomId) {
            await handleLeaveRoom(socket, socket.currentRoomId, io);
          }

          cancelPendingHostMigration(roomId, socket.userId);
          cancelPendingGameDisconnect(roomId, socket.userId);

          await Room.updatePlayerSocket(roomId, socket.userId, socket.id);

          socket.join(roomId);
          socket.currentRoomId = roomId;

          const updatedRoom = await Room.findById(roomId);

          socket.emit('room:joined', {
            message: 'Te has unido a la sala',
            room: updatedRoom,
          });

          io.to(roomId).emit('room:state', {
            room: updatedRoom,
          });

          console.log(
            `[Room] Usuario ${socket.username} (${socket.userId}) se reconectó a la sala ${roomId}`,
          );
          return;
        }

        // Verificar que no esté llena
        if (room.players.length >= room.maxPlayers) {
          return socket.emit('room:error', {
            error: 'Sala llena',
            message: 'La sala ha alcanzado el máximo de jugadores',
          });
        }

        // Verificar que no esté en progreso
        if (room.status !== 'waiting') {
          return socket.emit('room:error', {
            error: 'Sala no disponible',
            message: 'La sala no está esperando jugadores',
          });
        }

        // Si ya está en otra sala, salir primero
        if (socket.currentRoomId && socket.currentRoomId !== roomId) {
          handleLeaveRoom(socket, socket.currentRoomId, io);
        }

        // Agregar jugador a la sala
        await Room.addPlayer(roomId, socket.userId, socket.username, socket.id);

        // Unirse al room de Socket.io
        socket.join(roomId);
        socket.currentRoomId = roomId;

        // Obtener estado actualizado de la sala
        const updatedRoom = await Room.findById(roomId);

        // Confirmar al jugador que se unió
        socket.emit('room:joined', {
          message: 'Te has unido a la sala',
          room: updatedRoom,
        });

        // Notificar a los demás jugadores
        socket.to(roomId).emit('room:playerJoined', {
          message: `${socket.username} se ha unido a la sala`,
          player: {
            userId: socket.userId,
            username: socket.username,
          },
          room: updatedRoom,
        });

        // Enviar estado actualizado a todos en la sala
        io.to(roomId).emit('room:state', {
          room: updatedRoom,
        });

        console.log(
          `[Room] Usuario ${socket.username} (${socket.userId}) se unió a la sala ${roomId}`,
        );
      } catch (error) {
        console.error('[Room] Error al unirse a sala:', error);
        socket.emit('room:error', {
          error: 'Error al unirse a la sala',
          message: error.message,
        });
      }
    });

    /**
     * Evento: room:leave
     * Salir de una sala
     *
     * Data esperada (opcional):
     * {
     *   roomId: "ABC123" (opcional, usa la sala actual si no se especifica)
     * }
     */
    socket.on('room:leave', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'room:leave');
      if (!rateLimitResult.allowed) {
        return socket.emit('room:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de salidas de salas. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const roomId = data?.roomId || socket.currentRoomId;

        if (!roomId) {
          return socket.emit('room:error', {
            error: 'No estás en ninguna sala',
            message: 'No puedes salir de una sala si no estás en ninguna',
          });
        }

        await handleLeaveRoom(socket, roomId, io);
      } catch (error) {
        console.error('[Room] Error al salir de sala:', error);
        socket.emit('room:error', {
          error: 'Error al salir de la sala',
          message: error.message,
        });
      }
    });

    /**
     * Evento: room:state
     * Solicitar estado actual de la sala
     *
     * Data esperada (opcional):
     * {
     *   roomId: "ABC123" (opcional, usa la sala actual si no se especifica)
     * }
     */
    socket.on('room:state', async (data) => {
      // Aplicar rate limiting
      const rateLimitResult = await checkRateLimit(socket.userId, 'room:state');
      if (!rateLimitResult.allowed) {
        return socket.emit('room:error', {
          error: 'Rate limit excedido',
          message: `Has excedido el límite de solicitudes de estado. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      try {
        const roomId = data?.roomId || socket.currentRoomId;

        if (!roomId) {
          return socket.emit('room:error', {
            error: 'Room ID requerido',
            message: 'Especifica el roomId o únete a una sala primero',
          });
        }

        const room = await Room.findById(roomId);

        if (!room) {
          return socket.emit('room:error', {
            error: 'Sala no encontrada',
            message: 'La sala especificada no existe',
          });
        }

        socket.emit('room:state', {
          room: room,
        });
      } catch (error) {
        console.error('[Room] Error al obtener estado de sala:', error);
        socket.emit('room:error', {
          error: 'Error al obtener estado de la sala',
          message: error.message,
        });
      }
    });

    /**
     * Manejar desconexión
     * Marcar al jugador como desconectado y notificar a la sala.
     */
    socket.on('disconnect', async () => {
      console.log(`[Disconnection] Usuario desconectado: ${socket.id} (Usuario ID: ${socket.userId})`);
      if (socket.currentRoomId && socket.userId) {
        try {
          const roomId = socket.currentRoomId;
          const userId = socket.userId;
          const username = socket.username;

          const roomBeforeUpdate = await Room.getRoomInternal(roomId);

          // Marcar al jugador como desconectado (socketId = null)
          await Room.updatePlayerSocket(roomId, userId, null);

          const updatedRoom = await Room.findById(roomId);
          if (updatedRoom) {
            io.to(roomId).emit('room:state', { room: updatedRoom });
          }

          // Notificar a los demás jugadores en la sala
          socket.to(roomId).emit('room:playerDisconnected', {
            message: `${username} se ha desconectado. Puede reconectarse.`,
            player: { userId, username },
          });

          if (roomBeforeUpdate && roomBeforeUpdate.hostId === userId) {
            cancelPendingHostMigration(roomId, userId);
            const key = `${roomId}:${userId}`;
            const timeoutId = setTimeout(async () => {
              try {
                const roomNow = await Room.getRoomInternal(roomId);
                if (!roomNow) return;
                const hostStillSame = roomNow.hostId === userId;
                const player = roomNow.players?.find((p) => p.userId === userId);
                const stillDisconnected = !player?.socketId;
                if (!hostStillSame || !stillDisconnected) return;

                const promoted = await Room.promoteNewHost(roomId, userId);
                if (promoted) {
                  io.to(roomId).emit('room:state', { room: promoted });
                }
              } catch (e) {
              } finally {
                pendingHostMigrations.delete(key);
              }
            }, HOST_MIGRATION_GRACE_MS);

            pendingHostMigrations.set(key, timeoutId);
          }

          if (Game.hasGame(roomId)) {
            cancelPendingGameDisconnect(roomId, userId);
            const key = `${roomId}:${userId}`;
            const timeoutId = setTimeout(async () => {
              try {
                const roomNow = await Room.getRoomInternal(roomId);
                const playerNow = roomNow?.players?.find((p) => p.userId === userId);
                const stillDisconnected = !playerNow?.socketId;
                if (!stillDisconnected) return;

                const gameUpdate = Game.handlePlayerDisconnect(roomId, userId);
                if (!gameUpdate) return;

                const roomAfter = await Room.getRoomInternal(roomId);
                if (roomAfter) {
                  roomAfter.players.forEach((p) => {
                    if (!p.socketId) return;
                    const playerGameState = Game.getGameState(roomId, p.userId);
                    io.to(p.socketId).emit('game:state', { gameState: playerGameState });
                  });
                }

                if (gameUpdate.victoryCheck && gameUpdate.victoryCheck.winner) {
                  io.to(roomId).emit('game:victory', {
                    winner: gameUpdate.victoryCheck.winner,
                    reason: 'Un jugador se ha desconectado, resultando en una victoria.',
                    eliminatedPlayer: gameUpdate.eliminatedByDisconnect,
                  });
                } else {
                  io.to(roomId).emit('game:playerDisconnected', {
                    message: `El jugador ${username} ha sido eliminado de la partida por desconexión.`,
                    eliminatedPlayer: gameUpdate.eliminatedByDisconnect,
                    gameState: null,
                  });
                }
              } catch (e) {
              } finally {
                pendingGameDisconnects.delete(key);
              }
            }, GAME_DISCONNECT_GRACE_MS);

            pendingGameDisconnects.set(key, timeoutId);
          }

          console.log(
            `[Disconnection] Usuario ${username} marcado como desconectado en la sala ${roomId}.`,
          );
        } catch (error) {
          console.error(
            `[Disconnection] Error al manejar la desconexión para el usuario ${socket.userId} en la sala ${socket.currentRoomId}:`,
            error,
          );
        }
      }
    });
  });
}

/**
 * Función auxiliar para manejar la salida de una sala
 * @param {Object} socket - Socket del jugador
 * @param {string} roomId - ID de la sala
 * @param {Object} io - Instancia de Socket.io
 * @param {boolean} isDisconnect - Si es una desconexión (no un leave manual)
 */
async function handleLeaveRoom(socket, roomId, io, isDisconnect = false) {
  try {
    // Verificar que la sala existe
    const room = await Room.getRoomInternal(roomId);

    if (!room) {
      // La sala ya no existe, solo limpiar el socket
      socket.currentRoomId = null;
      return;
    }

    // Verificar que el jugador está en la sala
    if (!(await Room.isPlayerInRoom(roomId, socket.userId))) {
      socket.currentRoomId = null;
      return;
    }

    // Remover jugador de la sala
    const updatedRoom = await Room.removePlayer(roomId, socket.userId);

    // Si el jugador abandona manualmente una partida en curso, actualizar el estado del juego
    // para que no bloquee turnos/votación.
    if (!isDisconnect && Game.hasGame(roomId)) {
      try {
        const gameUpdate = Game.handlePlayerDisconnect(roomId, socket.userId);
        if (gameUpdate) {
          const roomAfter = await Room.getRoomInternal(roomId);
          if (roomAfter) {
            roomAfter.players.forEach((p) => {
              if (!p.socketId) return;
              const playerGameState = Game.getGameState(roomId, p.userId);
              io.to(p.socketId).emit('game:state', { gameState: playerGameState });
            });
          }

          if (gameUpdate.victoryCheck && gameUpdate.victoryCheck.winner) {
            io.to(roomId).emit('game:victory', {
              winner: gameUpdate.victoryCheck.winner,
              reason: 'Un jugador abandonó la partida, resultando en una victoria.',
              eliminatedPlayer: gameUpdate.eliminatedByDisconnect,
            });
          }
        }
      } catch (e) {
      }
    }

    // Salir del room de Socket.io
    socket.leave(roomId);
    socket.currentRoomId = null;

    if (updatedRoom === null) {
      // La sala se eliminó porque quedó vacía
      if (!isDisconnect) {
        socket.emit('room:left', {
          message: 'Has abandonado la sala. La sala se eliminó porque quedó vacía.',
          room: null,
        });
      }
      console.log(`[Room] Sala ${roomId} eliminada (quedó vacía)`);
      return;
    }

    // Notificar al jugador que salió (si no es desconexión)
    if (!isDisconnect) {
      socket.emit('room:left', {
        message: 'Has abandonado la sala',
        room: updatedRoom,
      });
    }

    // Notificar a los demás jugadores
    io.to(roomId).emit('room:playerLeft', {
      message: `${socket.username} ha abandonado la sala`,
      player: {
        userId: socket.userId,
        username: socket.username,
      },
      room: updatedRoom,
    });

    // Enviar estado actualizado a todos en la sala
    io.to(roomId).emit('room:state', {
      room: updatedRoom,
    });

    console.log(`[Room] Usuario ${socket.username} (${socket.userId}) salió de la sala ${roomId}`);
  } catch (error) {
    console.error('[Room] Error al manejar salida de sala:', error);
  }
}

module.exports = {
  setupRoomHandlers,
};
