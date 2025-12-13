/**
 * Servidor principal del juego Impostor multijugador
 * Fase 1: Configuración inicial
 * Fase 2: Autenticación
 * Fase 3: Sistema de Salas
 * Fase 4: Lógica del Juego
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar rutas y middleware
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const { authenticateSocket } = require('./middleware/auth');
const { setupRoomHandlers } = require('./sockets/roomSocket');
const { setupGameHandlers } = require('./sockets/gameSocket');

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

// Namespace de autenticación (sin middleware, permite registro/login)
const authNamespace = io.of('/auth');
const User = require('./models/User');
const { generateToken } = require('./utils/jwt');

// Handlers de autenticación por WebSocket
authNamespace.on('connection', (socket) => {
  console.log(`Conexión de autenticación: ${socket.id}`);

  /**
   * Evento: auth:register
   * Registro de nuevo usuario por WebSocket
   * 
   * Data esperada:
   * {
   *   username: "nombre_usuario",
   *   email: "usuario@ejemplo.com",
   *   password: "contraseña123"
   * }
   */
  socket.on('auth:register', async (data) => {
    try {
      const { username, email, password } = data;

      // Validar campos requeridos
      if (!username || !email || !password) {
        return socket.emit('auth:error', {
          error: 'Campos requeridos faltantes',
          message: 'Se requieren: username, email, password'
        });
      }

      // Crear usuario
      const user = await User.create(username, email, password);

      // Generar token JWT
      const token = generateToken(user.id, user.username);

      // Respuesta exitosa
      socket.emit('auth:register:success', {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        },
        token: token
      });
    } catch (error) {
      // Error de validación o usuario duplicado
      socket.emit('auth:error', {
        error: error.message.includes('ya está') || error.message.includes('debe tener') 
          ? 'Error de validación' 
          : 'Error interno',
        message: error.message
      });
    }
  });

  /**
   * Evento: auth:login
   * Inicio de sesión por WebSocket
   * 
   * Data esperada:
   * {
   *   email: "usuario@ejemplo.com",
   *   password: "contraseña123"
   * }
   */
  socket.on('auth:login', async (data) => {
    try {
      const { email, password } = data;

      // Validar campos requeridos
      if (!email || !password) {
        return socket.emit('auth:error', {
          error: 'Campos requeridos faltantes',
          message: 'Se requieren: email, password'
        });
      }

      // Buscar usuario por email
      const user = User.findByEmail(email);

      if (!user) {
        return socket.emit('auth:error', {
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await User.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return socket.emit('auth:error', {
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos'
        });
      }

      // Generar token JWT
      const token = generateToken(user.id, user.username);

      // Respuesta exitosa
      socket.emit('auth:login:success', {
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        },
        token: token
      });
    } catch (error) {
      socket.emit('auth:error', {
        error: 'Error interno',
        message: 'No se pudo iniciar sesión'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Conexión de autenticación desconectada: ${socket.id}`);
  });
});

// Namespace principal (requiere autenticación)
// Aplicar middleware de autenticación a WebSockets
// Esto valida el token antes de permitir la conexión
io.use(authenticateSocket);

// Configurar handlers de WebSocket para salas
setupRoomHandlers(io);

// Configurar handlers de WebSocket para juego
setupGameHandlers(io);

// WebSocket connection (solo se ejecuta si la autenticación es exitosa)
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id} (Usuario ID: ${socket.userId}, Username: ${socket.username})`);

  // Evento de prueba de conexión
  socket.on('ping', () => {
    socket.emit('pong', { 
      message: 'Servidor activo', 
      timestamp: Date.now(),
      userId: socket.userId,
      username: socket.username
    });
  });

  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id} (Usuario ID: ${socket.userId})`);
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Rutas API básicas
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

