/**
 * Modelo de Usuario - Almacenamiento en Memoria
 * Fase 2: Autenticación
 * 
 * NOTA: Este modelo usa almacenamiento en memoria (Map) para desarrollo.
 * En producción, migrar a base de datos (MongoDB/PostgreSQL).
 */

const bcrypt = require('bcrypt');

class User {
  constructor() {
    // Almacenamiento en memoria: Map<userId, userObject>
    this.usersById = new Map();
    // Índice por email para búsquedas rápidas: Map<email, userId>
    this.usersByEmail = new Map();
    // Contador para IDs únicos
    this.nextId = 1;
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
    // Validar datos
    const validation = this.validateUserData(username, email, password);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Normalizar email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

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

    // Crear usuario
    const userId = this.nextId++;
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
    const normalizedEmail = email.toLowerCase().trim();
    const userId = this.usersByEmail.get(normalizedEmail);
    
    if (!userId) {
      return null;
    }

    return this.usersById.get(userId);
  }

  /**
   * Buscar usuario por ID
   * @param {number} userId - ID del usuario
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
    this.nextId = 1;
  }
}

// Exportar instancia singleton
module.exports = new User();

