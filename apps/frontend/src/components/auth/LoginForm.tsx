import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { socketService } from '@/services/socket';

const LoginForm = () => {
  const { dispatch } = useGame();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usamos el socketClient a través del servicio singleton
      const socketClient = socketService.getInstance();
      const result = await socketClient.login(email, password);

      dispatch({ type: 'SET_USER', payload: result.user });
      dispatch({ type: 'SET_TOKEN', payload: result.token });
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {error && (
        <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-md text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-input border-2 border-border rounded-md py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150"
            placeholder="tu@email.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input border-2 border-border rounded-md py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-ring focus:ring-2 transition-[border-color] duration-150"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-primary hover:bg-primary-hover text-primary-foreground font-medium py-3 rounded-md flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>Iniciar Sesión</span>
            <LogIn className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;
