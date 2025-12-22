import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { X, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { apiService } from '@/services/apiService';
import { socketService } from '@/services/socket';

interface CreateRoomModalProps {
  onClose: () => void;
}

const CreateRoomModal = ({ onClose }: CreateRoomModalProps) => {
  const { state, dispatch } = useGame();
  const [roomName, setRoomName] = useState(`Sala de ${state.user?.username || 'Jugador'}`);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [minPlayers, setMinPlayers] = useState(3);
  const [numImpostors, setNumImpostors] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const room = await apiService.createRoom({
        name: roomName,
        maxPlayers,
        minPlayers,
        numImpostors,
        isPrivate,
      });

      // Unirse a la sala por Socket.io para recibir updates en tiempo real
      const socketClient = socketService.getInstance();
      socketClient.joinRoom(room.id);

      dispatch({ type: 'SET_ROOM', payload: room });
      toast.success('Sala creada exitosamente');
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      const errorMessage = error.message || 'Error al crear la sala';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card p-8 rounded-2xl border border-border max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Crear Nueva Sala</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-md transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1">
              Nombre de la Sala
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-input border-2 border-border rounded-md py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150"
              placeholder="Mi Sala Épica"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Mínimo
              </label>
              <input
                type="number"
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                min={3}
                max={maxPlayers}
                className="w-full bg-input border-2 border-border rounded-md py-3 px-4 text-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Máximo
              </label>
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                min={minPlayers}
                max={10}
                className="w-full bg-input border-2 border-border rounded-md py-3 px-4 text-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Número de Impostores
            </label>
            <input
              type="number"
              value={numImpostors}
              onChange={(e) => setNumImpostors(Number(e.target.value))}
              min={1}
              max={3}
              className="w-full bg-input border-2 border-border rounded-md py-3 px-4 text-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-hover/30 rounded-md border border-border">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 rounded-sm accent-primary cursor-pointer"
            />
            <label htmlFor="isPrivate" className="text-sm font-medium cursor-pointer text-foreground">
              Sala Privada (solo accesible con código)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md font-medium transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md font-medium shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Creando...' : 'Crear Sala'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
