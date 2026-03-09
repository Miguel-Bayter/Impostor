# 🚀 Guía de Configuración

Esta guía te ayudará a configurar y ejecutar ambos proyectos (backend y frontend) de forma independiente.

## 📋 Prerequisitos

- Node.js (v14 o superior)
- npm o yarn

## 🔧 Configuración Inicial

### 1. Backend

```bash
# Ir al directorio del backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
# Copia el contenido de env.example.txt o crea un archivo .env con:
PORT=3000
FRONTEND_URL=http://localhost:5500
JWT_SECRET=tu_secreto_super_seguro_aqui

# Iniciar servidor
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### 2. Frontend

```bash
# Ir al directorio del frontend
cd frontend

# Instalar dependencias (opcional, solo si usas el servidor de desarrollo)
npm install

# Opción A: Usar servidor de desarrollo incluido
npm run dev

# Opción B: Usar cualquier servidor estático
# Por ejemplo, con Python:
# python -m http.server 5500

# Opción C: Usar Live Server (extensión de VS Code)
```

El frontend estará disponible en `http://localhost:5500`

## 🔌 Conexión entre Frontend y Backend

El frontend se conecta automáticamente al backend en `http://localhost:3000` mediante Socket.io.

Si cambias el puerto del backend, actualiza la URL en `frontend/index.html`:

```html
<script src="http://localhost:3000/socket.io/socket.io.js"></script>
```

## ✅ Verificar que Todo Funciona

1. **Backend**: Abre `http://localhost:3000/api/health` en tu navegador. Deberías ver:
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente",
  "timestamp": "..."
}
```

2. **Frontend**: Abre `http://localhost:5500` y verifica que la página carga correctamente.

3. **Conexión WebSocket**: Abre la consola del navegador (F12) y verifica que no haya errores de conexión.

## 🐛 Solución de Problemas

### Error: "Cannot find module"
- Asegúrate de haber ejecutado `npm install` en el directorio correspondiente (backend o frontend)

### Error: "Port already in use"
- Cambia el puerto en el archivo `.env` del backend o en el script del frontend

### Error: "CORS policy"
- Verifica que `FRONTEND_URL` en el `.env` del backend coincida con la URL donde está corriendo el frontend

### Socket.io no se carga
- Asegúrate de que el backend esté corriendo antes de abrir el frontend
- Verifica que la URL en `index.html` sea correcta

## 📝 Notas

- Cada proyecto es completamente independiente
- Puedes ejecutar solo el backend o solo el frontend
- Para funcionalidad completa, ambos deben estar corriendo simultáneamente

