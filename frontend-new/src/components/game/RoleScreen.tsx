import { useGame } from '@/hooks/useGame';
import { Eye, EyeOff, Crown, Shield, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { socketService } from '@/services/socket';
import { Logger, toError } from '@/services/Logger';

const logger = new Logger('RoleScreen');

const RoleScreen = () => {
  const { state } = useGame();
  const { gameState, user, room } = state;
  const [revealed, setRevealed] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!gameState || !user || !room) return null;

  const currentPlayer = room.players.find((p) => p.userId === user.id);
  const isImpostor = currentPlayer?.isImpostor || false;
  const isHost = room.hostId === user.id;

  const handleStartCluesPhase = () => {
    setStarting(true);
    try {
      const socket = socketService.getInstance().getSocket();
      socket.emit('game:startCluesPhase', { roomId: room.id });
    } catch (error) {
      logger.error('Error al iniciar fase de pistas:', toError(error));
      setStarting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Asignación de Roles</h2>
        <p className="text-muted-foreground">Haz clic en la tarjeta para revelar tu rol</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setRevealed(!revealed)}
          className={`w-full aspect-3/4 relative overflow-hidden rounded-2xl border-4 transition-all duration-150 active:scale-[0.98] ${
            revealed
              ? isImpostor
                ? 'border-danger bg-danger/10'
                : 'border-success bg-success/10'
              : 'border-border bg-card'
          }`}
        >
          {!revealed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                <EyeOff className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-foreground">Tu Rol</p>
                <p className="text-muted-foreground">Toca para revelar</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${
                  isImpostor ? 'bg-danger/20 border-danger' : 'bg-success/20 border-success'
                }`}
              >
                {isImpostor ? (
                  <Shield className="w-16 h-16 text-danger" />
                ) : (
                  <Eye className="w-16 h-16 text-success" />
                )}
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-4xl font-bold text-foreground">
                  {isImpostor ? '🎭 IMPOSTOR' : '👥 CIUDADANO'}
                </h3>

                {!isImpostor && gameState.secretWord && (
                  <div className="mt-6 p-4 bg-hover border-2 border-success rounded-lg shadow-lg">
                    <p className="text-sm text-muted-foreground mb-2">Palabra Secreta:</p>
                    <p className="text-3xl font-bold text-foreground tracking-wider">
                      {gameState.secretWord.toUpperCase()}
                    </p>
                  </div>
                )}

                {isImpostor && (
                  <p className="text-muted-foreground text-sm max-w-md">
                    Debes descubrir la palabra secreta sin que te descubran. Da pistas genéricas y observa a los demás.
                  </p>
                )}
              </div>
            </div>
          )}
        </button>
      </div>

      {isHost && revealed && (
        <div className="text-center space-y-4">
          <div className="p-4 bg-warning/20 border border-warning/30 rounded-lg text-warning text-sm flex items-center gap-2 justify-center">
            <Crown className="w-4 h-4" />
            <span>Como anfitrión, espera a que todos vean su rol antes de continuar</span>
          </div>

          <button
            onClick={handleStartCluesPhase}
            disabled={starting}
            className="w-full py-5 bg-success hover:bg-success/90 disabled:bg-input disabled:text-muted-foreground rounded-md font-bold text-lg transition-all duration-150 flex items-center justify-center gap-3 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg active:scale-[0.98] disabled:shadow-none"
          >
            <span>{starting ? 'Iniciando...' : 'INICIAR FASE DE PISTAS'}</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RoleScreen;
