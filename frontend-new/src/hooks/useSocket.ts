import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Room, GameState, Phase, Player } from '@/types/game';
import { socketService } from '@/services/socket';
import { useGame } from '@/hooks/useGame';

/**
 * Hook para sincronizar SocketClient con el GameContext global
 * Registra todos los callbacks de eventos y muestra toast notifications
 */
export const useSocket = () => {
  const { dispatch } = useGame();
  const socketClient = socketService.getInstance();
  const registered = useRef(false);

  useEffect(() => {
    // Evitar registros duplicados
    if (registered.current) return;
    registered.current = true;

    // 1. Evento: Connect
    socketClient.on('connect', () => {
      toast.success('Conectado al servidor');
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
    });

    // 2. Evento: Disconnect
    socketClient.on('disconnect', () => {
      toast.warning('Reconectando...', { description: 'Conexión perdida, intentando reconectar' });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    });

    // 3. Evento: Error
    socketClient.on('error', (error: { error: string; message: string }) => {
      toast.error(error.error, {
        description: error.message,
      });
      dispatch({ type: 'SET_ERROR', payload: error.message });
    });

    // 4. Evento: RoomState
    socketClient.on('roomState', (room: Room | null) => {
      if (room) {
        dispatch({ type: 'SET_ROOM', payload: room });
      } else {
        dispatch({ type: 'SET_ROOM', payload: null });
      }
    });

    // 5. Evento: RoomClosed
    socketClient.on('roomClosed', (data: { message: string }) => {
      dispatch({ type: 'SET_ROOM', payload: null });
      dispatch({ type: 'RESET_GAME' });
      toast.info('Sala cerrada', {
        description: data.message,
      });
    });

    // 6. Evento: PlayerJoined
    socketClient.on('playerJoined', (data: { player: Player; room: Room }) => {
      dispatch({ type: 'UPDATE_PLAYERS', payload: data.room.players });
      toast.info(`${data.player.username} se unió a la sala`);
    });

    // 7. Evento: PlayerLeft
    socketClient.on('playerLeft', (data: { player: Player; room: Room }) => {
      dispatch({ type: 'UPDATE_PLAYERS', payload: data.room.players });
      toast.info(`${data.player.username} salió de la sala`);
    });

    // 8. Evento: RoomReconnected
    socketClient.on('roomReconnected', (data: { room: Room; gameState?: GameState }) => {
      dispatch({ type: 'SET_ROOM', payload: data.room });
      if (data.gameState) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState });
        dispatch({ type: 'SET_PHASE', payload: data.gameState.phase });
      }
      toast.success('Reconectado a la sala');
    });

    // 9. Evento: GameState
    socketClient.on('gameState', (data: { gameState: GameState; phase: Phase }) => {
      dispatch({ type: 'SET_GAME_STATE', payload: data.gameState });
      dispatch({ type: 'SET_PHASE', payload: data.phase });
    });

    // 10. Evento: PhaseChanged
    socketClient.on('phaseChanged', (data: { phase: Phase; message?: string }) => {
      dispatch({ type: 'SET_PHASE', payload: data.phase });
      if (data.message) {
        toast.info(data.message);
      }
    });

    // 11. Evento: ClueSubmitted
    socketClient.on('clueSubmitted', (data: { playerName: string; clue: string }) => {
      toast.info(`${data.playerName} dio una pista`);
    });

    // 12. Evento: VoteSubmitted
    socketClient.on('voteSubmitted', (data: { voterId: string; voterName?: string }) => {
      if (data.voterName) {
        toast.info(`${data.voterName} votó`);
      }
    });

    // 13. Evento: WordGuessed
    socketClient.on('wordGuessed', ({ message }: { message: string }) => {
      toast.success('🎯 Palabra Adivinada!', { description: message });
    });

    // 14. Evento: GameTie
    socketClient.on('gameTie', () => {
      dispatch({ type: 'SET_PHASE', payload: 'results' });
      toast.info('⚖️ Empate en la votación');
    });

    // 15. Evento: VotingResults
    socketClient.on('votingResults', () => {
      // Los resultados se manejan en el componente ResultsScreen
      // Aquí solo actualizamos el estado si es necesario
    });

    // 16. Evento: GameVictory
    socketClient.on('gameVictory', (data: { winner: 'citizens' | 'impostors' }) => {
      dispatch({ type: 'SET_PHASE', payload: 'victory' });
      const message = data.winner === 'citizens' ? '🏆 ¡Ganaron los Ciudadanos!' : '🕵️ ¡Ganó el Impostor!';
      toast.success(message);
    });

    // Cleanup no es necesario porque SocketClient gestiona sus propios listeners internamente
    return () => {
      // Los callbacks se mantienen durante toda la vida de la app
    };
  }, [dispatch, socketClient]);

  return socketClient;
};
