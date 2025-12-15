import User from '../models/User.js';

class UserRepository {
  // Crear un nuevo usuario
  async createUser(userData) {
    try {
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password,
      });
      
      return await user.save();
    } catch (error) {
      // Manejar errores de duplicado (email único)
      if (error.code === 11000) {
        throw new Error('El email ya está en uso');
      }
      throw error;
    }
  }

  // Encontrar usuario por ID
  async findById(userId) {
    return User.findById(userId).select('-password');
  }

  // Encontrar usuario por email
  async findByEmail(email) {
    return User.findOne({ email });
  }

  // Actualizar información de usuario
  async updateUser(userId, updateData) {
    // Eliminar campos que no se pueden actualizar
    const { password, ...safeUpdateData } = updateData;
    
    return User.findByIdAndUpdate(
      userId,
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    ).select('-password');
  }

  // Actualizar contraseña
  async updatePassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    user.password = newPassword;
    await user.save();
    return { success: true };
  }

  // Actualizar socket ID
  async updateSocketId(userId, socketId) {
    return User.findByIdAndUpdate(
      userId,
      { socketId },
      { new: true }
    ).select('-password');
  }

  // Actualizar sala actual del usuario
  async updateCurrentRoom(userId, roomId) {
    return User.findByIdAndUpdate(
      userId,
      { currentRoomId: roomId },
      { new: true }
    ).select('-password');
  }

  // Eliminar usuario (marcar como inactivo en lugar de borrar)
  async deleteUser(userId) {
    return User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');
  }

  // Verificar credenciales
  async verifyCredentials(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Credenciales inválidas');
    }

    // Actualizar último inicio de sesión
    await user.updateLastLogin();
    
    // Devolver usuario sin la contraseña
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }

  // Buscar usuarios por nombre de usuario (para mención)
  async searchUsers(query) {
    return User.find({
      username: { $regex: query, $options: 'i' },
      isActive: true
    }).limit(10).select('username');
  }
}

export default new UserRepository();
