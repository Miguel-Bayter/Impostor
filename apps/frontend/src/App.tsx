import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AuthScreen from '@/components/auth/AuthScreen';
import RoomDiscovery from '@/components/rooms/RoomDiscovery';
import Lobby from '@/components/game/Lobby';
import RoleScreen from '@/components/game/RoleScreen';
import CluePhase from '@/components/game/CluePhase';
import VotingPhase from '@/components/game/VotingPhase';
import ResultsScreen from '@/components/game/ResultsScreen';
import { useGame } from '@/hooks/useGame';
import { useSocket } from '@/hooks/useSocket';
import { socketService } from '@/services/socket';
import { Logger, toError } from '@/services/Logger';
import { StorageService, StorageKey } from '@/services/StorageService';

const logger = new Logger('App');

const App = () => {
  // Sincronizar sockets con el estado global
  useSocket();
  const { state, dispatch } = useGame();
  const { user, room, phase, isLoading } = state;

  // Reconexión automática al montar la app
  useEffect(() => {
    const attemptReconnect = async () => {
      // Si ya hay usuario o estamos cargando, no hacer nada
      if (user || isLoading) return;

      const storedToken = StorageService.get<string>(StorageKey.AUTH_TOKEN);
      if (!storedToken) return;

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const socketClient = socketService.getInstance();
        const result = await socketClient.reconnectWithStoredToken();

        if (result.success && result.user) {
          dispatch({ type: 'SET_USER', payload: result.user });
          if (result.room) {
            dispatch({ type: 'SET_ROOM', payload: result.room });
          }
          if (result.gameState) {
            dispatch({ type: 'SET_GAME_STATE', payload: result.gameState });
            dispatch({ type: 'SET_PHASE', payload: result.gameState.phase });
          } else {
            // Si no hay room en la respuesta pero hay roomId en localStorage,
            // intentar unirse manualmente (puede que el servidor no haya reconectado automáticamente)
            const storedRoomId = StorageService.get<string>(StorageKey.ROOM_ID);
            if (storedRoomId && !result.room) {
              logger.info(`Intentando reconectar a sala guardada: ${storedRoomId}`);
              // El socket ya debería estar conectado, así que joinRoom() emitirá el evento
              socketClient.joinRoom(storedRoomId);
            }
          }
        }
      } catch (error) {
        logger.error('Error en reconexión automática:', toError(error));
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    void attemptReconnect();
  }, [dispatch, isLoading, user]); // Solo al montar

  // Renderizar según el estado
  const renderContent = () => {
    // Mostrar pantalla de loading durante reconexión
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xl font-semibold text-text-secondary">Reconectando...</p>
        </div>
      );
    }

    if (!user) return <AuthScreen />;
    if (!room) return <RoomDiscovery />;

    // Si hay sala, renderizar según la fase
    switch (phase) {
      case 'waiting':
        return <Lobby />;
      case 'roles':
        return <RoleScreen />;
      case 'clues':
        return <CluePhase />;
      case 'voting':
        return <VotingPhase />;
      case 'results':
      case 'victory':
        return <ResultsScreen />;
      default:
        return <Lobby />;
    }
  };

  return <MainLayout>{renderContent()}</MainLayout>;
};

export default App;
