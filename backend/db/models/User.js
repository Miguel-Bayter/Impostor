import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeUsername, sanitizeEmail } from '../../utils/sanitizer.js';

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    set: sanitizeUsername,
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'El email no es válido',
    },
    set: sanitizeEmail,
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false, // No devolver la contraseña por defecto
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  socketId: {
    type: String,
    default: null,
  },
  currentRoomId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password; // Asegurarse de que la contraseña no se envíe en las respuestas
      return ret;
    },
  },
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para actualizar el último inicio de sesión
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  return this.save();
};

// Método para actualizar el socket ID
userSchema.methods.updateSocket = async function(socketId) {
  this.socketId = socketId;
  return this.save();
};

// Método para actualizar la sala actual
userSchema.methods.updateCurrentRoom = async function(roomId) {
  this.currentRoomId = roomId;
  return this.save();
};

// Índices para búsquedas rápidas
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ socketId: 1 }, { sparse: true });
userSchema.index({ currentRoomId: 1 }, { sparse: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
