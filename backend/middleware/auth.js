/**
 * Middleware de Autenticación JWT
 * Fase 2: Autenticación
 *
 * Proporciona middleware para proteger rutas HTTP y conexiones WebSocket
 */

const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware para autenticar rutas HTTP
 * Extrae y valida el token JWT del header Authorization
 * Adjunta el usuario autenticado a req.user
 */
function authenticateToken(req, res, next) {
  // Extraer token del header Authorization
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      error: 'Token de autenticación requerido',
      message: 'Incluye el token en el header: Authorization: Bearer <token>',
    });
  }

  try {
    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuario en la base de datos
    const user = User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El token es válido pero el usuario no existe',
      });
    }

    // Adjuntar información del usuario a la request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: error.message,
    });
  }
}

/**
 * Middleware para autenticar conexiones WebSocket
 * Valida el token JWT enviado en el handshake
 * Adjunta el userId a socket.userId
 *
 * @param {Object} socket - Socket de Socket.io
 * @param {Function} next - Función next de Socket.io
 */
function authenticateSocket(socket, next) {
  // El token puede venir en:
  // 1. socket.handshake.auth.token (recomendado)
  // 2. socket.handshake.headers.authorization (como fallback)

  let token = socket.handshake.auth?.token;

  // Fallback: intentar extraer del header Authorization
  if (!token) {
    const authHeader = socket.handshake.headers?.authorization;
    token = extractTokenFromHeader(authHeader);
  }

  if (!token) {
    return next(new Error('Token de autenticación requerido'));
  }

  try {
    // Verificar token
    const decoded = verifyToken(token);

    // Verificar que el usuario existe
    const user = User.findById(decoded.userId);

    if (!user) {
      return next(new Error('Usuario no encontrado'));
    }

    // Adjuntar información del usuario al socket
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    return next(new Error(`Autenticación fallida: ${error.message}`));
  }
}

/**
 * Middleware opcional: verificar si el usuario está autenticado
 * No falla si no hay token, solo adjunta req.user si existe
 * Útil para rutas que pueden ser públicas o privadas
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = User.findById(decoded.userId);

    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
}

module.exports = {
  authenticateToken,
  authenticateSocket,
  optionalAuth,
};
