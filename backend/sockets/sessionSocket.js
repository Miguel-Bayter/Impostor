
const redisClient = require('../db/redis');

const USER_SOCKET_MAP_KEY = 'user-socket-map';

/**
 * Asocia un userId con un socketId en Redis.
 * @param {string} userId - El ID del usuario.
 * @param {string} socketId - El ID del socket.
 */
async function setUserSocket(userId, socketId) {
  await redisClient.hset(USER_SOCKET_MAP_KEY, userId, socketId);
}

/**
 * Obtiene el socketId asociado a un userId.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<string|null>} - El ID del socket o null si no se encuentra.
 */
async function getUserSocket(userId) {
  return await redisClient.hget(USER_SOCKET_MAP_KEY, userId);
}

/**
 * Elimina la asociación de un userId.
 * @param {string} userId - El ID del usuario.
 */
async function removeUserSocket(userId) {
  await redisClient.hdel(USER_SOCKET_MAP_KEY, userId);
}

/**
 * Middleware para gestionar la sesión del socket.
 * @param {import('socket.io').Socket} socket - El socket del cliente.
 * @param {Function} next - La función para pasar al siguiente middleware.
 */
async function sessionSocket(socket, next) {
    if (socket.userId) {
        await setUserSocket(socket.userId, socket.id);
    
        socket.on('disconnect', async () => {
          // Eliminar la asociación solo si el socketId no ha cambiado (evita race conditions)
          const currentSocketId = await getUserSocket(socket.userId);
          if (currentSocketId === socket.id) {
            await removeUserSocket(socket.userId);
          }
        });
      }
      next();
}

module.exports = {
    setUserSocket,
    getUserSocket,
    removeUserSocket,
    sessionSocket,
};
