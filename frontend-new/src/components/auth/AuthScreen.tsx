import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-full flex items-center justify-center p-4 bg-background min-h-[calc(100dvh-126px)]">
      <div className="w-full max-w-xl bg-card p-8 rounded-2xl border border-border shadow-xl">
        {/* Logo/Icon */}
        <div className="w-20 h-20 mx-auto mb-12 bg-linear-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-4xl shadow-md">
          🕵️‍♂️
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            {isLogin ? 'Impostor' : 'Únete al Juego'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Inicia sesión para descubrir quién es el impostor' : 'Crea tu cuenta y empieza a jugar'}
          </p>
        </div>

        {/* Forms */}
        {isLogin ? (
          <div key="login">
            <LoginForm />
          </div>
        ) : (
          <div key="register">
            <RegisterForm />
          </div>
        )}

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary-light transition-colors duration-150 text-sm font-medium"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate →' : '¿Ya tienes cuenta? Inicia sesión →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
