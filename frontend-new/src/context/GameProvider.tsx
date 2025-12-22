import { useReducer, useEffect, type ReactNode } from 'react';
import { gameReducer, initialState } from '@/reducers/gameReducer';
import { GameContext } from '@/context/GameContext';
import { socketService } from '@/services/socket';
import { toast } from 'sonner';
import { Logger } from '@/services/Logger';

const logger = new Logger('GameProvider');

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Listener para sesión expirada (disparado por interceptor de axios)
    const handleSessionExpired = () => {
      logger.info('Sesión expirada, cerrando sesión');

      // Limpiar socket
      const socketClient = socketService.getInstance();
      socketClient.clearAuth(true);

      // Resetear estado
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_TOKEN', payload: null });
      dispatch({ type: 'SET_ROOM', payload: null });
      dispatch({ type: 'RESET_GAME' });

      toast.error('Sesión expirada', {
        description: 'Por favor, inicia sesión nuevamente',
      });
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};
