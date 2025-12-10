# 🎮 Juego Impostor - Proyecto Multijugador

Juego social multijugador online donde debes descubrir quién es el impostor antes de que sea demasiado tarde.

## 📁 Estructura del Proyecto

Este repositorio contiene **dos proyectos completamente separados**:

```
Impostor/
├── backend/          # Proyecto Backend (Node.js + Express + Socket.io)
│   ├── package.json
│   ├── server.js
│   └── ...
│
├── frontend/        # Proyecto Frontend (HTML/CSS/JavaScript)
│   ├── package.json
│   ├── index.html
│   └── ...
│
└── README.md        # Este archivo
```

## 🚀 Inicio Rápido

### Backend

```bash
cd backend
npm install
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5500`

## 📋 Estado del Proyecto

### ✅ Fase 1: Configuración Inicial (COMPLETADA)
- [x] Stack tecnológico elegido (Node.js + Express + Socket.io)
- [x] Proyecto backend configurado
- [x] Proyecto frontend configurado
- [x] Estructura de carpetas creada
- [x] Servidor básico funcionando

### 🔄 Próximas Fases
- [ ] Fase 2: Autenticación
- [ ] Fase 3: Sistema de Salas
- [ ] Fase 4: Lógica del Juego
- [ ] Fase 5: WebSockets
- [ ] Fase 6: Frontend
- [ ] Fase 7: Seguridad
- [ ] Fase 8: Deploy

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **WebSockets**: Socket.io
- **Base de Datos**: (Por implementar - MongoDB/PostgreSQL)

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos
- **JavaScript (Vanilla)** - Lógica del juego
- **Socket.io Client** - Comunicación en tiempo real

## 📚 Documentación

- `backend/README.md` - Documentación del backend
- `frontend/README.md` - Documentación del frontend
- `tecnologias_multijugador.md` - Guía completa de tecnologías y arquitectura

## 🔧 Configuración

### Backend

Copia `env.example.txt` a `backend/.env` y configura las variables de entorno:

```env
PORT=3000
FRONTEND_URL=http://localhost:5500
JWT_SECRET=tu_secreto_super_seguro_aqui
```

### Frontend

El frontend no requiere configuración adicional. Asegúrate de que el backend esté corriendo para la funcionalidad multijugador.

## 🎯 Funcionalidades Actuales

- ✅ Interfaz de usuario completa
- ✅ Lógica del juego local
- ✅ Servidor backend básico con Express
- ✅ Configuración de Socket.io
- ✅ Estructura preparada para multijugador

## 🤝 Contribuir

Este proyecto está en desarrollo activo. Las contribuciones son bienvenidas.

## 📄 Licencia

MIT
