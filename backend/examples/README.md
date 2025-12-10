# Ejemplos de Autenticación por WebSocket

Este directorio contiene ejemplos de cómo usar el sistema de autenticación por WebSocket.

## Archivos

- `websocket-auth-example.js` - Ejemplos en JavaScript puro (Node.js o navegador)
- `websocket-auth-html-example.html` - Ejemplo completo en HTML que puedes abrir directamente en el navegador

## Cómo usar

### Opción 1: Ejemplo HTML (Más fácil)

1. Asegúrate de que el servidor esté corriendo:
```bash
cd backend
npm install
npm run dev
```

2. Abre el archivo `websocket-auth-html-example.html` en tu navegador
   - Puedes usar un servidor local como Live Server en VS Code
   - O simplemente abrirlo directamente (file://)

3. Usa la interfaz para:
   - Registrarte con un nuevo usuario
   - O iniciar sesión con un usuario existente
   - Conectarte al juego después de autenticarte

### Opción 2: Ejemplo JavaScript

Incluye el código de `websocket-auth-example.js` en tu proyecto y usa las funciones o la clase `WebSocketAuth`.

## Eventos WebSocket

### Namespace `/auth` (Sin autenticación requerida)

#### `auth:register`
Registra un nuevo usuario.

**Enviar:**
```javascript
socket.emit('auth:register', {
  username: 'nombre_usuario',
  email: 'usuario@ejemplo.com',
  password: 'contraseña123'
});
```

**Recibir éxito:**
```javascript
socket.on('auth:register:success', (data) => {
  console.log(data.token); // Token JWT
  console.log(data.user);  // Información del usuario
});
```

**Recibir error:**
```javascript
socket.on('auth:error', (error) => {
  console.error(error.message);
});
```

#### `auth:login`
Inicia sesión con un usuario existente.

**Enviar:**
```javascript
socket.emit('auth:login', {
  email: 'usuario@ejemplo.com',
  password: 'contraseña123'
});
```

**Recibir éxito:**
```javascript
socket.on('auth:login:success', (data) => {
  console.log(data.token); // Token JWT
  console.log(data.user);  // Información del usuario
});
```

**Recibir error:**
```javascript
socket.on('auth:error', (error) => {
  console.error(error.message);
});
```

### Namespace Principal `/` (Requiere autenticación)

Para conectarte al namespace principal, necesitas el token obtenido del registro/login:

```javascript
const gameSocket = io('http://localhost:3000', {
  auth: {
    token: 'tu_token_jwt_aqui'
  }
});
```

Una vez conectado, puedes usar todos los eventos del juego (ping, pong, etc.).

## Flujo Completo

```javascript
// 1. Conectar al namespace de autenticación
const authSocket = io('http://localhost:3000/auth');

// 2. Registrar o hacer login
authSocket.emit('auth:register', {
  username: 'usuario1',
  email: 'user1@test.com',
  password: 'pass123'
});

// 3. Recibir token
authSocket.on('auth:register:success', (data) => {
  const token = data.token;
  
  // 4. Conectar al namespace principal con el token
  const gameSocket = io('http://localhost:3000', {
    auth: { token: token }
  });
  
  // 5. Usar el socket del juego
  gameSocket.on('connect', () => {
    console.log('Conectado al juego!');
    gameSocket.emit('ping');
  });
});
```

## Clase Helper

Para facilitar el uso, puedes usar la clase `WebSocketAuth`:

```javascript
const auth = new WebSocketAuth('http://localhost:3000');

// Registrar
const result = await auth.register('usuario', 'user@test.com', 'pass123');

// O hacer login
const result = await auth.login('user@test.com', 'pass123');

// Conectar al juego
const gameSocket = await auth.connectToGame();

// Usar el socket
gameSocket.emit('ping');
```

## Notas Importantes

1. **El namespace `/auth` no requiere token** - Es público y solo se usa para registro/login
2. **El namespace principal `/` requiere token** - Debes autenticarte primero
3. **Guarda el token** - Usa localStorage o sessionStorage para persistir la sesión
4. **Maneja errores** - Siempre escucha el evento `auth:error` y `connect_error`

## Diferencias con HTTP REST

| Característica | HTTP REST | WebSocket |
|---------------|-----------|-----------|
| Conexión | Request/Response | Persistente |
| Overhead | Mayor | Menor |
| Tiempo real | No | Sí |
| Uso | Registro/Login | Registro/Login + Juego |

Ambos métodos están disponibles. Elige el que mejor se adapte a tu caso de uso.

