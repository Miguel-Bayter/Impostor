/**
 * Modelo de Sala - Almacenamiento en Memoria
 * Fase 3: Sistema de Salas
 *
 * NOTA: Este modelo usa almacenamiento en memoria (Map) para desarrollo.
 * En producción, migrar a base de datos (MongoDB/PostgreSQL).
 */

const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const RoomDoc = require('../schemas/Room');

class Room {
  constructor() {
    // Almacenamiento en memoria: Map<roomId, roomObject>
    this.roomsById = new Map();
  }

  isDbReady() {
    return mongoose?.connection?.readyState === 1;
  }

  /**
   * Validar configuración de sala
   */
  validateRoomSettings(settings = {}) {
    const errors = [];
    const minPlayers = settings.minPlayers || 3;
    const maxPlayers = settings.maxPlayers || 8;
    const numImpostors = settings.numImpostors || 1;

    if (minPlayers < 3) {
      errors.push('El mínimo de jugadores debe ser al menos 3');
    }

    if (maxPlayers > 12) {
      errors.push('El máximo de jugadores no puede ser mayor a 12');
    }

    if (minPlayers > maxPlayers) {
      errors.push('El mínimo de jugadores no puede ser mayor al máximo');
    }

    if (numImpostors < 1) {
      errors.push('Debe haber al menos 1 impostor');
    }

    if (numImpostors >= minPlayers) {
      errors.push('El número de impostores debe ser menor al mínimo de jugadores');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Crear una nueva sala
   * @param {string} hostId - ID del usuario que crea la sala (UUID)
   * @param {string} hostUsername - Username del host
   * @param {Object} options - Opciones de configuración
   * @returns {Object} Sala creada
   */
  async create(hostId, hostUsername, options = {}) {
    // Validar configuración
    const settings = {
      minPlayers: options.minPlayers || 3,
      maxPlayers: options.maxPlayers || 8,
      numImpostors: options.numImpostors || 1,
    };

    const validation = this.validateRoomSettings(settings);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Generar ID único con UUID
    const roomId = uuidv4();

    // Crear sala
    const now = new Date().toISOString();
    const room = {
      id: roomId,
      hostId: hostId,
      name: options.name || `Sala de ${hostUsername}`,
      status: 'waiting', // waiting | starting | in_progress | finished
      maxPlayers: settings.maxPlayers,
      players: [
        {
          userId: hostId,
          username: hostUsername,
          socketId: null, // Se asignará cuando se conecte por WebSocket
          joinedAt: now,
          isHost: true,
        },
      ],
      settings: {
        minPlayers: settings.minPlayers,
        numImpostors: settings.numImpostors,
      },
      createdAt: now,
      updatedAt: now,
    };

    if (this.isDbReady()) {
      const doc = new RoomDoc({
        _id: roomId,
        hostId: hostId,
        name: room.name,
        status: room.status,
        maxPlayers: room.maxPlayers,
        players: room.players,
        settings: room.settings,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      });

      await doc.save();
      return this.sanitizeRoom(doc.toObject());
    }

    // Guardar en memoria
    this.roomsById.set(roomId, room);

    // Retornar sala sin información sensible
    return this.sanitizeRoom(room);
  }

  /**
   * Buscar sala por ID
   * @param {string} roomId - ID de la sala
   * @returns {Object|null} Sala encontrada (sanitizada)
   */
  async findById(roomId) {
    if (this.isDbReady()) {
      const room = await RoomDoc.findById(roomId).lean();
      if (!room) return null;
      return this.sanitizeRoom(room);
    }

    const room = this.roomsById.get(roomId);

    if (!room) {
      return null;
    }

    return this.sanitizeRoom(room);
  }

  /**
   * Obtener sala completa (con información interna)
   * @param {string} roomId - ID de la sala
   * @returns {Object|null} Sala encontrada (sin sanitizar)
   */
  async getRoomInternal(roomId) {
    if (this.isDbReady()) {
      const room = await RoomDoc.findById(roomId).lean();
      return room || null;
    }

    return this.roomsById.get(roomId) || null;
  }

  /**
   * Agregar jugador a una sala
   * @param {string} roomId - ID de la sala (UUID)
   * @param {string} userId - ID del usuario (UUID)
   * @param {string} username - Username del usuario
   * @param {string} socketId - ID del socket WebSocket
   * @returns {Object} Sala actualizada
   */
  async addPlayer(roomId, userId, username, socketId) {
    if (this.isDbReady()) {
      const room = await RoomDoc.findById(roomId);

      if (!room) {
        throw new Error('Sala no encontrada');
      }

      if (room.status !== 'waiting') {
        throw new Error('La sala no está esperando jugadores');
      }

      if (room.players.length >= room.maxPlayers) {
        throw new Error('La sala está llena');
      }

      const existingPlayer = room.players.find((p) => p.userId === userId);
      if (existingPlayer) {
        existingPlayer.socketId = socketId;
        room.updatedAt = new Date().toISOString();
        await room.save();
        return this.sanitizeRoom(room.toObject());
      }

      room.players.push({
        userId: userId,
        username: username,
        socketId: socketId,
        joinedAt: new Date().toISOString(),
        isHost: false,
      });

      room.updatedAt = new Date().toISOString();
      await room.save();

      return this.sanitizeRoom(room.toObject());
    }

    const room = this.roomsById.get(roomId);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    if (room.status !== 'waiting') {
      throw new Error('La sala no está esperando jugadores');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('La sala está llena');
    }

    // Verificar que el jugador no esté ya en la sala
    const existingPlayer = room.players.find((p) => p.userId === userId);
    if (existingPlayer) {
      // Actualizar socketId si ya está en la sala
      existingPlayer.socketId = socketId;
      room.updatedAt = new Date().toISOString();
      return this.sanitizeRoom(room);
    }

    // Agregar nuevo jugador
    room.players.push({
      userId: userId,
      username: username,
      socketId: socketId,
      joinedAt: new Date().toISOString(),
      isHost: false,
    });

    room.updatedAt = new Date().toISOString();

    return this.sanitizeRoom(room);
  }

  /**
   * Remover jugador de una sala
   * @param {string} roomId - ID de la sala (UUID)
   * @param {string} userId - ID del usuario (UUID)
   * @returns {Object|null} Sala actualizada o null si se eliminó
   */
  async removePlayer(roomId, userId) {
    if (this.isDbReady()) {
      const room = await RoomDoc.findById(roomId);
      if (!room) return null;

      room.players = room.players.filter((p) => p.userId !== userId);

      if (room.players.length === 0) {
        await RoomDoc.deleteOne({ _id: roomId });
        return null;
      }

      if (room.hostId === userId && room.players.length > 0) {
        room.hostId = room.players[0].userId;
        room.players[0].isHost = true;
      }

      room.updatedAt = new Date().toISOString();
      await room.save();
      return this.sanitizeRoom(room.toObject());
    }

    const room = this.roomsById.get(roomId);

    if (!room) {
      return null;
    }

    // Remover jugador
    room.players = room.players.filter((p) => p.userId !== userId);

    // Si la sala queda vacía, eliminarla
    if (room.players.length === 0) {
      this.roomsById.delete(roomId);
      return null;
    }

    // Si el host se fue, asignar nuevo host (el primer jugador)
    if (room.hostId === userId && room.players.length > 0) {
      room.hostId = room.players[0].userId;
      room.players[0].isHost = true;
    }

    room.updatedAt = new Date().toISOString();

    return this.sanitizeRoom(room);
  }

  /**
   * Actualizar socketId de un jugador
   * @param {string} roomId - ID de la sala (UUID)
   * @param {string} userId - ID del usuario (UUID)
   * @param {string} socketId - Nuevo socketId
   */
  async updatePlayerSocket(roomId, userId, socketId) {
    if (this.isDbReady()) {
      const room = await RoomDoc.findById(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.userId === userId);
      if (player) {
        player.socketId = socketId;
        room.updatedAt = new Date().toISOString();
        await room.save();
      }
      return;
    }

    const room = this.roomsById.get(roomId);

    if (!room) {
      return;
    }

    const player = room.players.find((p) => p.userId === userId);
    if (player) {
      player.socketId = socketId;
      room.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Actualizar estado de la sala
   * @param {string} roomId - ID de la sala
   * @param {string} status - Nuevo estado
   */
  async updateStatus(roomId, status) {
    const validStatuses = ['waiting', 'starting', 'in_progress', 'finished'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Estado inválido: ${status}`);
    }

    if (this.isDbReady()) {
      const room = await RoomDoc.findById(roomId);
      if (!room) {
        throw new Error('Sala no encontrada');
      }

      room.status = status;
      room.updatedAt = new Date().toISOString();
      await room.save();
      return;
    }

    const room = this.roomsById.get(roomId);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    room.status = status;
    room.updatedAt = new Date().toISOString();
  }

  /**
   * Verificar si un usuario está en una sala
   * @param {string} roomId - ID de la sala (UUID)
   * @param {string} userId - ID del usuario (UUID)
   * @returns {boolean} true si el usuario está en la sala
   */
  async isPlayerInRoom(roomId, userId) {
    if (this.isDbReady()) {
      const room = await RoomDoc.findById(roomId).lean();
      if (!room) return false;
      return room.players.some((p) => p.userId === userId);
    }

    const room = this.roomsById.get(roomId);

    if (!room) {
      return false;
    }

    return room.players.some((p) => p.userId === userId);
  }

  /**
   * Obtener todas las salas (útil para debugging)
   * @returns {Array} Lista de salas sanitizadas
   */
  async getAll() {
    if (this.isDbReady()) {
      const rooms = await RoomDoc.find({}).lean();
      return rooms.map((room) => this.sanitizeRoom(room));
    }

    return Array.from(this.roomsById.values()).map((room) => this.sanitizeRoom(room));
  }

  /**
   * Obtener salas disponibles (waiting)
   * @returns {Array} Lista de salas en espera
   */
  async getAvailableRooms() {
    if (this.isDbReady()) {
      const rooms = await RoomDoc.find({ status: 'waiting' }).lean();
      return rooms
        .filter((room) => room.players.length < room.maxPlayers)
        .map((room) => this.sanitizeRoom(room));
    }

    return Array.from(this.roomsById.values())
      .filter((room) => room.status === 'waiting' && room.players.length < room.maxPlayers)
      .map((room) => this.sanitizeRoom(room));
  }

  /**
   * Eliminar una sala
   * @param {string} roomId - ID de la sala
   * @returns {boolean} true si se eliminó, false si no existía
   */
  async delete(roomId) {
    if (this.isDbReady()) {
      const res = await RoomDoc.deleteOne({ _id: roomId });
      return res.deletedCount > 0;
    }

    return this.roomsById.delete(roomId);
  }

  /**
   * Sanitizar sala (remover información sensible)
   * @param {Object} room - Sala a sanitizar
   * @returns {Object} Sala sanitizada
   */
  sanitizeRoom(room) {
    // Crear copia sin modificar el original
    const sanitized = {
      id: room.id || room._id,
      hostId: room.hostId,
      name: room.name,
      status: room.status,
      maxPlayers: room.maxPlayers,
      players: room.players.map((p) => ({
        userId: p.userId,
        username: p.username,
        joinedAt: p.joinedAt,
        isHost: p.isHost,
        // No incluir socketId en la respuesta
      })),
      settings: { ...room.settings },
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };

    return sanitized;
  }

  /**
   * Limpiar todas las salas (útil para testing)
   */
  async clear() {
    if (this.isDbReady()) {
      await RoomDoc.deleteMany({});
      return;
    }

    this.roomsById.clear();
  }
}

// Exportar instancia singleton
module.exports = new Room();
