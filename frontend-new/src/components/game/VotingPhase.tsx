import { useGame } from '@/hooks/useGame';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { socketService } from '@/services/socket';
import { Logger, toError } from '@/services/Logger';

const logger = new Logger('VotingPhase');

const VotingPhase = () => {
  const { state } = useGame();
  const { gameState, user, room } = state;
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!gameState || !user || !room) return null;

  const hasVoted = user.id in gameState.votes;
  const alivePlayers = room.players.filter((p) => p.isAlive);

  const handleVote = () => {
    if (!selectedPlayer) return;

    setSubmitting(true);
    try {
      const socket = socketService.getInstance().getSocket();
      socket.emit('game:submitVote', {
        roomId: room.id,
        targetId: selectedPlayer,
      });
    } catch (err) {
      logger.error('Error al votar:', toError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">🗳️ Fase de Votación</h2>
        <p className="text-muted-foreground">Vota por quien crees que es el impostor</p>
      </div>

      {/* Resumen de Pistas */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-md">
        <h3 className="text-lg font-bold mb-4 text-foreground">📝 Pistas de la Ronda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gameState.clues.map((clue, index) => (
            <div
              key={`${clue.playerId}-${index}`}
              className="p-3 bg-hover/30 rounded-lg border border-border"
            >
              <p className="text-xs text-muted-foreground mb-1">{clue.playerName}</p>
              <p className="font-semibold text-foreground">{clue.clue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Votación */}
      {!hasVoted ? (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-md">
          <h3 className="text-lg font-bold mb-4 text-foreground">Selecciona al Impostor</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {alivePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.userId)}
                disabled={player.userId === user.id}
                className={`p-4 rounded-lg border-2 transition-all duration-150 ${
                  selectedPlayer === player.userId
                    ? 'bg-primary/20 border-primary shadow-sm'
                    : 'bg-hover/20 border-border hover:border-primary/30 hover:bg-hover/30'
                } ${player.userId === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-linear-to-br from-primary to-primary-light rounded-full flex items-center justify-center font-bold text-lg text-white border-2 border-border">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-sm text-center text-foreground">
                    {player.username}
                    {player.userId === user.id && ' (Tú)'}
                  </p>
                  {selectedPlayer === player.userId && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleVote}
            disabled={!selectedPlayer || submitting}
            className="w-full py-4 bg-primary hover:bg-primary-hover disabled:bg-input disabled:text-muted-foreground rounded-md font-bold text-lg transition-all duration-150 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg active:scale-[0.98] disabled:shadow-none"
          >
            {submitting ? 'Enviando voto...' : 'CONFIRMAR VOTO'}
          </button>
        </div>
      ) : (
        <div className="bg-success/20 border border-success/30 p-8 rounded-2xl text-center shadow-md">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2 text-foreground">
            ¡Voto Registrado!
          </h3>
          <p className="text-muted-foreground">Esperando a que los demás jugadores voten...</p>
        </div>
      )}
    </div>
  );
};

export default VotingPhase;
