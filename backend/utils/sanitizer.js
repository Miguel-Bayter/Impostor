/**
 * Utilidades de Sanitización de Inputs
 * Fase 7: Seguridad
 *
 * Proporciona funciones para sanitizar y validar inputs del usuario
 * para prevenir XSS, inyección de código y otros ataques.
 */

const validator = require('validator');

/**
 * Configuraciones de límites
 */
const LIMITS = {
  CLUE_MAX_LENGTH: 50,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 100,
  ROOM_NAME_MAX_LENGTH: 50,
};

/**
 * Sanitiza una pista del juego
 * - Escapa HTML para prevenir XSS
 * - Limita longitud
 * - Normaliza espacios
 * - Mantiene caracteres especiales válidos (acentos, etc.)
 *
 * @param {string} clue - La pista a sanitizar
 * @returns {string} Pista sanitizada
 */
function sanitizeClue(clue) {
  if (!clue || typeof clue !== 'string') {
    return '';
  }

  // Trim espacios al inicio y final
  let sanitized = clue.trim();

  // Limitar longitud
  if (sanitized.length > LIMITS.CLUE_MAX_LENGTH) {
    sanitized = sanitized.substring(0, LIMITS.CLUE_MAX_LENGTH);
  }

  // Escapar HTML para prevenir XSS
  sanitized = validator.escape(sanitized);

  // Normalizar espacios múltiples a uno solo
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

/**
 * Sanitiza un nombre de usuario
 * - Escapa HTML para prevenir XSS
 * - Valida caracteres permitidos (letras, números, guiones, guiones bajos)
 * - Limita longitud
 *
 * @param {string} username - El nombre de usuario a sanitizar
 * @returns {string} Nombre de usuario sanitizado
 */
function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') {
    return '';
  }

  // Trim espacios
  let sanitized = username.trim();

  // Limitar longitud
  if (sanitized.length > LIMITS.USERNAME_MAX_LENGTH) {
    sanitized = sanitized.substring(0, LIMITS.USERNAME_MAX_LENGTH);
  }

  // Escapar HTML para prevenir XSS
  sanitized = validator.escape(sanitized);

  // Remover caracteres no permitidos (solo letras, números, guiones, guiones bajos, espacios)
  // Permitimos espacios pero los normalizamos después
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\sáéíóúÁÉÍÓÚñÑüÜ]/g, '');

  // Normalizar espacios múltiples a uno solo
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

/**
 * Sanitiza un email
 * - Valida formato de email
 * - Normaliza a lowercase
 * - Limita longitud
 *
 * @param {string} email - El email a sanitizar
 * @returns {string|null} Email sanitizado o null si es inválido
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Trim y normalizar a lowercase
  let sanitized = email.toLowerCase().trim();

  // Limitar longitud
  if (sanitized.length > LIMITS.EMAIL_MAX_LENGTH) {
    sanitized = sanitized.substring(0, LIMITS.EMAIL_MAX_LENGTH);
  }

  // Validar formato de email
  if (!validator.isEmail(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitiza un string genérico
 * - Escapa HTML para prevenir XSS
 * - Limita longitud
 * - Normaliza espacios
 *
 * @param {string} input - El string a sanitizar
 * @param {number} maxLength - Longitud máxima (opcional, default: 100)
 * @returns {string} String sanitizado
 */
function sanitizeString(input, maxLength = 100) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim espacios
  let sanitized = input.trim();

  // Limitar longitud
  if (maxLength > 0 && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Escapar HTML para prevenir XSS
  sanitized = validator.escape(sanitized);

  // Normalizar espacios múltiples a uno solo
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

/**
 * Sanitiza un nombre de sala
 * - Escapa HTML para prevenir XSS
 * - Limita longitud
 * - Normaliza espacios
 *
 * @param {string} roomName - El nombre de la sala a sanitizar
 * @returns {string} Nombre de sala sanitizado
 */
function sanitizeRoomName(roomName) {
  return sanitizeString(roomName, LIMITS.ROOM_NAME_MAX_LENGTH);
}

/**
 * Valida que un string no esté vacío después de sanitizar
 *
 * @param {string} input - El string a validar
 * @returns {boolean} true si el string es válido y no está vacío
 */
function isValidAfterSanitization(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return input.trim().length > 0;
}

module.exports = {
  sanitizeClue,
  sanitizeUsername,
  sanitizeEmail,
  sanitizeString,
  sanitizeRoomName,
  isValidAfterSanitization,
  LIMITS,
};
