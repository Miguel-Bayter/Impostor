/**
 * Ejemplo de uso de Autenticación por WebSocket
 * 
 * Este archivo muestra cómo usar los eventos de registro y login
 * a través de WebSocket en lugar de HTTP REST API
 */

// ============================================
// EJEMPLO 1: Registro por WebSocket
// ============================================

function registerViaWebSocket() {
  // Conectar al namespace de autenticación (no requiere token)
  const authSocket = io('http://localhost:3000/auth');

  // Escuchar cuando se conecta
  authSocket.on('connect', () => {
    console.log('Conectado al namespace de autenticación');

    // Enviar evento de registro
    authSocket.emit('auth:register', {
      username: 'juan_perez',
      email: 'juan@ejemplo.com',
      password: 'miPassword123'
    });
  });

  // Escuchar respuesta exitosa
  authSocket.on('auth:register:success', (data) => {
    console.log('Registro exitoso:', data);
    console.log('Token recibido:', data.token);
    
    // Guardar el token (en localStorage, sessionStorage, etc.)
    localStorage.setItem('authToken', data.token);
    
    // Ahora puedes conectarte al namespace principal con el token
    connectToMainNamespace(data.token);
    
    // Desconectar del namespace de auth
    authSocket.disconnect();
  });

  // Escuchar errores
  authSocket.on('auth:error', (error) => {
    console.error('Error de autenticación:', error);
    alert(`Error: ${error.message}`);
  });
}

// ============================================
// EJEMPLO 2: Login por WebSocket
// ============================================

function loginViaWebSocket() {
  // Conectar al namespace de autenticación
  const authSocket = io('http://localhost:3000/auth');

  authSocket.on('connect', () => {
    console.log('Conectado al namespace de autenticación');

    // Enviar evento de login
    authSocket.emit('auth:login', {
      email: 'juan@ejemplo.com',
      password: 'miPassword123'
    });
  });

  // Escuchar respuesta exitosa
  authSocket.on('auth:login:success', (data) => {
    console.log('Login exitoso:', data);
    console.log('Token recibido:', data.token);
    
    // Guardar el token
    localStorage.setItem('authToken', data.token);
    
    // Conectar al namespace principal
    connectToMainNamespace(data.token);
    
    // Desconectar del namespace de auth
    authSocket.disconnect();
  });

  // Escuchar errores
  authSocket.on('auth:error', (error) => {
    console.error('Error de login:', error);
    alert(`Error: ${error.message}`);
  });
}

// ============================================
// EJEMPLO 3: Conectar al namespace principal con token
// ============================================

function connectToMainNamespace(token) {
  // Conectar al namespace principal (requiere token)
  const mainSocket = io('http://localhost:3000', {
    auth: {
      token: token
    }
  });

  mainSocket.on('connect', () => {
    console.log('Conectado al namespace principal');
    console.log('Usuario autenticado:', mainSocket.userId);
    
    // Ahora puedes usar todos los eventos del juego
    mainSocket.emit('ping');
  });

  mainSocket.on('pong', (data) => {
    console.log('Respuesta del servidor:', data);
  });

  mainSocket.on('connect_error', (error) => {
    console.error('Error de conexión:', error.message);
    if (error.message.includes('Token')) {
      alert('Token inválido. Por favor, inicia sesión nuevamente.');
    }
  });
}

// ============================================
// EJEMPLO 4: Flujo completo (Registro + Conexión)
// ============================================

function completeAuthFlow() {
  const authSocket = io('http://localhost:3000/auth');

  authSocket.on('connect', () => {
    // Paso 1: Registrar usuario
    authSocket.emit('auth:register', {
      username: 'nuevo_usuario',
      email: 'nuevo@ejemplo.com',
      password: 'password123'
    });
  });

  authSocket.on('auth:register:success', (data) => {
    console.log('Usuario registrado:', data.user);
    
    // Paso 2: Guardar token
    const token = data.token;
    localStorage.setItem('authToken', data.token);
    
    // Paso 3: Conectar al namespace principal
    const mainSocket = io('http://localhost:3000', {
      auth: { token: token }
    });

    mainSocket.on('connect', () => {
      console.log('Conectado al juego como:', data.user.username);
      
      // Paso 4: Ya puedes usar los eventos del juego
      // Por ejemplo, unirse a una sala, enviar pistas, etc.
      // mainSocket.emit('joinRoom', { roomId: 'sala123' });
    });

    mainSocket.on('connect_error', (error) => {
      console.error('Error al conectar:', error.message);
    });
  });

  authSocket.on('auth:error', (error) => {
    console.error('Error en registro:', error);
  });
}

// ============================================
// EJEMPLO 5: Clase helper para manejar autenticación
// ============================================

class WebSocketAuth {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.authSocket = null;
    this.mainSocket = null;
    this.token = null;
  }

  /**
   * Registrar un nuevo usuario
   */
  async register(username, email, password) {
    return new Promise((resolve, reject) => {
      this.authSocket = io(`${this.serverUrl}/auth`);

      this.authSocket.on('connect', () => {
        this.authSocket.emit('auth:register', { username, email, password });
      });

      this.authSocket.on('auth:register:success', (data) => {
        this.token = data.token;
        localStorage.setItem('authToken', data.token);
        this.authSocket.disconnect();
        resolve(data);
      });

      this.authSocket.on('auth:error', (error) => {
        this.authSocket.disconnect();
        reject(error);
      });
    });
  }

  /**
   * Iniciar sesión
   */
  async login(email, password) {
    return new Promise((resolve, reject) => {
      this.authSocket = io(`${this.serverUrl}/auth`);

      this.authSocket.on('connect', () => {
        this.authSocket.emit('auth:login', { email, password });
      });

      this.authSocket.on('auth:login:success', (data) => {
        this.token = data.token;
        localStorage.setItem('authToken', data.token);
        this.authSocket.disconnect();
        resolve(data);
      });

      this.authSocket.on('auth:error', (error) => {
        this.authSocket.disconnect();
        reject(error);
      });
    });
  }

  /**
   * Conectar al namespace principal del juego
   */
  connectToGame() {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }

    if (!this.token) {
      throw new Error('No hay token de autenticación. Por favor, inicia sesión primero.');
    }

    this.mainSocket = io(this.serverUrl, {
      auth: { token: this.token }
    });

    return new Promise((resolve, reject) => {
      this.mainSocket.on('connect', () => {
        resolve(this.mainSocket);
      });

      this.mainSocket.on('connect_error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.authSocket) {
      this.authSocket.disconnect();
    }
    if (this.mainSocket) {
      this.mainSocket.disconnect();
    }
  }
}

// ============================================
// USO DE LA CLASE HELPER
// ============================================

async function ejemploConClaseHelper() {
  const auth = new WebSocketAuth('http://localhost:3000');

  try {
    // Opción 1: Registrar
    const registerResult = await auth.register('usuario1', 'user1@test.com', 'pass123');
    console.log('Registrado:', registerResult.user);

    // Opción 2: O si ya tienes cuenta, hacer login
    // const loginResult = await auth.login('user1@test.com', 'pass123');
    // console.log('Logueado:', loginResult.user);

    // Conectar al juego
    const gameSocket = await auth.connectToGame();
    console.log('Conectado al juego');

    // Usar el socket del juego
    gameSocket.emit('ping');
    gameSocket.on('pong', (data) => {
      console.log('Pong recibido:', data);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebSocketAuth };
}

