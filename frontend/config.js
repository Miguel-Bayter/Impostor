/**
 * Configuración dinámica del frontend
 * Permite configurar URLs del backend según el entorno (desarrollo/producción)
 */

// Detectar si estamos en producción (Vercel inyecta esta variable)
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// URL del servidor backend
// En producción: usar variable de entorno de Vercel o construir desde window.location
// En desarrollo: usar localhost
let SERVER_URL;

if (isProduction) {
  // En producción, intentar obtener de variable de entorno o usar el mismo dominio
  // Vercel puede inyectar esto como variable de entorno en build time
  SERVER_URL = window.SERVER_URL || 
               process?.env?.SERVER_URL || 
               process?.env?.VITE_SERVER_URL ||
               // Si no está configurado, intentar construir desde el dominio actual
               (window.location.protocol === 'https:' 
                 ? `https://${window.location.hostname.replace('impostor-frontend', 'impostor-backend')}`
                 : `http://${window.location.hostname}:3000`);
} else {
  // En desarrollo, usar localhost
  SERVER_URL = window.SERVER_URL || 'http://localhost:3000';
}

// URL para cargar Socket.io client
// En producción: usar CDN
// En desarrollo: cargar desde el backend local
const SOCKET_IO_CDN = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
const SOCKET_IO_LOCAL = `${SERVER_URL}/socket.io/socket.io.js`;

// Determinar si usar CDN o servidor local
const USE_SOCKET_IO_CDN = isProduction || window.USE_SOCKET_IO_CDN === true;

// Exportar configuración
window.APP_CONFIG = {
  SERVER_URL: SERVER_URL,
  SOCKET_IO_URL: USE_SOCKET_IO_CDN ? SOCKET_IO_CDN : SOCKET_IO_LOCAL,
  USE_SOCKET_IO_CDN: USE_SOCKET_IO_CDN,
  IS_PRODUCTION: isProduction
};

// También exponer SERVER_URL globalmente para compatibilidad
window.SERVER_URL = SERVER_URL;

console.log('🔧 Configuración de la aplicación:', window.APP_CONFIG);
