import { useGame } from '@/hooks/useGame';
import { Trophy, XCircle, RotateCcw } from 'lucide-react';
import { socketService } from '@/services/socket';

const ResultsScreen = () => {
  const { state } = useGame();
  const { gameState, room } = state;

  if (!gameState || !room) return null;

  const winners = gameState.winners;
  const citizensWon = winners === 'citizens';

  const handleNewGame = () => {
    const socket = socketService.getInstance().getSocket();
    socket.emit('game:startNewRound', { roomId: room.id });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-6">
        <div
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 shadow-xl ${
            citizensWon
              ? 'bg-success/20 border-success'
              : 'bg-danger/20 border-danger'
          }`}
        >
          {citizensWon ? (
            <Trophy className="w-16 h-16 text-success" />
          ) : (
            <XCircle className="w-16 h-16 text-danger" />
          )}
        </div>

        <div>
          <h2 className="text-4xl font-bold mb-2 text-foreground">
            {citizensWon ? '¡Victoria de los Ciudadanos!' : '¡Victoria de los Impostores!'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {citizensWon ? 'El impostor fue descubierto' : 'El impostor logró engañar a todos'}
          </p>
        </div>
      </div>

      {/* Información del Impostor */}
      {gameState.impostorId && (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-md">
          <h3 className="text-xl font-bold mb-4 text-center text-foreground">
            🎭 El Impostor Era...
          </h3>
          <div className="flex items-center justify-center gap-4 p-6 bg-destructive/20 border border-destructive/30 rounded-lg">
            <div className="w-16 h-16 bg-destructive/30 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-destructive text-destructive">
              {room.players
                .find((p) => p.userId === gameState.impostorId)
                ?.username.charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {room.players.find((p) => p.userId === gameState.impostorId)?.username}
              </p>
              <p className="text-destructive text-sm font-semibold">Impostor</p>
            </div>
          </div>
        </div>
      )}

      {/* Palabra Secreta */}
      {gameState.secretWord && (
        <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-md">
          <h3 className="text-lg font-bold mb-3 text-foreground">Palabra Secreta</h3>
          <p className="text-4xl font-bold text-primary">{gameState.secretWord.toUpperCase()}</p>
        </div>
      )}

      {/* Resultados de Votación */}
      {Object.keys(gameState.votes).length > 0 && (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-md">
          <h3 className="text-xl font-bold mb-4 text-foreground">
            📊 Resultados de la Votación
          </h3>
          <div className="space-y-2">
            {Object.entries(
              Object.values(gameState.votes).reduce(
                (acc, targetId) => {
                  acc[targetId] = (acc[targetId] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              )
            )
              .sort(([, a], [, b]) => b - a)
              .map(([playerId, count]) => {
                const player = room.players.find((p) => p.userId === playerId);
                return (
                  <div
                    key={playerId}
                    className="flex items-center justify-between p-3 bg-hover/30 rounded-lg border border-border"
                  >
                    <span className="font-semibold text-foreground">{player?.username}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array.from({ length: count }).map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-primary rounded-full" />
                        ))}
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {count} {count === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Botón de Nueva Partida */}
      <div>
        <button
          onClick={handleNewGame}
          className="w-full py-5 bg-primary hover:bg-primary-hover rounded-md font-bold text-lg flex items-center justify-center gap-3 transition-all duration-150 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          <RotateCcw className="w-6 h-6" />
          <span>JUGAR DE NUEVO</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
