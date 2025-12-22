/**
 * Configuración dinámica del frontend
 */

interface CustomWindow extends Window {
  SERVER_URL?: string;
}

const isProduction =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const PRODUCTION_SERVER_URL = 'https://impostor-production-cb9c.up.railway.app';

let SERVER_URL: string;

if (isProduction) {
  SERVER_URL =
    PRODUCTION_SERVER_URL ||
    (window as CustomWindow).SERVER_URL ||
    import.meta.env.VITE_SERVER_URL ||
    (window.location.protocol === 'https:'
      ? `https://${window.location.hostname.replace('impostor-frontend', 'impostor-backend')}`
      : `http://${window.location.hostname}:3000`);
} else {
  SERVER_URL = ((window as CustomWindow).SERVER_URL ||
    import.meta.env.VITE_SERVER_URL ||
    'http://localhost:3000') as string;
}

export const APP_CONFIG = {
  SERVER_URL,
  IS_PRODUCTION: isProduction,
};

export default APP_CONFIG;
