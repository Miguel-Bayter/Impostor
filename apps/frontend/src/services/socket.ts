import { SocketClient } from './SocketClient';
import { APP_CONFIG } from '@/config';

/**
 * Singleton wrapper para SocketClient
 * Proporciona acceso global a la instancia de Socket
 */
class SocketService {
  private static instance: SocketClient | null = null;

  /**
   * Obtener instancia singleton de SocketClient
   */
  static getInstance(): SocketClient {
    if (!SocketService.instance) {
      SocketService.instance = new SocketClient(APP_CONFIG.SERVER_URL);
    }
    return SocketService.instance;
  }

  /**
   * Resetear instancia (útil para testing)
   */
  static reset(): void {
    if (SocketService.instance) {
      SocketService.instance.disconnect();
      SocketService.instance = null;
    }
  }
}

export const socketService = SocketService;
export default socketService;
