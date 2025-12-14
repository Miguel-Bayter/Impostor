/**
 * Rate Limiter para WebSockets
 * Fase 7: Seguridad
 *
 * Implementa rate limiting para eventos WebSocket usando ventana deslizante
 * por usuario (userId) en lugar de por IP.
 *
 * En producción, esto podría migrarse a Redis para escalabilidad.
 */

/**
 * Estructura de datos para tracking de rate limits
 * Map<userId, Map<eventType, { count: number, resetTime: number }>>
 */
const rateLimitStore = new Map();

/**
 * Limpiar entradas expiradas periódicamente (cada 5 minutos)
 */
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos

setInterval(() => {
  const now = Date.now();
  for (const [userId, events] of rateLimitStore.entries()) {
    for (const [eventType, data] of events.entries()) {
      if (now > data.resetTime) {
        events.delete(eventType);
      }
    }
    if (events.size === 0) {
      rateLimitStore.delete(userId);
    }
  }
}, CLEANUP_INTERVAL);

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
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(userId, eventType) {
  const config = RATE_LIMIT_CONFIGS[eventType];

  // Si no hay configuración para este evento, permitirlo
  if (!config) {
    return {
      allowed: true,
      remaining: Infinity,
      resetTime: null,
    };
  }

  const now = Date.now();

  // Obtener o crear entrada para el usuario
  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, new Map());
  }

  const userEvents = rateLimitStore.get(userId);

  // Obtener o crear entrada para el tipo de evento
  if (!userEvents.has(eventType)) {
    userEvents.set(eventType, {
      count: 0,
      resetTime: now + config.windowMs,
    });
  }

  const eventData = userEvents.get(eventType);

  // Si la ventana expiró, resetear
  if (now > eventData.resetTime) {
    eventData.count = 0;
    eventData.resetTime = now + config.windowMs;
  }

  // Verificar si excede el límite
  if (eventData.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: eventData.resetTime,
      retryAfter: Math.ceil((eventData.resetTime - now) / 1000), // segundos hasta reset
    };
  }

  // Incrementar contador
  eventData.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - eventData.count,
    resetTime: eventData.resetTime,
  };
}

/**
 * Middleware para aplicar rate limiting a eventos WebSocket
 *
 * @param {string} eventType - Tipo de evento a verificar
 * @returns {Function} Middleware function
 */
function socketRateLimiter(eventType) {
  return (socket, data, next) => {
    const userId = socket.userId;

    if (!userId) {
      // Si no hay userId, no aplicar rate limiting (debería ser raro)
      return next();
    }

    const result = checkRateLimit(userId, eventType);

    if (!result.allowed) {
      // Emitir error al cliente
      socket.emit('rateLimitExceeded', {
        error: 'Rate limit excedido',
        message: `Has excedido el límite de ${eventType}. Intenta nuevamente en ${result.retryAfter} segundos.`,
        eventType: eventType,
        retryAfter: result.retryAfter,
      });

      // Log para monitoreo
      console.warn(
        `[RateLimit] Usuario ${userId} (${socket.username}) excedió rate limit para ${eventType}`,
      );

      // No llamar next() para detener el procesamiento del evento
      return;
    }

    // Permitir el evento
    next();
  };
}

/**
 * Obtener estadísticas de rate limit para un usuario (útil para debugging)
 *
 * @param {string} userId - ID del usuario
 * @returns {Object} Estadísticas de rate limit
 */
function getRateLimitStats(userId) {
  const userEvents = rateLimitStore.get(userId);
  if (!userEvents) {
    return { events: {} };
  }

  const stats = {};
  const now = Date.now();

  for (const [eventType, data] of userEvents.entries()) {
    const config = RATE_LIMIT_CONFIGS[eventType];
    if (config) {
      stats[eventType] = {
        count: data.count,
        maxRequests: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - data.count),
        resetTime: data.resetTime,
        resetIn: Math.max(0, Math.ceil((data.resetTime - now) / 1000)),
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
function clearRateLimit(userId) {
  rateLimitStore.delete(userId);
}

/**
 * Limpiar todos los rate limits (útil para testing)
 */
function clearAllRateLimits() {
  rateLimitStore.clear();
}

module.exports = {
  checkRateLimit,
  socketRateLimiter,
  getRateLimitStats,
  clearRateLimit,
  clearAllRateLimits,
  RATE_LIMIT_CONFIGS,
};
