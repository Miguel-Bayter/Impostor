/**
 * Servidor principal del juego Impostor multijugador
 * Fase 1: Configuración inicial
 * Fase 2: Autenticación
 * Fase 3: Sistema de Salas
 * Fase 4: Lógica del Juego
 */


const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server: SocketIo } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const redisClient = require('./db/redis');
const connectDB = require('./db/connection');

// Importar rutas y middleware
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const { authenticateSocket } = require('./middleware/auth');
const { setupRoomHandlers } = require('./sockets/roomSocket');

const { setupGameHandlers } = require('./sockets/gameSocket');
const { sessionSocket } = require('./sockets/sessionSocket');
const { authLimiter, roomsLimiter, generalLimiter } = require('./middleware/rateLimiter');
const { generateToken } = require('./utils/jwt');
const { checkRateLimit } = require('./utils/socketRateLimiter');

// Importar modelos (compatibilidad con rutas/sockets)
const User = require('./models/User');

// Verificar variables de entorno requeridas
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'REDIS_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Las siguientes variables de entorno son requeridas: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Conectar a MongoDB
connectDB().catch(err => {
  console.error('Error al conectar a MongoDB:', err);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io con CORS dinámico
const socketIoOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['http://127.0.0.1:5500', 'http://localhost:5500'];

// Configuración de Socket.io
const io = new SocketIo(server, {
  cors: {
    origin: socketIoOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configuración de CORS para desarrollo y producción
const allowedOrigins = socketIoOrigins;

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc.) en desarrollo
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Permitir si el origin está en la lista o si es desarrollo
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  });

app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});


// Servir archivos estáticos del frontend (opcional - el frontend puede correr independientemente)
// Descomentar si quieres servir el frontend desde el backend:
// app.use(express.static(path.join(__dirname, '../frontend')));
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/index.html'));
// });

// Namespace de autenticación (sin middleware, permite registro/login)
const authNamespace = io.of('/auth');

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
    const rateKey = socket.userId || socket.handshake?.address || socket.id;
    const rateLimitResult = await checkRateLimit(rateKey, 'auth:register');
    if (!rateLimitResult.allowed) {
      return socket.emit('auth:error', {
        error: 'Demasiados intentos',
        message: `Has excedido el límite de registro. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
      });
    }
    try {
      const { username, email, password } = data;

      // Validar campos requeridos
      if (!username || !email || !password) {
        return socket.emit('auth:error', {
          error: 'Campos requeridos faltantes',
          message: 'Se requieren: username, email, password',
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
          createdAt: user.createdAt,
        },
        token: token,
      });
    } catch (error) {
      // Error de validación o usuario duplicado
      socket.emit('auth:error', {
        error:
          error.message.includes('ya está') || error.message.includes('debe tener')
            ? 'Error de validación'
            : 'Error interno',
        message: error.message,
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
    const rateKey = socket.userId || socket.handshake?.address || socket.id;
    const rateLimitResult = await checkRateLimit(rateKey, 'auth:login');
    if (!rateLimitResult.allowed) {
      return socket.emit('auth:error', {
        error: 'Demasiados intentos',
        message: `Has excedido el límite de inicio de sesión. Intenta nuevamente en ${rateLimitResult.retryAfter} segundos.`,
      });
    }
    try {
      const { email, password } = data;

      // Validar campos requeridos
      if (!email || !password) {
        return socket.emit('auth:error', {
          error: 'Campos requeridos faltantes',
          message: 'Se requieren: email, password',
        });
      }

      // Buscar usuario por email
      const user = await User.findByEmail(email);

      if (!user) {
        return socket.emit('auth:error', {
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos',
        });
      }

      // Verificar contraseña
      const isPasswordValid = await User.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return socket.emit('auth:error', {
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos',
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
          createdAt: user.createdAt,
        },
        token: token,
      });
    } catch (error) {
      socket.emit('auth:error', {
        error: 'Error interno',
        message: 'No se pudo iniciar sesión',
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
io.use(sessionSocket);

// Configurar handlers de WebSocket para salas
setupRoomHandlers(io);

// Configurar handlers de WebSocket para juego
setupGameHandlers(io);

// WebSocket connection (solo se ejecuta si la autenticación es exitosa)
io.on('connection', (socket) => {
  console.log(
    `Usuario conectado: ${socket.id} (Usuario ID: ${socket.userId}, Username: ${socket.username})`,
  );

  // Evento de prueba de conexión
  socket.on('ping', () => {
    socket.emit('pong', {
      message: 'Servidor activo',
      timestamp: Date.now(),
      userId: socket.userId,
      username: socket.username,
    });
  });

  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id} (Usuario ID: ${socket.userId})`);
  });
});

// Rutas API con rate limiting
// Aplicar rate limiting estricto a autenticación
app.use('/api/auth', authLimiter, authRoutes);
// Aplicar rate limiting moderado a salas
app.use('/api/rooms', roomsLimiter, roomRoutes);
// Aplicar rate limiting general a otras rutas
app.use('/api', generalLimiter);

// Rutas API básicas
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Escuchar en todas las interfaces para producción

server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 WebSocket disponible en ws://${HOST}:${PORT}`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS permitido para: ${allowedOrigins.join(', ')}`);
});
