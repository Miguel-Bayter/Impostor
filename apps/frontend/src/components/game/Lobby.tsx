import { useGame } from '@/hooks/useGame';
import { Users, Crown, LogOut, Play, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { socketService } from '@/services/socket';

const Lobby = () => {
  const { state, dispatch } = useGame();
  const { room, user } = state;
  const [copiedCode, setCopiedCode] = useState(false);

  if (!room || !user) return null;

  const isHost = room.hostId === user.id;
  const canStart = room.players.length >= (room.minPlayers || 3);

  const handleCopyCode = async () => {
    if (room.code) {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    if (confirm('¿Salir de la sala?')) {
      const socket = socketService.getInstance();
      socket.emit('room:leave', { roomId: room.id });
      dispatch({ type: 'SET_ROOM', payload: null });
    }
  };

  const handleStartGame = () => {
    const socket = socketService.getInstance();
    socket.emit('game:start', { roomId: room.id });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      {/* Header de la Sala */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-foreground">{room.name}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {room.players.length}/{room.maxPlayers} Jugadores
                </span>
              </div>
              {room.code && (
                <button
                  onClick={() => void handleCopyCode()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-input hover:bg-hover border border-border rounded-md transition-all duration-150 active:scale-[0.98]"
                >
                  <span className="font-mono font-bold text-foreground">#{room.code}</span>
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="p-3 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 rounded-md transition-all duration-150 active:scale-[0.98]"
            title="Salir de la Sala"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {!canStart && (
          <div className="p-3 bg-warning/20 border border-warning/30 rounded-md text-warning text-sm">
            Se necesitan al menos {room.minPlayers || 3} jugadores para comenzar
          </div>
        )}
      </div>

      {/* Lista de Jugadores */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Users className="w-5 h-5" />
          Jugadores en la Sala
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`p-4 rounded-lg border transition-all duration-150 ${
                player.userId === user.id
                  ? 'bg-primary/10 border-primary/40 shadow-sm'
                  : 'bg-hover/20 border-border hover:bg-hover/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-12 rounded-full flex items-center justify-center font-bold border-2 text-xl ${
                      player.userId === room.hostId
                        ? 'bg-linear-to-br from-warning to-warning/80 text-white border-warning/30'
                        : 'bg-linear-to-br from-primary to-primary-light text-primary-foreground border-border'
                    }`}
                  >
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{player.username}</p>
                    {player.userId === room.hostId && (
                      <div className="flex items-center gap-1 text-xs text-warning font-medium">
                        <Crown className="w-3 h-3" />
                        <span>Anfitrión</span>
                      </div>
                    )}
                  </div>
                </div>

                {player.isReady && player.userId !== room.hostId && (
                  <div className="px-3 py-1.5 bg-success/20 text-success border border-success/30 rounded-sm text-xs font-medium">
                    Listo ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Inicio (solo host) */}
      {isHost && (
        <div>
          <button
            onClick={handleStartGame}
            disabled={!canStart}
            className="w-full py-5 bg-success hover:bg-success/90 disabled:bg-input disabled:text-muted-foreground rounded-md font-bold text-lg flex items-center justify-center gap-3 transition-all duration-150 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg active:scale-[0.98] disabled:shadow-none"
          >
            <Play className="w-6 h-6" />
            <span>{canStart ? 'INICIAR PARTIDA' : 'ESPERANDO JUGADORES...'}</span>
          </button>
        </div>
      )}

      {!isHost && (
        <div className="text-center text-muted-foreground bg-card p-6 rounded-xl border border-border">
          <p className="text-sm">Esperando a que el anfitrión inicie la partida...</p>
        </div>
      )}
    </div>
  );
};

export default Lobby;
