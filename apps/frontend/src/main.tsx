import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from './components/ui/sonner';
import { GameProvider } from './context/GameProvider';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen bg-background text-foreground">
      <ErrorBoundary>
        <GameProvider>
          <App />
          <Toaster />
        </GameProvider>
      </ErrorBoundary>
    </div>
  </StrictMode>
);
