import { useGame } from '@/hooks/useGame';
import { Send, Clock } from 'lucide-react';
import { useState } from 'react';
import { socketService } from '@/services/socket';

const CluePhase = () => {
  const { state } = useGame();
  const { gameState, user, room } = state;
  const [clueText, setClueText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!gameState || !user || !room) return null;

  const currentPlayerIndex = room.players.findIndex((p) => p.userId === user.id);
  const isMyTurn = gameState.currentTurn === currentPlayerIndex;
  const hasSubmittedClue = gameState.clues.some((c) => c.playerId === user.id);

  const handleSubmitClue = () => {
    if (!clueText.trim()) {
      setError('Debes escribir una pista');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const socket = socketService.getInstance();
      socket.emit('game:submitClue', {
        roomId: room.id,
        clue: clueText.trim(),
      });
      setClueText('');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al enviar pista');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">🧩 Ronda de Pistas</h2>
        <p className="text-muted-foreground">
          Cada jugador debe dar una pista relacionada con la palabra secreta
        </p>
      </div>

      {/* Turno Actual */}
      <div
        className={`p-6 rounded-2xl border-2 transition-all duration-150 shadow-md ${
          isMyTurn ? 'bg-primary/10 border-primary' : 'bg-card border-border'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">
            {isMyTurn ? '¡Es tu turno!' : 'Esperando turno...'}
          </h3>
        </div>

        {isMyTurn && !hasSubmittedClue ? (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={clueText}
                onChange={(e) => setClueText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitClue()}
                placeholder="Escribe tu pista aquí..."
                maxLength={50}
                className="flex-1 bg-input border-2 border-border rounded-md py-3.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150"
                disabled={submitting}
              />
              <button
                onClick={handleSubmitClue}
                disabled={submitting || !clueText.trim()}
                className="px-6 py-3.5 bg-primary hover:bg-primary-hover disabled:bg-input disabled:text-muted-foreground rounded-md font-semibold transition-all duration-150 flex items-center gap-2 text-white shadow-sm hover:shadow-md active:scale-[0.98] disabled:shadow-none"
              >
                <span>{submitting ? 'Enviando...' : 'Enviar'}</span>
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo 50 caracteres. Sé creativo pero no reveles demasiado.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {hasSubmittedClue
              ? '✅ Ya enviaste tu pista. Esperando a los demás...'
              : 'Otro jugador está dando su pista...'}
          </p>
        )}
      </div>

      {/* Lista de Pistas */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-md">
        <h3 className="text-xl font-bold mb-4 text-foreground">Pistas Dadas</h3>

        {gameState.clues.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aún no hay pistas. ¡Sé el primero!</p>
        ) : (
          <div className="space-y-3">
            {gameState.clues.map((clue, index) => (
              <div
                key={`${clue.playerId}-${index}`}
                className="p-4 bg-hover/30 rounded-lg border border-border hover:bg-hover/50 transition-colors duration-150"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{clue.playerName}</p>
                    <p className="text-lg font-semibold text-foreground">{clue.clue}</p>
                  </div>
                  <div className="text-2xl">💡</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CluePhase;
