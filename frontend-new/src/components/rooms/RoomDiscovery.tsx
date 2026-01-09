import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { RefreshCw, Plus, Hash, Lock } from 'lucide-react';
import { toast } from 'sonner';

import type { Room } from '@/types/game';
import { apiService } from '@/services/apiService';
import { socketService } from '@/services/socket';
import CreateRoomModal from './CreateRoomModal';
import JoinRoomByCode from './JoinRoomByCode';
import { Logger, toError } from '@/services/Logger';

const logger = new Logger('RoomDiscovery');

const RoomDiscovery = () => {
  const { dispatch } = useGame();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const rooms = await apiService.listRooms();
      setRooms(rooms);
    } catch (error) {
      logger.error('Error al cargar salas:', toError(error));
      toast.error('Error al cargar las salas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRooms();
  }, []);

  const handleJoinRoom = async (room: Room) => {
    // Si la sala es privada, abrir modal de código en lugar de join directo
    if (room.isPrivate) {
      toast.info('Esta sala es privada. Ingresa el código para unirte.');
      setShowJoinModal(true);
      return;
    }

    try {
      const joinedRoom = await apiService.joinRoom(room.id);

      // También unirse vía Socket.io para recibir updates en tiempo real
      const socketClient = socketService.getInstance();
      socketClient.joinRoom(room.id);

      dispatch({ type: 'SET_ROOM', payload: joinedRoom });
      toast.success('Te has unido a la sala');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Error al unirse a la sala');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Salas de Juego</h2>
          <p className="text-muted-foreground mt-1 text-sm">Únete a una partida o crea tu propia sala</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => void loadRooms()}
            disabled={loading}
            className="p-3 bg-card hover:bg-hover rounded-md border border-border transition-colors duration-150 disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-3 bg-secondary hover:bg-secondary/80 border-2 border-border rounded-md font-medium flex items-center gap-2 transition-all duration-150 active:scale-[0.98]"
          >
            <Hash className="w-5 h-5" />
            <span>Unirse por Código</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Crear Sala</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 && !loading && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <p className="text-lg">No hay salas disponibles. ¡Crea una nueva!</p>
          </div>
        )}

        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-card p-6 rounded-xl border border-border hover:border-hover hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 cursor-pointer min-h-[200px] flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xl text-foreground">{room.name}</h3>
                  {room.isPrivate && (
                    <Lock className="w-4 h-4 text-muted-foreground" title="Sala privada" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Código: #{room.id.slice(0, 6).toUpperCase()}
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-sm text-xs font-medium border ${
                  room.status === 'open' || room.status === 'waiting'
                    ? 'bg-success/20 text-success border-success/30'
                    : 'bg-warning/20 text-warning border-warning/30'
                }`}
              >
                {room.status === 'open' || room.status === 'waiting' ? 'Abierta' : 'En Juego'}
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-4 text-sm text-muted-foreground">
              <div className="flex justify-between items-center p-3 bg-hover/20 rounded-sm">
                <span>Jugadores:</span>
                <span className="font-semibold text-foreground text-base">
                  {room.players.length}/{room.maxPlayers}
                </span>
              </div>
            </div>

            <button
              onClick={() => void handleJoinRoom(room)}
              disabled={(room.status !== 'open' && room.status !== 'waiting') || room.players.length >= room.maxPlayers}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground disabled:bg-input disabled:text-muted-foreground rounded-md font-medium shadow-sm hover:shadow-md transition-all duration-150 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
            >
              {room.status !== 'open' && room.status !== 'waiting'
                ? 'En Progreso'
                : room.players.length >= room.maxPlayers
                  ? 'Sala Llena'
                  : room.isPrivate
                    ? 'Unirse con Código →'
                    : 'Unirse →'}
            </button>
          </div>
        ))}
      </div>

      {/* Modales */}
      {showCreateModal && <CreateRoomModal onClose={() => setShowCreateModal(false)} />}
      {showJoinModal && <JoinRoomByCode onClose={() => setShowJoinModal(false)} />}
    </div>
  );
};

export default RoomDiscovery;
