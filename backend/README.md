# 🎮 Impostor - Backend

Servidor backend del juego Impostor multijugador construido con Node.js, Express y Socket.io.

## 📋 Requisitos

- Node.js (v14 o superior)
- npm o yarn

## 🚀 Instalación

```bash
# Instalar dependencias
npm install
```

## ⚙️ Configuración

1. Copiar el archivo de ejemplo de variables de entorno:
```bash
cp ../env.example.txt .env
```

2. Editar `.env` con tus configuraciones:
```env
PORT=3000
FRONTEND_URL=http://localhost:5500
JWT_SECRET=tu_secreto_super_seguro_aqui
```

## 🏃 Ejecutar

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura

```
backend/
├── server.js           # Servidor principal
├── routes/             # Rutas API REST (futuras fases)
├── sockets/            # Handlers de WebSockets (futuras fases)
├── models/             # Modelos de base de datos (futuras fases)
├── middleware/         # Middleware (auth, validación) (futuras fases)
└── utils/              # Utilidades (futuras fases)
```

## 🔌 Endpoints

- `GET /api/health` - Health check del servidor
- `GET /` - Sirve el frontend (si está configurado)

## 📡 WebSockets

- Evento `ping` - Prueba de conexión
- Evento `pong` - Respuesta del servidor

## 📝 Notas

Este es un proyecto independiente. Para desarrollo completo, también necesitarás ejecutar el frontend.

