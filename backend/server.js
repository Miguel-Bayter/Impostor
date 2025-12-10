/**
 * Servidor principal del juego Impostor multijugador
 * Fase 1: Configuración inicial
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend (opcional - el frontend puede correr independientemente)
// Descomentar si quieres servir el frontend desde el backend:
// app.use(express.static(path.join(__dirname, '../frontend')));
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/index.html'));
// });

// Almacenamiento temporal de salas (en producción usar Redis/DB)
// TODO: Migrar a base de datos en fases posteriores
const rooms = new Map();

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Evento de prueba de conexión
  socket.on('ping', () => {
    socket.emit('pong', { message: 'Servidor activo', timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Rutas API básicas (para futuras fases)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
});

