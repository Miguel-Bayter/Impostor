import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { X, Hash, ArrowRight } from 'lucide-react';

import { apiService } from '@/services/apiService';
import socketService from '@/services/socket';
import { StorageService, StorageKey } from '@/services/StorageService';

interface JoinRoomByCodeProps {
  onClose: () => void;
}

const JoinRoomByCode = ({ onClose }: JoinRoomByCodeProps) => {
  const { dispatch } = useGame();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const code = roomCode.trim().toUpperCase();

    // Validar que el código tenga exactamente 6 caracteres
    if (code.length !== 6) {
      setError('El código debe tener exactamente 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const room = await apiService.joinRoom(code);

      // Guardar el roomId completo (UUID) en localStorage para reconexión automática
      StorageService.set(StorageKey.ROOM_ID, room.id);

      // También unirse vía Socket.io para recibir updates en tiempo real
      // Usar el ID completo de la sala retornada por el servidor
      const socketClient = socketService.getInstance();
      socketClient.joinRoom(room.id);

      dispatch({ type: 'SET_ROOM', payload: room });
      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Sala no encontrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card p-8 rounded-2xl border border-border max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Unirse por Código</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-md transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground mb-6 text-sm">
          Ingresa el código de 6 caracteres de la sala
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" />
              Código de Sala
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                // Limitar a 6 caracteres y convertir a mayúsculas
                const value = e.target.value.toUpperCase().slice(0, 6);
                setRoomCode(value);
              }}
              className="w-full bg-input border-2 border-border rounded-md py-4 px-4 text-center text-2xl font-mono font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150 uppercase"
              placeholder="ABC123"
              maxLength={6}
              required
            />
            <p className="text-xs text-muted-foreground text-center">Ingresa 6 caracteres del código de la sala</p>
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
              className="flex-1 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md font-medium shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              {loading ? (
                'Buscando...'
              ) : (
                <>
                  <span>Unirse</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomByCode;
