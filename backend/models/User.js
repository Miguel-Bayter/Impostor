/**
 * Modelo de Usuario - Almacenamiento en Memoria
 * Fase 2: Autenticación
 * 
 * NOTA: Este modelo usa almacenamiento en memoria (Map) para desarrollo.
 * En producción, migrar a base de datos (MongoDB/PostgreSQL).
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { sanitizeUsername, sanitizeEmail } = require('../utils/sanitizer');

class User {
  constructor() {
    // Almacenamiento en memoria: Map<userId, userObject>
    this.usersById = new Map();
    // Índice por email para búsquedas rápidas: Map<email, userId>
    this.usersByEmail = new Map();
  }

  /**
   * Validar formato de email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar datos de usuario
   */
  validateUserData(username, email, password) {
    const errors = [];

    if (!username || username.trim().length < 3) {
      errors.push('El nombre de usuario debe tener al menos 3 caracteres');
    }

    if (!email || !this.isValidEmail(email)) {
      errors.push('El email no es válido');
    }

    if (!password || password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crear un nuevo usuario
   * @param {string} username - Nombre de usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<Object>} Usuario creado (sin passwordHash)
   */
  async create(username, email, password) {
    // Sanitizar inputs primero (antes de validar)
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedEmail = sanitizeEmail(email);

    // Validar que los inputs sanitizados son válidos
    if (!sanitizedUsername || sanitizedUsername.trim().length === 0) {
      throw new Error('El nombre de usuario contiene caracteres no permitidos o está vacío');
    }

    if (!sanitizedEmail) {
      throw new Error('El formato del email no es válido');
    }

    // Validar datos (usar datos sanitizados)
    const validation = this.validateUserData(sanitizedUsername, sanitizedEmail, password);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Normalizar email (ya está en lowercase por sanitizeEmail)
    const normalizedEmail = sanitizedEmail;
    const normalizedUsername = sanitizedUsername;

    // Verificar que el email no exista
    if (this.usersByEmail.has(normalizedEmail)) {
      throw new Error('El email ya está registrado');
    }

    // Verificar que el username no exista
    for (const user of this.usersById.values()) {
      if (user.username.toLowerCase() === normalizedUsername.toLowerCase()) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    // Hashear contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario con UUID
    const userId = uuidv4();
    const user = {
      id: userId,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString()
    };

    // Guardar en memoria
    this.usersById.set(userId, user);
    this.usersByEmail.set(normalizedEmail, userId);

    // Retornar usuario sin passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Object|null} Usuario encontrado (con passwordHash para verificación)
   */
  findByEmail(email) {
    // Sanitizar email antes de buscar
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return null;
    }

    const userId = this.usersByEmail.get(sanitizedEmail);
    
    if (!userId) {
      return null;
    }

    return this.usersById.get(userId);
  }

  /**
   * Buscar usuario por ID
   * @param {string} userId - ID del usuario (UUID)
   * @returns {Object|null} Usuario encontrado (sin passwordHash)
   */
  findById(userId) {
    const user = this.usersById.get(userId);
    
    if (!user) {
      return null;
    }

    // Retornar sin passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Verificar contraseña
   * @param {string} password - Contraseña en texto plano
   * @param {string} passwordHash - Hash almacenado
   * @returns {Promise<boolean>} true si la contraseña es correcta
   */
  async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  /**
   * Obtener todos los usuarios (útil para debugging, remover en producción)
   * @returns {Array} Lista de usuarios sin passwordHash
   */
  getAll() {
    return Array.from(this.usersById.values()).map(user => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Limpiar todos los usuarios (útil para testing)
   */
  clear() {
    this.usersById.clear();
    this.usersByEmail.clear();
  }
}

// Exportar instancia singleton
module.exports = new User();

