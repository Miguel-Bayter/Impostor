import { useGame } from '@/hooks/useGame';
import { LogOut, User as UserIcon, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { socketService } from '@/services/socket';

const Header = () => {
  const { state, dispatch } = useGame();
  const { user, room } = state;
  const isConnected = false; // TODO: Conectar con el estado de SocketService

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      const socketClient = socketService.getInstance();
      socketClient.logout();

      // Resetear estado global
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_TOKEN', payload: null });
      dispatch({ type: 'SET_ROOM', payload: null });
      dispatch({ type: 'RESET_GAME' });

      toast.info('Sesión cerrada');
    }
  };

  return (
    <header className="w-full py-4 px-6 flex items-center justify-between border-b border-border bg-bg-card sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold">🕵️‍♂️</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">IMPOSTOR</h1>
          {room && (
            <p className="text-xs text-text-secondary font-mono">
              SALA: <span className="text-success">{room.code || room.id}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-input rounded-full border border-border">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-success" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-danger" />
          )}
          <span className="text-xs font-medium uppercase tracking-wider">
            {isConnected ? 'En Línea' : 'Desconectado'}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-4 pl-4 border-l border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold hidden md:block">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-danger/10 hover:text-danger rounded-lg transition-colors duration-150"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
