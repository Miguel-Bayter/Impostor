/**
 * Rutas de Autenticación
 * Fase 2: Autenticación
 *
 * Endpoints:
 * - POST /api/auth/register - Registro de nuevo usuario
 * - POST /api/auth/login - Inicio de sesión
 * - GET /api/auth/me - Obtener información del usuario actual (protegida)
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeUsername, sanitizeEmail } = require('../utils/sanitizer');

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 *
 * Body:
 * {
 *   "username": "nombre_usuario",
 *   "email": "usuario@ejemplo.com",
 *   "password": "contraseña123"
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar que se enviaron todos los campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Se requieren: username, email, password',
      });
    }

    // Sanitizar inputs
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedEmail = sanitizeEmail(email);

    // Validar que los inputs sanitizados son válidos
    if (!sanitizedUsername || sanitizedUsername.trim().length === 0) {
      return res.status(400).json({
        error: 'Nombre de usuario inválido',
        message: 'El nombre de usuario contiene caracteres no permitidos o está vacío',
      });
    }

    if (!sanitizedEmail) {
      return res.status(400).json({
        error: 'Email inválido',
        message: 'El formato del email no es válido',
      });
    }

    // Crear usuario con datos sanitizados
    const user = await User.create(sanitizedUsername, sanitizedEmail, password);

    // Generar token JWT
    const token = generateToken(user.id, user.username);

    // Respuesta exitosa
    res.status(201).json({
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
    if (error.message.includes('ya está') || error.message.includes('debe tener')) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message,
      });
    }

    // Error inesperado
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el usuario',
    });
  }
});

/**
 * POST /api/auth/login
 * Inicio de sesión
 *
 * Body:
 * {
 *   "email": "usuario@ejemplo.com",
 *   "password": "contraseña123"
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que se enviaron los campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Se requieren: email, password',
      });
    }

    // Sanitizar email
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail) {
      return res.status(400).json({
        error: 'Email inválido',
        message: 'El formato del email no es válido',
      });
    }

    // Buscar usuario por email (usar email sanitizado)
    const user = await User.findByEmail(sanitizedEmail);

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos',
      });
    }

    // Verificar contraseña
    const isPasswordValid = await User.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos',
      });
    }

    // Generar token JWT
    const token = generateToken(user.id, user.username);

    // Respuesta exitosa
    res.json({
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
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo iniciar sesión',
    });
  }
});

/**
 * GET /api/auth/me
 * Obtener información del usuario actual
 * Requiere autenticación (token JWT)
 */
router.get('/me', authenticateToken, (req, res) => {
  // El middleware authenticateToken ya adjuntó req.user
  res.json({
    user: req.user,
  });
});

/**
 * POST /api/auth/verify
 * Verificar si un token es válido
 *
 * Body:
 * {
 *   "token": "jwt_token_here"
 * }
 */
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token requerido',
        message: 'Envía el token en el body: { "token": "..." }',
      });
    }

    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);

    // Verificar que el usuario existe
    const verify = async () => {
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          valid: false,
          error: 'Usuario no encontrado',
        });
      }

      return res.json({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    };

    return verify();

  } catch (error) {
    res.status(401).json({
      valid: false,
      error: error.message,
    });
  }
});

module.exports = router;
