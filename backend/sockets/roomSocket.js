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
const { checkRateLimit } = require('../utils/socketRateLimiter');

/**
 * Configurar handlers de salas para WebSocket
 * @param {Object} io - Instancia de Socket.io
 */
function setupRoomHandlers(io) {
  io.on('connection', (socket) => {
    console.log(
      `[Room] Usuario conectado: ${socket.id} (Usuario ID: ${socket.userId}, Username: ${socket.username})`,
    );

    // Almacenar la sala actual del socket
    socket.currentRoomId = null;

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
     * Remover jugador de la sala si estaba en una
     */
    socket.on('disconnect', async () => {
      if (socket.currentRoomId) {
        await Room.updatePlayerSocket(socket.currentRoomId, socket.userId, null);
      }
      console.log(`[Room] Usuario desconectado: ${socket.id} (Usuario ID: ${socket.userId})`);
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
