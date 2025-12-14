/**
 * Utilidades JWT - Generación y Verificación de Tokens
 * Fase 2: Autenticación
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.trim().length === 0) {
  throw new Error(
    'JWT_SECRET requerido. Configura la variable de entorno JWT_SECRET antes de iniciar el servidor.',
  );
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generar token JWT para un usuario
 * @param {string} userId - ID del usuario (UUID)
 * @param {string} username - Nombre de usuario
 * @returns {string} Token JWT
 */
function generateToken(userId, username) {
  const payload = {
    userId: userId,
    username: username,
    iat: Math.floor(Date.now() / 1000), // Issued at
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verificar y decodificar token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object|null} Payload decodificado o null si es inválido
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    // Token inválido, expirado, o mal formado
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    } else {
      throw new Error('Error al verificar token');
    }
  }
}

/**
 * Extraer token del header Authorization
 * @param {string} authHeader - Header Authorization (formato: "Bearer <token>")
 * @returns {string|null} Token extraído o null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
};
