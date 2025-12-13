/**
 * Middleware de Rate Limiting para API REST
 * Fase 7: Seguridad
 * 
 * Proporciona diferentes límites de rate limiting para diferentes rutas
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter para autenticación (más estricto)
 * Previene ataques de fuerza bruta en login/registro
 * 
 * Configuración:
 * - 5 intentos por 15 minutos por IP
 * - Mensaje de error personalizado
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por ventana
  message: {
    error: 'Demasiados intentos',
    message: 'Has excedido el límite de intentos. Por favor, espera 15 minutos antes de intentar nuevamente.'
  },
  standardHeaders: true, // Retorna información de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Desactiva headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Contar todos los requests, incluso los exitosos
  skipFailedRequests: false // Contar también los requests fallidos
});

/**
 * Rate limiter para rutas de salas (moderado)
 * Previene spam en creación/unión de salas
 * 
 * Configuración:
 * - 20 requests por minuto por IP
 */
const roomsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 requests por minuto
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Por favor, espera un momento antes de intentar nuevamente.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate limiter general para otras rutas API
 * 
 * Configuración:
 * - 100 requests por 15 minutos por IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Por favor, espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  roomsLimiter,
  generalLimiter
};
