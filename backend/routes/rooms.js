/**
 * Rutas de Salas
 * Fase 3: Sistema de Salas
 * 
 * Endpoints:
 * - POST /api/rooms/create - Crear nueva sala (requiere auth)
 * - POST /api/rooms/join - Unirse a sala existente (requiere auth)
 * - GET /api/rooms/:roomId - Obtener información de sala
 * - GET /api/rooms - Listar salas disponibles
 * - POST /api/rooms/:roomId/leave - Abandonar sala (requiere auth)
 */

const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/rooms/create
 * Crear nueva sala
 * Requiere autenticación
 * 
 * Body:
 * {
 *   "name": "Mi Sala" (opcional),
 *   "minPlayers": 3 (opcional, default: 3),
 *   "maxPlayers": 8 (opcional, default: 8),
 *   "numImpostors": 1 (opcional, default: 1)
 * }
 */
router.post('/create', authenticateToken, (req, res) => {
  try {
    const { name, minPlayers, maxPlayers, numImpostors } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    // Crear sala
    const room = Room.create(userId, username, {
      name,
      minPlayers,
      maxPlayers,
      numImpostors
    });

    res.status(201).json({
      message: 'Sala creada exitosamente',
      room: room
    });
  } catch (error) {
    // Error de validación
    if (error.message.includes('debe ser') || error.message.includes('no puede')) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }

    // Error inesperado
    console.error('Error al crear sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear la sala'
    });
  }
});

/**
 * POST /api/rooms/join
 * Unirse a sala existente
 * Requiere autenticación
 * 
 * Body:
 * {
 *   "roomId": "ABC123"
 * }
 */
router.post('/join', authenticateToken, (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({
        error: 'Room ID requerido',
        message: 'Envía el roomId en el body: { "roomId": "..." }'
      });
    }

    // Verificar que la sala existe
    const room = Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        message: 'La sala especificada no existe'
      });
    }

    // Verificar que no esté llena
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({
        error: 'Sala llena',
        message: 'La sala ha alcanzado el máximo de jugadores'
      });
    }

    // Verificar que no esté en progreso
    if (room.status !== 'waiting') {
      return res.status(400).json({
        error: 'Sala no disponible',
        message: 'La sala no está esperando jugadores'
      });
    }

    // Verificar que el usuario no esté ya en la sala
    if (Room.isPlayerInRoom(roomId, userId)) {
      return res.status(400).json({
        error: 'Ya estás en esta sala',
        message: 'No puedes unirte a una sala en la que ya estás'
      });
    }

    // Retornar información de la sala (el usuario se unirá por WebSocket)
    res.json({
      message: 'Puedes unirte a esta sala',
      room: room
    });
  } catch (error) {
    console.error('Error al unirse a sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo unir a la sala'
    });
  }
});

/**
 * GET /api/rooms/:roomId
 * Obtener información de sala
 * No requiere autenticación (público)
 */
router.get('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;

    const room = Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        message: 'La sala especificada no existe'
      });
    }

    res.json({
      room: room
    });
  } catch (error) {
    console.error('Error al obtener sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información de la sala'
    });
  }
});

/**
 * GET /api/rooms
 * Listar salas disponibles
 * No requiere autenticación (público)
 */
router.get('/', (req, res) => {
  try {
    const availableRooms = Room.getAvailableRooms();

    res.json({
      rooms: availableRooms,
      count: availableRooms.length
    });
  } catch (error) {
    console.error('Error al listar salas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron listar las salas'
    });
  }
});

/**
 * POST /api/rooms/:roomId/leave
 * Abandonar sala
 * Requiere autenticación
 */
router.post('/:roomId/leave', authenticateToken, (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Verificar que la sala existe
    const room = Room.getRoomInternal(roomId);
    
    if (!room) {
      return res.status(404).json({
        error: 'Sala no encontrada',
        message: 'La sala especificada no existe'
      });
    }

    // Verificar que el usuario está en la sala
    if (!Room.isPlayerInRoom(roomId, userId)) {
      return res.status(400).json({
        error: 'No estás en esta sala',
        message: 'No puedes abandonar una sala en la que no estás'
      });
    }

    // Remover jugador
    const updatedRoom = Room.removePlayer(roomId, userId);

    if (updatedRoom === null) {
      // La sala se eliminó porque quedó vacía
      return res.json({
        message: 'Has abandonado la sala. La sala se eliminó porque quedó vacía.',
        room: null
      });
    }

    res.json({
      message: 'Has abandonado la sala',
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error al abandonar sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo abandonar la sala'
    });
  }
});

module.exports = router;

