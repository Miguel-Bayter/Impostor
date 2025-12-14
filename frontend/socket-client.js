/**
 * Cliente WebSocket para Juego Impostor Multijugador
 * Fase 5: WebSockets Frontend
 * 
 * Maneja toda la comunicación en tiempo real con el servidor
 */

class SocketClient {
  constructor(serverUrl = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    this.authSocket = null;
    this.socket = null;
    this.currentRoomId = null;
    this.userId = null;
    this.username = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Callbacks para eventos
    this.callbacks = {
      onConnect: null,
      onDisconnect: null,
      onError: null,
      onRoomState: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onGameState: null,
      onClueSubmitted: null,
      onVoteSubmitted: null,
      onVotingResults: null,
      onPhaseChanged: null,
      onWordGuessed: null
    };
  }

  /**
   * Conectar al namespace de autenticación (sin token requerido)
   */
  connectAuth() {
    if (this.authSocket && this.authSocket.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.authSocket = io(`${this.serverUrl}/auth`, {
          transports: ['websocket', 'polling']
        });

        this.authSocket.on('connect', () => {
          console.log('[SocketClient] Conectado al namespace de autenticación');
          resolve();
        });

        this.authSocket.on('connect_error', (error) => {
          console.error('[SocketClient] Error de conexión auth:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Conectar al namespace principal (requiere token)
   */
  connectMain(token) {
    if (this.socket && this.socket.connected) {
      this.disconnectMain();
    }

    this.token = token;
    
    // Guardar token en localStorage
    if (token) {
      localStorage.setItem('impostor_token', token);
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('[SocketClient] Conectado al servidor principal');
          this.reconnectAttempts = 0;
          
          // Si teníamos una sala, reconectarnos
          if (this.currentRoomId) {
            this.joinRoom(this.currentRoomId);
          }
          
          if (this.callbacks.onConnect) {
            this.callbacks.onConnect();
          }
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[SocketClient] Desconectado:', reason);
          
          if (this.callbacks.onDisconnect) {
            this.callbacks.onDisconnect(reason);
          }
          
          // Intentar reconexión automática si no fue desconexión manual
          if (reason === 'io server disconnect') {
            // El servidor desconectó, no reconectar automáticamente
            return;
          }
          
          this.attemptReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[SocketClient] Error de conexión:', error);
          
          if (error.message === 'Token inválido' || error.message === 'Token requerido') {
            // Token inválido, limpiar y requerir re-autenticación
            this.clearAuth();
            if (this.callbacks.onError) {
              this.callbacks.onError({ error: 'Sesión expirada', message: 'Por favor, inicia sesión nuevamente' });
            }
            reject(error);
          } else {
            this.attemptReconnect();
          }
        });

        // Configurar listeners de eventos
        this.setupEventListeners();
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Configurar listeners de eventos del servidor
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Eventos de salas
    this.socket.on('room:joined', (data) => {
      console.log('[SocketClient] Unido a sala:', data);
      if (this.callbacks.onRoomState) {
        this.callbacks.onRoomState(data.room);
      }
    });

    this.socket.on('room:left', (data) => {
      console.log('[SocketClient] Salido de sala:', data);
      this.currentRoomId = null;
      if (this.callbacks.onRoomState) {
        this.callbacks.onRoomState(data.room);
      }
    });

    this.socket.on('room:playerJoined', (data) => {
      console.log('[SocketClient] Jugador unido:', data);
      if (this.callbacks.onPlayerJoined) {
        this.callbacks.onPlayerJoined(data);
      }
      if (this.callbacks.onRoomState) {
        this.callbacks.onRoomState(data.room);
      }
    });

    this.socket.on('room:playerLeft', (data) => {
      console.log('[SocketClient] Jugador salió:', data);
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft(data);
      }
      if (this.callbacks.onRoomState) {
        this.callbacks.onRoomState(data.room);
      }
    });

    this.socket.on('room:state', (data) => {
      console.log('[SocketClient] Estado de sala actualizado:', data);
      if (this.callbacks.onRoomState) {
        this.callbacks.onRoomState(data.room);
      }
    });

    this.socket.on('room:error', (error) => {
      console.error('[SocketClient] Error de sala:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    // Eventos de juego
    this.socket.on('game:state', (data) => {
      console.log('[SocketClient] Estado del juego actualizado');
      if (this.callbacks.onGameState) {
        this.callbacks.onGameState(data.gameState, data.phase);
      }
    });

    this.socket.on('game:clueSubmitted', (data) => {
      console.log('[SocketClient] Nueva pista recibida:', data);
      if (this.callbacks.onClueSubmitted) {
        this.callbacks.onClueSubmitted(data);
      }
    });

    this.socket.on('game:turnChanged', (data) => {
      console.log('[SocketClient] Turno cambiado:', data);
      // El estado completo vendrá en game:state
    });

    this.socket.on('game:voteSubmitted', (data) => {
      console.log('[SocketClient] Voto recibido:', data);
      if (this.callbacks.onVoteSubmitted) {
        this.callbacks.onVoteSubmitted(data);
      }
    });

    this.socket.on('game:votingResults', (data) => {
      console.log('[SocketClient] Resultados de votación:', data);
      if (this.callbacks.onVotingResults) {
        this.callbacks.onVotingResults(data);
      }
    });

    this.socket.on('game:phaseChanged', (data) => {
      console.log('[SocketClient] Fase cambiada:', data);
      if (this.callbacks.onPhaseChanged) {
        this.callbacks.onPhaseChanged(data);
      }
    });

    this.socket.on('game:wordGuessed', (data) => {
      console.log('[SocketClient] Palabra adivinada:', data);
      if (this.callbacks.onWordGuessed) {
        this.callbacks.onWordGuessed(data);
      }
    });

    this.socket.on('game:error', (error) => {
      console.error('[SocketClient] Error de juego:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    // Evento de prueba
    this.socket.on('pong', (data) => {
      console.log('[SocketClient] Pong recibido:', data);
    });
  }

  /**
   * Intentar reconexión automática
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SocketClient] Máximo de intentos de reconexión alcanzado');
      if (this.callbacks.onError) {
        this.callbacks.onError({ 
          error: 'Conexión perdida', 
          message: 'No se pudo reconectar al servidor. Por favor, recarga la página.' 
        });
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[SocketClient] Intentando reconectar en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.token) {
        this.connectMain(this.token).catch(() => {
          // El error ya se maneja en connectMain
        });
      }
    }, delay);
  }

  /**
   * Registrar nuevo usuario
   */
  async register(username, email, password) {
    if (!this.authSocket || !this.authSocket.connected) {
      await this.connectAuth();
    }

    return new Promise((resolve, reject) => {
      this.authSocket.emit('auth:register', { username, email, password });

      this.authSocket.once('auth:register:success', (data) => {
        this.userId = data.user.id;
        this.username = data.user.username;
        this.token = data.token;
        
        // Conectar al namespace principal
        this.connectMain(data.token).then(() => {
          resolve(data);
        }).catch(reject);
      });

      this.authSocket.once('auth:error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Iniciar sesión
   */
  async login(email, password) {
    if (!this.authSocket || !this.authSocket.connected) {
      await this.connectAuth();
    }

    return new Promise((resolve, reject) => {
      this.authSocket.emit('auth:login', { email, password });

      this.authSocket.once('auth:login:success', (data) => {
        this.userId = data.user.id;
        this.username = data.user.username;
        this.token = data.token;
        
        // Conectar al namespace principal
        this.connectMain(data.token).then(() => {
          resolve(data);
        }).catch(reject);
      });

      this.authSocket.once('auth:error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Verificar si hay un token guardado y reconectar
   */
  async reconnectWithStoredToken() {
    const storedToken = localStorage.getItem('impostor_token');
    if (storedToken) {
      try {
        // Verificar token con el servidor
        const response = await fetch(`${this.serverUrl}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: storedToken })
        });

        const data = await response.json();
        
        if (data.valid) {
          this.userId = data.user.id;
          this.username = data.user.username;
          this.token = storedToken;
          await this.connectMain(storedToken);
          return true;
        } else {
          localStorage.removeItem('impostor_token');
        }
      } catch (error) {
        console.error('[SocketClient] Error al verificar token:', error);
        localStorage.removeItem('impostor_token');
      }
    }
    return false;
  }

  /**
   * Limpiar autenticación
   */
  clearAuth() {
    this.token = null;
    this.userId = null;
    this.username = null;
    this.currentRoomId = null;
    localStorage.removeItem('impostor_token');
    this.disconnectMain();
  }

  /**
   * Desconectar del namespace principal
   */
  disconnectMain() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Desconectar del namespace de autenticación
   */
  disconnectAuth() {
    if (this.authSocket) {
      this.authSocket.disconnect();
      this.authSocket = null;
    }
  }

  /**
   * Desconectar completamente
   */
  disconnect() {
    this.disconnectMain();
    this.disconnectAuth();
  }

  /**
   * Unirse a una sala por WebSocket
   */
  joinRoom(roomId) {
    if (!this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor');
    }

    this.currentRoomId = roomId;
    this.socket.emit('room:join', { roomId });
  }

  /**
   * Salir de la sala actual
   */
  leaveRoom() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    if (this.currentRoomId) {
      this.socket.emit('room:leave', { roomId: this.currentRoomId });
      this.currentRoomId = null;
    }
  }

  /**
   * Solicitar estado actual de la sala
   */
  getRoomState() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('room:state', { roomId: this.currentRoomId });
  }

  /**
   * Iniciar juego (solo host)
   */
  startGame() {
    if (!this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:start', { roomId: this.currentRoomId });
  }

  /**
   * Confirmar que el jugador ha visto su rol (deprecated - ya no se usa)
   */
  confirmRolesViewed() {
    if (!this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:confirmRoles', {
      roomId: this.currentRoomId
    });
  }

  /**
   * Iniciar fase de pistas (solo host)
   */
  startCluesPhase() {
    if (!this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:startCluesPhase', {
      roomId: this.currentRoomId
    });
  }

  /**
   * Enviar pista
   */
  submitClue(clue) {
    if (!this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:submitClue', {
      roomId: this.currentRoomId,
      clue: clue
    });
  }

  /**
   * Enviar voto
   */
  submitVote(votedPlayerId) {
    if (!this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:submitVote', {
      roomId: this.currentRoomId,
      votedPlayerId: votedPlayerId
    });
  }

  /**
   * Solicitar estado actual del juego
   */
  getGameState() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    if (!this.currentRoomId) {
      return;
    }

    this.socket.emit('game:getState', { roomId: this.currentRoomId });
  }

  /**
   * Iniciar nueva ronda (solo host)
   */
  startNewRound() {
    if (!this.socket || !this.socket.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:startNewRound', { roomId: this.currentRoomId });
  }

  /**
   * Registrar callbacks para eventos
   */
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
      const callbackKey = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
      this.callbacks[callbackKey] = callback;
    } else {
      console.warn(`[SocketClient] Evento desconocido: ${event}`);
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser() {
    return {
      id: this.userId,
      username: this.username
    };
  }

  /**
   * Obtener ID de sala actual
   */
  getCurrentRoomId() {
    return this.currentRoomId;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.SocketClient = SocketClient;
}
