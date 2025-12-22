/**
 * Cliente WebSocket para Juego Impostor Multijugador
 * Migrado a TypeScript con tipos estrictos
 *
 * Maneja toda la comunicación en tiempo real con el servidor usando Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import type { User, Room, GameState, Phase, Player } from '@/types/game';
import type { SocketEvents, SocketEventCallback, ClientToServerEvents } from '@/types/socket';
import { apiService } from './apiService';
import { toast } from 'sonner';
import { Logger, toError } from '@/services/Logger';
import { StorageService, StorageKey } from '@/services/StorageService';

// Voting Results Data
interface VotingResultsData {
  eliminatedPlayer?: Player;
  voteCounts: Record<string, number>;
  wasImpostor?: boolean;
  message?: string;
}

// Reconnect Result
export interface ReconnectResult {
  success: boolean;
  user?: User;
  room?: Room;
  gameState?: GameState;
}

// Tipos para callbacks
interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: { error: string; message: string }) => void;
  onRoomState?: (room: Room | null) => void;
  onRoomClosed?: (data: { message: string }) => void;
  onPlayerJoined?: (data: { player: Player; room: Room }) => void;
  onPlayerLeft?: (data: { player: Player; room: Room }) => void;
  onGameState?: (data: { gameState: GameState; phase: Phase }) => void;
  onRoomReconnected?: (data: { room: Room; gameState?: GameState }) => void;
  onClueSubmitted?: (data: { playerName: string; clue: string }) => void;
  onVoteSubmitted?: (data: { voterId: string; voterName?: string }) => void;
  onVotingResults?: (data: VotingResultsData) => void;
  onPhaseChanged?: (data: { phase: Phase; message?: string }) => void;
  onWordGuessed?: (data: { message: string }) => void;
  onGameTie?: (data: { tiedPlayers: Player[] }) => void;
  onGameVictory?: (data: { winner: 'citizens' | 'impostors' }) => void;
}

// Conjunto de claves válidas de SocketCallbacks para validación en runtime
const VALID_CALLBACK_KEYS = new Set<keyof SocketCallbacks>([
  'onConnect',
  'onDisconnect',
  'onError',
  'onRoomState',
  'onRoomClosed',
  'onPlayerJoined',
  'onPlayerLeft',
  'onGameState',
  'onRoomReconnected',
  'onClueSubmitted',
  'onVoteSubmitted',
  'onVotingResults',
  'onPhaseChanged',
  'onWordGuessed',
  'onGameTie',
  'onGameVictory',
]);

// Tipo para respuesta de autenticación
interface AuthResponse {
  user: User;
  token: string;
}

export class SocketClient {
  private serverUrl: string;
  private authSocket: Socket | null = null;
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private userId: string | null = null;
  private username: string | null = null;
  private token: string | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 1000;
  private callbacks: SocketCallbacks = {};
  private logger: Logger = new Logger('SocketClient');

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;

    // Cargar roomId desde StorageService si está disponible
    this.currentRoomId = StorageService.get<string>(StorageKey.ROOM_ID);
  }

  /**
   * Conectar al namespace de autenticación (sin token requerido)
   */
  connectAuth(): Promise<void> {
    if (this.authSocket?.connected) {
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
          // Ignorar errores de limpieza
          const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
          toast.error('Error al desconectar del servidor de autenticación: ' + errorMsg);
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
          this.logger.info('Conectado al namespace de autenticación');
          resolve();
        });

        this.authSocket.on('connect_error', (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          this.logger.error('Error de conexión auth:', error);
          reject(error instanceof Error ? error : new Error('Error de conexión al servidor'));
        });
      } catch (error) {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
        }
        reject(error instanceof Error ? error : new Error('Error al conectar al servidor de autenticación'));
      }
    });
  }

  /**
   * Conectar al namespace principal (requiere token)
   */
  connectMain(token: string): Promise<void> {
    if (this.socket?.connected) {
      this.disconnectMain();
    }

    this.token = token;

    // Guardar token en StorageService
    if (token) {
      StorageService.set(StorageKey.AUTH_TOKEN, token);
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
          // Ignorar errores de limpieza
          const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
          toast.error('Error al desconectar del servidor: ' + errorMsg);
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
          this.logger.info('Conectado al servidor principal');
          this.reconnectAttempts = 0;

          // Verificar si hay un roomId en localStorage para reconexión automática
          // Esto asegura que se reconecte incluso si currentRoomId se perdió
          const storedRoomId = StorageService.get<string>(StorageKey.ROOM_ID);
          if (storedRoomId) {
            this.currentRoomId = storedRoomId;
            this.logger.info(`Reconectando automáticamente a la sala: ${storedRoomId}`);
            this.joinRoom(storedRoomId);
          } else if (this.currentRoomId) {
            // Si no hay en localStorage pero sí en currentRoomId, usar ese
            this.joinRoom(this.currentRoomId);
          }

          this.callbacks.onConnect?.();
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.logger.info('Desconectado:', { reason });

          this.callbacks.onDisconnect?.(reason);

          // Intentar reconexión automática si no fue desconexión manual
          if (reason === 'io server disconnect') {
            // El servidor desconectó, no reconectar automáticamente
            return;
          }

          this.attemptReconnect();
        });

        this.socket.on('connect_error', async (error: Error) => {
          this.logger.error('Error de conexión:', error);

          const msg = error?.message || '';
          const looksAuthFailure =
            msg === 'Token inválido' ||
            msg === 'Token requerido' ||
            msg === 'Token de autenticación requerido' ||
            msg.startsWith('Autenticación fallida:') ||
            msg.toLowerCase().includes('token');

          if (looksAuthFailure) {
            const storedToken = StorageService.get<string>(StorageKey.AUTH_TOKEN);

            if (!storedToken) {
              this.clearAuth(true);
              this.callbacks.onError?.({
                error: 'Sesión expirada',
                message: 'Por favor, inicia sesión nuevamente',
              });
              if (!settled) {
                settled = true;
                clearTimeout(timeoutId);
                reject(error);
              }
              return;
            }

            // Validar token con el servidor
            let tokenIsInvalid = false;
            try {
              const resp = await fetch(`${this.serverUrl}/api/auth/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: storedToken }),
              });

              const data = (await resp.json().catch(() => null)) as {
                error?: string;
                message?: string;
                valid?: boolean;
              } | null;
              const errText = (
                data && (data.error || data.message) ? String(data.error || data.message) : ''
              ).toLowerCase();

              if (
                (data?.valid === false && errText.includes('token inválido')) ||
                (data?.valid === false && errText.includes('token expirado'))
              ) {
                tokenIsInvalid = true;
              }
            } catch (e) {
              tokenIsInvalid = false;
              const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
              toast.error('Error al verificar token: ' + errorMsg);
            }

            if (tokenIsInvalid) {
              this.clearAuth(true);
              this.callbacks.onError?.({
                error: 'Sesión expirada',
                message: 'Por favor, inicia sesión nuevamente',
              });
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
        reject(error instanceof Error ? error : new Error('Error al conectar al servidor'));
      }
    });
  }

  /**
   * Configurar listeners de eventos del servidor
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Eventos de salas
    this.socket.on('room:joined', (data: { room: Room }) => {
      this.logger.debug('Unido a sala:', data);
      this.callbacks.onRoomState?.(data.room);
    });

    this.socket.on('room:left', (data: { room: Room }) => {
      this.logger.debug('Salido de sala:', data);
      this.currentRoomId = null;
      try {
        StorageService.remove(StorageKey.ROOM_ID);
      } catch (e) {
        // Ignorar errores
        const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
        toast.error('Error al salir de la sala: ' + errorMsg);
      }
      this.callbacks.onRoomState?.(data.room);
    });

    this.socket.on('room:closed', (data: { message: string }) => {
      this.logger.debug('Sala cerrada:', data);
      this.currentRoomId = null;
      try {
        StorageService.remove(StorageKey.ROOM_ID);
      } catch (e) {
        // Ignorar errores
        const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
        toast.error('Error al salir de la sala: ' + errorMsg);
      }

      this.callbacks.onRoomClosed?.(data);
      this.callbacks.onRoomState?.(null);
    });

    this.socket.on('room:playerJoined', (data: { player: Player; room: Room }) => {
      this.logger.debug('Jugador unido:', data);
      this.callbacks.onPlayerJoined?.(data);
      this.callbacks.onRoomState?.(data.room);
    });

    this.socket.on('room:playerLeft', (data: { player: Player; room: Room }) => {
      this.logger.debug('Jugador salió:', data);
      this.callbacks.onPlayerLeft?.(data);
      this.callbacks.onRoomState?.(data.room);
    });

    this.socket.on('room:state', (data: { room: Room }) => {
      this.logger.debug('Estado de sala actualizado:', data);
      this.callbacks.onRoomState?.(data.room);
    });

    this.socket.on('room:reconnected', (data: { room: Room; gameState?: GameState }) => {
      this.logger.debug('Reconectado a sala:', data);

      const roomId = data?.room?.id;
      if (roomId) {
        this.currentRoomId = roomId;
        try {
          StorageService.set(StorageKey.ROOM_ID, roomId);
        } catch (e) {
          // Ignorar errores
          const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
          toast.error('Error al guardar ID de sala: ' + errorMsg);
        }
      }

      this.callbacks.onRoomReconnected?.(data);
    });

    this.socket.on('room:error', (error: { error: string; message: string }) => {
      this.logger.error('Error de sala:', new Error(error.message));
      this.callbacks.onError?.(error);
    });

    // Eventos de juego
    this.socket.on('game:state', (data: { gameState: GameState; phase: Phase }) => {
      this.logger.debug('Estado del juego actualizado');
      this.callbacks.onGameState?.(data);
    });

    this.socket.on('game:clueSubmitted', (data: { playerName: string; clue: string }) => {
      this.logger.debug('Nueva pista recibida:', data);
      this.callbacks.onClueSubmitted?.(data);
    });

    this.socket.on('game:turnChanged', (data: { turn: number }) => {
      this.logger.debug('Turno cambiado:', data);
      // El estado completo vendrá en game:state
    });

    this.socket.on('game:voteSubmitted', (data: { voterId: string }) => {
      this.logger.debug('Voto recibido:', data);
      this.callbacks.onVoteSubmitted?.(data);
    });

    this.socket.on('game:votingResults', (data: { votingResults: VotingResultsData }) => {
      this.logger.debug('Resultados de votación:', data);
      this.callbacks.onVotingResults?.(data.votingResults);
    });

    this.socket.on('game:tie', (data: { tiedPlayers: Player[] }) => {
      this.logger.debug('Empate en la votación:', data);
      this.callbacks.onGameTie?.(data);
    });

    this.socket.on('game:phaseChanged', (data: { phase: Phase; message?: string }) => {
      this.logger.debug('Fase cambiada:', data);
      this.callbacks.onPhaseChanged?.(data);
    });

    this.socket.on('game:wordGuessed', (data: { message: string }) => {
      this.logger.debug('Palabra adivinada:', data);
      this.callbacks.onWordGuessed?.(data);
    });

    this.socket.on('game:error', (error: { error: string; message: string }) => {
      this.logger.error('Error de juego:', new Error(error.message));
      this.callbacks.onError?.(error);
    });

    this.socket.on('game:victory', (data: { winner: 'citizens' | 'impostors' }) => {
      this.logger.debug('Victoria recibida:', data);
      this.callbacks.onGameVictory?.(data);
    });

    // Evento de prueba
    this.socket.on('pong', (data: { latency: number }) => {
      this.logger.debug('Pong recibido:', data);
    });
  }

  /**
   * Intentar reconexión automática
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Máximo de intentos de reconexión alcanzado');
      this.callbacks.onError?.({
        error: 'Conexión perdida',
        message: 'No se pudo reconectar al servidor. Por favor, recarga la página.',
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    this.logger.info(
      `Intentando reconectar en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
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
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    if (!this.authSocket?.connected) {
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

      const onSuccess = (data: AuthResponse) => {
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

      const onError = (error: { error: string; message: string }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        reject(error instanceof Error ? error : new Error('Error al registrar'));
      };

      const cleanup = () => {
        try {
          if (this.authSocket) {
            this.authSocket.off('auth:register:success', onSuccess);
            this.authSocket.off('auth:error', onError);
          }
        } catch (e) {
          // Ignorar errores
          const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
          toast.error('Error al registrar: ' + errorMsg);
        }
      };

      this.authSocket!.on('auth:register:success', onSuccess);
      this.authSocket!.on('auth:error', onError);

      this.authSocket!.emit('auth:register', { username, email, password });
    });
  }

  /**
   * Iniciar sesión
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!this.authSocket?.connected) {
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

      const onSuccess = (data: AuthResponse) => {
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

      const onError = (error: { error: string; message: string }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        reject(error instanceof Error ? error : new Error('Error al iniciar sesión'));
      };

      const cleanup = () => {
        try {
          if (this.authSocket) {
            this.authSocket.off('auth:login:success', onSuccess);
            this.authSocket.off('auth:error', onError);
          }
        } catch (e) {
          // Ignorar errores
          const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
          toast.error('Error al iniciar sesión: ' + errorMsg);
        }
      };

      this.authSocket!.on('auth:login:success', onSuccess);
      this.authSocket!.on('auth:error', onError);

      this.authSocket!.emit('auth:login', { email, password });
    });
  }

  /**
   * Esperar a que el socket se reconecte a una sala
   * @private
   */
  private async waitForRoomReconnection(timeoutMs: number): Promise<{ room: Room; gameState?: GameState } | null> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeoutMs);

      const onReconnected = (data: { room: Room; gameState?: GameState }) => {
        cleanup();
        resolve(data);
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        const currentCallback = this.callbacks.onRoomReconnected;
        if (currentCallback === onReconnected) {
          this.callbacks.onRoomReconnected = undefined;
        }
      };

      const originalCallback = this.callbacks.onRoomReconnected;
      this.callbacks.onRoomReconnected = (data) => {
        onReconnected(data);
        if (originalCallback) originalCallback(data);
      };
    });
  }

  /**
   * Esperar a que el socket se conecte
   * @private
   */
  private async waitForSocketConnection(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) return resolve();

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Socket connection timeout'));
      }, timeoutMs);

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (this.socket) {
          this.socket.off('connect', onConnect);
        }
      };

      if (this.socket) {
        this.socket.on('connect', onConnect);
      } else {
        cleanup();
        reject(new Error('No socket instance'));
      }
    });
  }

  /**
   * Verificar si hay un token guardado y reconectar
   */
  async reconnectWithStoredToken(): Promise<ReconnectResult> {
    const storedToken = StorageService.get<string>(StorageKey.AUTH_TOKEN);
    if (!storedToken) {
      return { success: false };
    }

    try {
      // Conectar al WebSocket con token
      await this.connectMain(storedToken);
      this.token = storedToken;

      // Obtener datos del usuario usando apiService
      let user: User | undefined;
      try {
        user = await apiService.getMe();
        this.userId = user.id;
        this.username = user.username;
      } catch (e) {
        this.logger.warn('No se pudo obtener datos del usuario');
        const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
        toast.error('Error al obtener datos del usuario: ' + errorMsg);
      }

      // Esperar evento de reconexión a sala (si estaba en una)
      const roomData = await this.waitForRoomReconnection(3000);

      return {
        success: true,
        user,
        room: roomData?.room,
        gameState: roomData?.gameState,
      };
    } catch (error) {
      this.logger.error('Error al reconectar:', toError(error));

      // Fallback: esperar reconexión automática de Socket.io
      try {
        await this.waitForSocketConnection(7000);
        this.token = storedToken;

        let user: User | undefined;
        try {
          user = await apiService.getMe();
          this.userId = user.id;
          this.username = user.username;
        } catch (e) {
          // Ignorar error de fetch
          const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
          toast.error('Error al obtener datos del usuario: ' + errorMsg);
        }

        const roomData = await this.waitForRoomReconnection(3000);

        return {
          success: true,
          user,
          room: roomData?.room,
          gameState: roomData?.gameState,
        };
      } catch (error) {
        this.logger.error('Error al reconectar automáticamente:', toError(error));
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        toast.error('Error al reconectar automáticamente: ' + errorMsg);
        return { success: false };
      }
    }
  }

  /**
   * Limpiar autenticación
   */
  clearAuth(removeStorage: boolean = true): void {
    this.token = null;
    this.userId = null;
    this.username = null;

    if (removeStorage) {
      this.currentRoomId = null;
      try {
        StorageService.remove(StorageKey.ROOM_ID);
        StorageService.remove(StorageKey.AUTH_TOKEN);
      } catch (e) {
        // Ignorar errores
        const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
        toast.error('Error al limpiar autenticación: ' + errorMsg);
      }
    }
    this.disconnectMain();
  }

  /**
   * Desconectar del namespace principal
   */
  disconnectMain(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Desconectar del namespace de autenticación
   */
  disconnectAuth(): void {
    if (this.authSocket) {
      this.authSocket.disconnect();
      this.authSocket = null;
    }
  }

  /**
   * Desconectar completamente
   */
  disconnect(): void {
    this.disconnectMain();
    this.disconnectAuth();
  }

  /**
   * Logout: Cerrar sesión, salir de sala y desconectar
   */
  logout(): void {
    this.logger.info('Cerrando sesión');

    // Salir de sala si está en una
    if (this.currentRoomId && this.socket?.connected) {
      try {
        this.leaveRoom();
      } catch (e) {
        const error = toError(e);
        this.logger.warn('Error al salir de sala durante logout:', { error: error.message });
      }
    }

    // Limpiar autenticación y localStorage
    this.clearAuth(true);

    // Desconectar todos los sockets
    this.disconnect();

    // Notificar a callbacks para actualizar UI
    this.callbacks.onDisconnect?.('User logout');
  }

  /**
   * Unirse a una sala por WebSocket
   */
  joinRoom(roomId: string): void {
    this.currentRoomId = roomId;
    try {
      StorageService.set(StorageKey.ROOM_ID, roomId);
    } catch (e) {
      // Ignorar errores
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      toast.error('Error al guardar roomId: ' + errorMsg);
    }

    // Si aún no hay socket conectado, solo guardamos el roomId
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('room:join', { roomId });
  }

  /**
   * Salir de la sala actual
   */
  leaveRoom(): void {
    if (this.currentRoomId) {
      if (this.socket?.connected) {
        this.socket.emit('room:leave', { roomId: this.currentRoomId });
      }
      this.currentRoomId = null;
      try {
        StorageService.remove(StorageKey.ROOM_ID);
      } catch (e) {
        // Ignorar errores
        const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
        toast.error('Error al eliminar roomId: ' + errorMsg);
      }
    }
  }

  /**
   * Solicitar estado actual de la sala
   */
  getRoomState(): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('room:state', { roomId: this.currentRoomId });
  }

  /**
   * Iniciar juego (solo host)
   */
  startGame(): void {
    if (!this.socket?.connected) {
      throw new Error('No conectado al servidor');
    }

    const roomId = this.currentRoomId || StorageService.get<string>(StorageKey.ROOM_ID);
    if (!roomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.currentRoomId = roomId;
    this.socket.emit('game:start', { roomId });
  }

  /**
   * Confirmar que el jugador ha visto su rol (deprecated - ya no se usa)
   */
  confirmRolesViewed(): void {
    if (!this.socket?.connected) {
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
  startCluesPhase(): void {
    if (!this.socket?.connected) {
      throw new Error('No conectado al servidor');
    }

    const roomId = this.currentRoomId || StorageService.get<string>(StorageKey.ROOM_ID);
    if (!roomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.currentRoomId = roomId;
    this.socket.emit('game:startCluesPhase', { roomId });
  }

  /**
   * Enviar pista
   */
  submitClue(clue: string): void {
    if (!this.socket?.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:submitClue', {
      roomId: this.currentRoomId,
      clue,
    });
  }

  /**
   * Enviar voto
   */
  submitVote(votedPlayerId: string): void {
    if (!this.socket?.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:submitVote', {
      roomId: this.currentRoomId,
      votedPlayerId,
    });
  }

  /**
   * Resolver un empate (solo host)
   */
  resolveTie(): void {
    if (!this.socket?.connected) {
      throw new Error('No conectado al servidor');
    }

    if (!this.currentRoomId) {
      throw new Error('No estás en ninguna sala');
    }

    this.socket.emit('game:resolveTie', {
      roomId: this.currentRoomId,
    });
  }

  /**
   * Solicitar estado actual del juego
   */
  getGameState(): void {
    if (!this.socket?.connected) {
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
  startNewRound(): void {
    if (!this.socket?.connected) {
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
  on<K extends keyof SocketEvents>(event: K, callback: SocketEventCallback<K>): void {
    const callbackKey = `on${event.charAt(0).toUpperCase() + event.slice(1)}` as keyof SocketCallbacks;
    if (VALID_CALLBACK_KEYS.has(callbackKey)) {
      // Type assertion needed because SocketCallbacks uses slightly different signatures
      // but they are compatible at runtime
      (this.callbacks as Record<string, unknown>)[callbackKey] = callback;
    } else {
      this.logger.warn(`Evento desconocido: ${event}`);
    }
  }

  /**
   * Emitir evento al servidor
   * Método público para que los componentes puedan emitir eventos directamente
   */
  emit<K extends keyof ClientToServerEvents>(event: K, ...args: Parameters<ClientToServerEvents[K]>): void {
    if (!this.socket?.connected) {
      throw new Error('No conectado al servidor');
    }
    this.socket.emit(event, ...args);
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get underlying Socket.IO socket instance
   * @throws Error if socket is not connected
   * @returns Socket instance
   */
  getSocket(): Socket {
    if (!this.socket?.connected) {
      throw new Error('Socket no conectado al servidor');
    }
    return this.socket;
  }

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser(): { id: string | null; username: string | null } {
    return {
      id: this.userId,
      username: this.username,
    };
  }

  /**
   * Obtener ID de sala actual
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
}
