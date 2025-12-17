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
    this.currentRoomId =
      typeof localStorage !== 'undefined' ? localStorage.getItem('impostor_room_id') : null;
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
      onRoomClosed: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onGameState: null,
      onClueSubmitted: null,
      onVoteSubmitted: null,
      onVotingResults: null,
      onPhaseChanged: null,
      onWordGuessed: null,
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
      let settled = false;
      const timeoutMs = 10000;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          if (this.authSocket) {
            this.authSocket.off('connect');
            this.authSocket.off('connect_error');
            this.authSocket.disconnect();
          }
        } catch (e) {
        }
        reject(new Error('No se pudo conectar al servidor de autenticación'));
      }, timeoutMs);

      try {
        this.authSocket = io(`${this.serverUrl}/auth`, {
          transports: ['websocket', 'polling'],
        });

        this.authSocket.on('connect', () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          console.log('[SocketClient] Conectado al namespace de autenticación');
          resolve();
        });

        this.authSocket.on('connect_error', (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          console.error('[SocketClient] Error de conexión auth:', error);
          reject(error instanceof Error ? error : new Error('Error de conexión al servidor'));
        });
      } catch (error) {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
        }
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
      let settled = false;
      const timeoutMs = 10000;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          if (this.socket) {
            this.socket.off('connect');
            this.socket.off('connect_error');
            this.socket.disconnect();
          }
        } catch (e) {
        }
        reject(new Error('No se pudo conectar al servidor'));
      }, timeoutMs);

      try {
        this.socket = io(this.serverUrl, {
          auth: {
            token: token,
          },
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
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

          const msg = error?.message || '';
          const looksAuthFailure =
            msg === 'Token inválido' ||
            msg === 'Token requerido' ||
            msg === 'Token de autenticación requerido' ||
            msg.startsWith('Autenticación fallida:') ||
            msg.toLowerCase().includes('token');

          if (looksAuthFailure) {
            const storedToken = localStorage.getItem('impostor_token');

            if (!storedToken) {
              this.clearAuth(true);
              if (this.callbacks.onError) {
                this.callbacks.onError({
                  error: 'Sesión expirada',
                  message: 'Por favor, inicia sesión nuevamente',
                });
              }
              if (!settled) {
                settled = true;
                clearTimeout(timeoutId);
                reject(error);
              }
              return;
            }

            (async () => {
              let tokenIsInvalid = false;
              try {
                const resp = await fetch(`${this.serverUrl}/api/auth/verify`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ token: storedToken }),
                });

                const data = await resp.json().catch(() => null);
                const errText = (data && (data.error || data.message) ? String(data.error || data.message) : '').toLowerCase();
                if (
                  (data && data.valid === false && errText.includes('token inválido')) ||
                  (data && data.valid === false && errText.includes('token expirado'))
                ) {
                  tokenIsInvalid = true;
                }
              } catch (e) {
                tokenIsInvalid = false;
              }

              if (tokenIsInvalid) {
                this.clearAuth(true);
                if (this.callbacks.onError) {
                  this.callbacks.onError({
                    error: 'Sesión expirada',
                    message: 'Por favor, inicia sesión nuevamente',
                  });
                }
                if (!settled) {
                  settled = true;
                  clearTimeout(timeoutId);
                  reject(error);
                }
                return;
              }

              if (!settled) {
                settled = true;
                clearTimeout(timeoutId);
                reject(error instanceof Error ? error : new Error('Error de conexión al servidor'));
              }
              this.attemptReconnect();
            })();
            return;
          }

          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            reject(error instanceof Error ? error : new Error('Error de conexión al servidor'));
          }
          this.attemptReconnect();
        });

        // Configurar listeners de eventos
        this.setupEventListeners();
      } catch (error) {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
        }
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
      try {
        localStorage.removeItem('impostor_room_id');
      } catch (e) {
      }
      if (this.callbacks.onRoomState) {
        this.callbacks.onRoomState(data.room);
      }
    });

    this.socket.on('room:closed', (data) => {
      console.log('[SocketClient] Sala cerrada:', data);
      this.currentRoomId = null;
      try {
        localStorage.removeItem('impostor_room_id');
      } catch (e) {
      }

      if (this.callbacks.onRoomClosed) {
        this.callbacks.onRoomClosed(data);
      }

      if (this.callbacks.onRoomState) {
        this.callbacks.onRoomState(null);
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
          message: 'No se pudo reconectar al servidor. Por favor, recarga la página.',
        });
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(
      `[SocketClient] Intentando reconectar en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

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
      let settled = false;
      const timeoutMs = 10000;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('No se recibió respuesta del servidor (registro)'));
      }, timeoutMs);

      const onSuccess = (data) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();

        this.userId = data.user.id;
        this.username = data.user.username;
        this.token = data.token;

        // Conectar al namespace principal
        this.connectMain(data.token)
          .then(() => {
            resolve(data);
          })
          .catch(reject);
      };

      const onError = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        reject(error instanceof Error ? error : new Error(error?.message || 'Error en registro'));
      };

      const cleanup = () => {
        try {
          if (this.authSocket) {
            this.authSocket.off('auth:register:success', onSuccess);
            this.authSocket.off('auth:error', onError);
          }
        } catch (e) {
        }
      };

      this.authSocket.on('auth:register:success', onSuccess);
      this.authSocket.on('auth:error', onError);

      this.authSocket.emit('auth:register', { username, email, password });
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
      let settled = false;
      const timeoutMs = 10000;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('No se recibió respuesta del servidor (login)'));
      }, timeoutMs);

      const onSuccess = (data) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();

        this.userId = data.user.id;
        this.username = data.user.username;
        this.token = data.token;

        // Conectar al namespace principal
        this.connectMain(data.token)
          .then(() => {
            resolve(data);
          })
          .catch(reject);
      };

      const onError = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        reject(error instanceof Error ? error : new Error(error?.message || 'Error al iniciar sesión'));
      };

      const cleanup = () => {
        try {
          if (this.authSocket) {
            this.authSocket.off('auth:login:success', onSuccess);
            this.authSocket.off('auth:error', onError);
          }
        } catch (e) {
        }
      };

      this.authSocket.on('auth:login:success', onSuccess);
      this.authSocket.on('auth:error', onError);

      this.authSocket.emit('auth:login', { email, password });
    });
  }

  /**
   * Verificar si hay un token guardado y reconectar
   */
  async reconnectWithStoredToken() {
    const storedToken = localStorage.getItem('impostor_token');
    if (storedToken) {
      try {
        // Primero, validar token conectando al WebSocket (es la fuente de verdad para la sesión)
        await this.connectMain(storedToken);
        this.token = storedToken;

        // Luego, intentar obtener el usuario (si falla por CORS/red, igual mantenemos sesión)
        try {
          const response = await fetch(`${this.serverUrl}/api/auth/me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.user) {
              this.userId = data.user.id;
              this.username = data.user.username;
            }
          }
        } catch (e) {
        }

        return true;
      } catch (error) {
        console.error('[SocketClient] Error al reconectar con token guardado:', error);
        // Si hay un fallo transitorio, Socket.IO puede reconectar automáticamente.
        // Esperar un poco y, si conecta, tratar la sesión como restaurada.
        try {
          await new Promise((resolve, reject) => {
            const timeoutMs = 7000;
            if (this.socket && this.socket.connected) return resolve();

            const timeoutId = setTimeout(() => {
              cleanup();
              reject(new Error('Timeout esperando reconexión'));
            }, timeoutMs);

            const onConnect = () => {
              cleanup();
              resolve();
            };

            const cleanup = () => {
              clearTimeout(timeoutId);
              try {
                if (this.socket) this.socket.off('connect', onConnect);
              } catch (e) {
              }
            };

            try {
              if (this.socket) this.socket.on('connect', onConnect);
            } catch (e) {
              cleanup();
              reject(e);
            }
          });

          this.token = storedToken;
          try {
            const response = await fetch(`${this.serverUrl}/api/auth/me`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data?.user) {
                this.userId = data.user.id;
                this.username = data.user.username;
              }
            }
          } catch (e) {
          }

          return true;
        } catch (e) {
        }
      }
    }
    return false;
  }

  /**
   * Limpiar autenticación
   */
  clearAuth(removeStorage = true) {
    this.token = null;
    this.userId = null;
    this.username = null;

    if (removeStorage) {
      this.currentRoomId = null;
      try {
        localStorage.removeItem('impostor_room_id');
      } catch (e) {
      }
      try {
        localStorage.removeItem('impostor_token');
      } catch (e) {
      }
    }
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
    try {
      localStorage.setItem('impostor_room_id', roomId);
    } catch (e) {
    }
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
      try {
        localStorage.removeItem('impostor_room_id');
      } catch (e) {
      }
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
      roomId: this.currentRoomId,
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
      roomId: this.currentRoomId,
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
      clue: clue,
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
      votedPlayerId: votedPlayerId,
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
      username: this.username,
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
