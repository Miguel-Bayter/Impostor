const redisClient = require('../db/redis');

/**
 * Configuraciones de rate limit por tipo de evento
 */
const RATE_LIMIT_CONFIGS = {
  // Eventos de juego
  'game:submitClue': {
    maxRequests: 1, // 1 pista por ventana
    windowMs: 2 * 1000, // 2 segundos
  },
  'game:submitVote': {
    maxRequests: 1, // 1 voto por ventana
    windowMs: 5 * 1000, // 5 segundos
  },
  'game:start': {
    maxRequests: 1,
    windowMs: 10 * 1000, // 10 segundos
  },
  'game:startNewRound': {
    maxRequests: 1,
    windowMs: 10 * 1000, // 10 segundos
  },
  'game:getState': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests por minuto
  },

  // Eventos de salas
  'room:join': {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 uniones por minuto
  },
  'room:leave': {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 salidas por minuto
  },
  'room:state': {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 requests por minuto
  },

  // Eventos de autenticación
  'auth:register': {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  'auth:login': {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
};

/**
 * Verificar si un evento está permitido según el rate limit
 *
 * @param {string} userId - ID del usuario
 * @param {string} eventType - Tipo de evento (ej: 'game:submitClue')
 * @returns {Promise<Object>} { allowed: boolean, remaining: number, resetTime: number }
 */
async function checkRateLimit(userId, eventType) {
  const config = RATE_LIMIT_CONFIGS[eventType];

  if (!config) {
    return {
      allowed: true,
      remaining: Infinity,
      resetTime: null,
    };
  }

  const now = Date.now();
  const key = `rate-limit:${userId}:${eventType}`;
  const windowMs = config.windowMs;

  const multi = redisClient.multi();
  multi.incr(key);
  multi.pexpire(key, windowMs);
  multi.pttl(key);

  const [countResult, _, pttlResult] = await multi.exec();

  // multi.exec() returns an array of results, e.g., [[null, 1], [null, 1], [null, 20000]]
  const count = countResult[1];
  const pttl = pttlResult[1];

  const resetTime = now + pttl;

  if (count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: resetTime,
      retryAfter: Math.ceil(pttl / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - count,
    resetTime: resetTime,
  };
}

/**
 * Middleware para aplicar rate limiting a eventos WebSocket
 *
 * @param {string} eventType - Tipo de evento a verificar
 * @returns {Function} Middleware function
 */
function socketRateLimiter(eventType) {
  return async (socket, data, next) => {
    const userId = socket.userId;

    if (!userId) {
      return next();
    }

    const result = await checkRateLimit(userId, eventType);

    if (!result.allowed) {
      socket.emit('rateLimitExceeded', {
        error: 'Rate limit excedido',
        message: `Has excedido el límite de ${eventType}. Intenta nuevamente en ${result.retryAfter} segundos.`,
        eventType: eventType,
        retryAfter: result.retryAfter,
      });

      console.warn(
        `[RateLimit] Usuario ${userId} (${socket.username}) excedió rate limit para ${eventType}`,
      );
      return;
    }

    next();
  };
}

/**
 * Obtener estadísticas de rate limit para un usuario (útil para debugging)
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas de rate limit
 */
async function getRateLimitStats(userId) {
    const keys = await redisClient.keys(`rate-limit:${userId}:*`);
    if (!keys.length) {
      return { events: {} };
    }
  
    const stats = {};
    const now = Date.now();
  
    for (const key of keys) {
      const eventType = key.split(':')[2];
      const config = RATE_LIMIT_CONFIGS[eventType];
      if (config) {
        const count = await redisClient.get(key);
        const pttl = await redisClient.pttl(key);
        const resetTime = now + pttl;
  
        stats[eventType] = {
          count: parseInt(count, 10),
          maxRequests: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - parseInt(count, 10)),
          resetTime: resetTime,
          resetIn: Math.max(0, Math.ceil(pttl / 1000)),
        };
      }
    }
  
    return { events: stats };
  }
  
  /**
   * Limpiar rate limits para un usuario (útil para testing o reset manual)
   *
   * @param {string} userId - ID del usuario
   */
  async function clearRateLimit(userId) {
    const keys = await redisClient.keys(`rate-limit:${userId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
  
  /**
   * Limpiar todos los rate limits (útil para testing)
   */
  async function clearAllRateLimits() {
    const keys = await redisClient.keys('rate-limit:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }

  module.exports = {
    checkRateLimit,
    socketRateLimiter,
    getRateLimitStats,
    clearRateLimit,
    clearAllRateLimits,
    RATE_LIMIT_CONFIGS,
  };

