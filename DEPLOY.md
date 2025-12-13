# 🚀 Guía de Deploy - Juego Impostor Multijugador

Esta guía te ayudará a desplegar el juego Impostor multijugador en producción usando servicios gratuitos.

## 📋 Prerequisitos

- Cuenta de GitHub con el repositorio del proyecto
- Cuenta en [Railway](https://railway.app) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)

## 🎯 Arquitectura de Deploy

```
Frontend (Vercel) → Backend (Railway) → WebSocket (Socket.io)
```

---

## 🔧 Paso 1: Deploy del Backend en Railway

### 1.1 Crear cuenta y proyecto en Railway

1. Ve a [https://railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Haz clic en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Conecta tu repositorio de GitHub
6. Selecciona el repositorio del juego Impostor

### 1.2 Configurar el servicio

1. Railway detectará automáticamente que es un proyecto Node.js
2. **IMPORTANTE**: Configura el **Root Directory** como `backend`
   - Ve a Settings → Root Directory → Ingresa `backend`
3. Railway ejecutará automáticamente `npm install` y `npm start`

### 1.3 Configurar variables de entorno

Ve a **Variables** en el panel de Railway y agrega:

```bash
# Puerto (Railway lo asigna automáticamente, pero puedes especificarlo)
PORT=3000

# URL del frontend (se actualizará después del deploy del frontend)
# Por ahora, usa una URL temporal o déjalo vacío
FRONTEND_URL=https://tu-frontend.vercel.app

# JWT Secret (genera uno seguro)
# Ejecuta en tu terminal local:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<pega-el-secreto-generado-aqui>

# Entorno
NODE_ENV=production

# Host (0.0.0.0 para escuchar en todas las interfaces)
HOST=0.0.0.0
```

### 1.4 Obtener URL del backend

1. Una vez desplegado, Railway te dará una URL como:
   - `https://impostor-backend-production.up.railway.app`
2. **Copia esta URL** - la necesitarás para el frontend
3. Actualiza `FRONTEND_URL` en Railway con la URL de Vercel (después del paso 2)

### 1.5 Verificar el deploy

1. Abre la URL del backend en tu navegador
2. Deberías ver un error 404 (normal, no hay ruta raíz)
3. Prueba: `https://tu-backend.railway.app/api/health`
4. Deberías recibir: `{"status":"ok","message":"Servidor funcionando correctamente"}`

---

## 🎨 Paso 2: Deploy del Frontend en Vercel

### 2.1 Crear cuenta y proyecto en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Inicia sesión con GitHub
3. Haz clic en **"Add New..."** → **"Project"**
4. Importa tu repositorio de GitHub
5. Selecciona el repositorio del juego Impostor

### 2.2 Configurar el proyecto

En la configuración del proyecto:

- **Framework Preset**: Other
- **Root Directory**: `frontend` (cambiar de `.` a `frontend`)
- **Build Command**: (dejar vacío - es un proyecto estático)
- **Output Directory**: `.` (raíz del frontend)
- **Install Command**: `npm install` (opcional, solo si hay dependencias)

### 2.3 Configurar variables de entorno

Ve a **Settings** → **Environment Variables** y agrega:

```bash
# URL del backend en Railway
SERVER_URL=https://tu-backend.railway.app
```

**Nota**: Vercel no inyecta automáticamente variables de entorno en proyectos estáticos. 
El archivo `config.js` detectará automáticamente el entorno y construirá la URL.

### 2.4 Deploy

1. Haz clic en **"Deploy"**
2. Vercel desplegará automáticamente
3. Obtendrás una URL como: `https://impostor-frontend.vercel.app`

### 2.5 Actualizar configuración del backend

1. Vuelve a Railway
2. Actualiza la variable `FRONTEND_URL` con la URL de Vercel:
   ```
   FRONTEND_URL=https://impostor-frontend.vercel.app
   ```
3. Railway reiniciará automáticamente el servicio

---

## ✅ Paso 3: Verificación y Testing

### 3.1 Verificar Backend

```bash
# Health check
curl https://tu-backend.railway.app/api/health

# Debería responder:
# {"status":"ok","message":"Servidor funcionando correctamente",...}
```

### 3.2 Verificar Frontend

1. Abre la URL de Vercel en tu navegador
2. Abre la consola del navegador (F12)
3. Deberías ver: `🔧 Configuración de la aplicación: {...}`
4. Verifica que `SERVER_URL` apunte al backend correcto

### 3.3 Testing completo

**Checklist de pruebas:**

- [ ] ✅ Backend responde en `/api/health`
- [ ] ✅ Frontend carga correctamente
- [ ] ✅ WebSocket se conecta (ver en Network → WS)
- [ ] ✅ Registro de usuario funciona
- [ ] ✅ Login funciona
- [ ] ✅ Crear sala funciona
- [ ] ✅ Unirse a sala funciona
- [ ] ✅ Envío de pistas funciona
- [ ] ✅ Votación funciona
- [ ] ✅ Sincronización entre múltiples clientes funciona
- [ ] ✅ CORS funciona (no hay errores en consola)

### 3.4 Testing multijugador

1. Abre el juego en dos navegadores diferentes (o ventana incógnito)
2. Registra dos usuarios diferentes
3. Crea una sala desde el primer usuario
4. Únete a la sala desde el segundo usuario
5. Verifica que ambos vean los cambios en tiempo real

---

## 🔧 Solución de Problemas

### Error: CORS bloqueado

**Síntoma**: Error en consola del navegador sobre CORS

**Solución**:
1. Verifica que `FRONTEND_URL` en Railway incluya la URL exacta de Vercel
2. Puedes usar múltiples URLs separadas por comas:
   ```
   FRONTEND_URL=https://impostor-frontend.vercel.app,https://impostor-frontend-git-main.vercel.app
   ```

### Error: WebSocket no se conecta

**Síntoma**: El juego no se conecta al servidor

**Solución**:
1. Verifica que la URL del backend sea correcta en `config.js`
2. Verifica que Railway esté corriendo (ve a Railway dashboard)
3. Verifica los logs de Railway para ver errores

### Error: Socket.io no se carga

**Síntoma**: Error en consola sobre Socket.io

**Solución**:
1. El frontend usa CDN de Socket.io en producción automáticamente
2. Si falla, verifica tu conexión a internet
3. El fallback debería cargar desde el CDN automáticamente

### Error: Variables de entorno no funcionan

**Síntoma**: El frontend usa localhost en producción

**Solución**:
1. Vercel no inyecta variables en proyectos estáticos por defecto
2. El archivo `config.js` detecta automáticamente el entorno
3. Si necesitas forzar una URL, puedes editar `config.js` temporalmente

---

## 📝 URLs de Producción

Después del deploy, actualiza estos archivos con tus URLs:

- `README.md` - Agregar sección de "Demo en vivo"
- `backend/README.md` - Agregar URL de producción
- `frontend/README.md` - Agregar URL de producción

---

## 🔄 Actualizaciones Futuras

### Deploy automático

Tanto Railway como Vercel hacen deploy automático cuando haces push a la rama principal:

```bash
git add .
git commit -m "Actualización"
git push origin main
```

Railway y Vercel detectarán los cambios y desplegarán automáticamente.

### Variables de entorno actualizadas

Si necesitas cambiar variables de entorno:

1. **Railway**: Settings → Variables → Editar
2. **Vercel**: Settings → Environment Variables → Editar
3. Los servicios se reiniciarán automáticamente

---

## 🎉 ¡Listo!

Tu juego Impostor multijugador está ahora en producción. Comparte las URLs con tus amigos y disfruta jugando online.

**Backend**: `https://tu-backend.railway.app`  
**Frontend**: `https://tu-frontend.vercel.app`

---

## 📚 Recursos Adicionales

- [Documentación de Railway](https://docs.railway.app)
- [Documentación de Vercel](https://vercel.com/docs)
- [Socket.io Deployment Guide](https://socket.io/docs/v4/deployment/)
