# Guía de Pruebas de Seguridad

Esta guía explica cómo probar los puntos de vulnerabilidad y las medidas de seguridad implementadas en el juego Impostor.

## Requisitos Previos

1. Instalar dependencias del backend:
```bash
cd backend
npm install
```

2. Iniciar el servidor:
```bash
npm start
# o en modo desarrollo:
npm run dev
```

3. Herramientas recomendadas:
   - **Postman** o **Insomnia** para pruebas de API REST
   - **Navegador** con consola de desarrollador para pruebas WebSocket
   - **curl** para pruebas desde terminal

---

## 🚀 Inicio Rápido: Script Automatizado

La forma más rápida de probar las vulnerabilidades es usando el script automatizado:

```bash
# Desde el directorio backend
npm run test:security
```

Este script ejecuta automáticamente:
- ✅ Pruebas de sanitización XSS
- ✅ Pruebas de rate limiting
- ✅ Pruebas de validación de turnos
- ✅ Pruebas de sanitización de username
- ✅ Pruebas de rate limiting en API REST

**Nota**: El script crea un usuario de prueba automáticamente. Algunos tests pueden requerir que tengas una sala creada manualmente.

Para pruebas más detalladas y manuales, continúa leyendo las secciones siguientes.

---

## 1. Pruebas de Sanitización de Inputs (XSS)

### 1.1 Prueba de XSS en Pistas

**Objetivo**: Verificar que las pistas con código HTML/JavaScript son escapadas correctamente.

**Prueba 1: Script injection en pista**
```javascript
// En la consola del navegador o usando WebSocket directamente
socket.emit('game:submitClue', {
  roomId: 'tu-room-id',
  clue: '<script>alert("XSS")</script>'
});
```

**Resultado esperado**: 
- La pista debe ser escapada a: `&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;`
- No debe ejecutarse ningún JavaScript
- El servidor debe aceptar la pista pero mostrarla como texto plano

**Prueba 2: HTML tags en pista**
```javascript
socket.emit('game:submitClue', {
  roomId: 'tu-room-id',
  clue: '<img src=x onerror=alert(1)>'
});
```

**Resultado esperado**: 
- Debe ser escapado a: `&lt;img src=x onerror=alert(1)&gt;`
- No debe renderizar como HTML

**Prueba 3: Pista con caracteres especiales válidos**
```javascript
socket.emit('game:submitClue', {
  roomId: 'tu-room-id',
  clue: 'café mañana'
});
```

**Resultado esperado**: 
- Debe aceptar caracteres especiales (acentos) sin problemas
- Debe preservar los caracteres especiales válidos

### 1.2 Prueba de XSS en Username

**Prueba: Username con código malicioso**
```bash
# Usando curl para registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "<script>alert(1)</script>",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Resultado esperado**: 
- El username debe ser escapado o rechazado
- Si se acepta, debe mostrarse como texto plano en la UI

**Prueba: Username con caracteres especiales válidos**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "José_María-123",
    "email": "jose@example.com",
    "password": "password123"
  }'
```

**Resultado esperado**: 
- Debe aceptar caracteres especiales válidos (acentos, guiones, guiones bajos)

### 1.3 Prueba de Email Injection

**Prueba: Email con caracteres maliciosos**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com<script>alert(1)</script>",
    "password": "password123"
  }'
```

**Resultado esperado**: 
- Debe rechazar el email por formato inválido
- No debe aceptar emails con código HTML/JavaScript

---

## 2. Pruebas de Rate Limiting

### 2.1 Rate Limiting en Autenticación

**Prueba: Múltiples intentos de login fallidos**
```bash
# Ejecutar 6 veces seguidas (límite es 5 por 15 minutos)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "wrong@example.com",
      "password": "wrongpassword"
    }'
  echo ""
done
```

**Resultado esperado**: 
- Los primeros 5 intentos deben fallar con "Credenciales inválidas"
- El 6to intento debe retornar error 429 "Demasiados intentos"
- Debe incluir headers `RateLimit-*` con información del límite

**Verificar headers de rate limit:**
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Buscar headers como:
- `RateLimit-Limit`: 5
- `RateLimit-Remaining`: 4
- `RateLimit-Reset`: timestamp

### 2.2 Rate Limiting en WebSockets (Pistas)

**Prueba: Enviar múltiples pistas rápidamente**
```javascript
// En consola del navegador
const socket = io('http://localhost:3000', {
  auth: { token: 'tu-token-jwt' }
});

socket.on('connect', () => {
  // Intentar enviar 3 pistas en menos de 2 segundos (límite es 1 por 2 segundos)
  socket.emit('game:submitClue', { roomId: 'room1', clue: 'pista1' });
  socket.emit('game:submitClue', { roomId: 'room1', clue: 'pista2' });
  socket.emit('game:submitClue', { roomId: 'room1', clue: 'pista3' });
});

socket.on('rateLimitExceeded', (data) => {
  console.log('Rate limit excedido:', data);
  // Debe mostrar: "Has excedido el límite de game:submitClue"
});
```

**Resultado esperado**: 
- Solo la primera pista debe ser aceptada
- Las siguientes deben retornar evento `rateLimitExceeded` o `game:error`
- Debe incluir `retryAfter` en segundos

### 2.3 Rate Limiting en Salas

**Prueba: Múltiples uniones a salas**
```javascript
// Intentar unirse a 6 salas en menos de 1 minuto (límite es 5 por minuto)
for (let i = 0; i < 6; i++) {
  socket.emit('room:join', { roomId: `room${i}` });
}
```

**Resultado esperado**: 
- Las primeras 5 uniones deben funcionar
- La 6ta debe retornar error de rate limit

---

## 3. Pruebas de Validación de Turnos

### 3.1 Intentar Enviar Pista Fuera de Turno

**Prueba: Enviar pista cuando no es tu turno**
```javascript
// Conectarse como jugador 2
const socket2 = io('http://localhost:3000', {
  auth: { token: 'token-jugador-2' }
});

// Intentar enviar pista cuando es el turno del jugador 1
socket2.emit('game:submitClue', {
  roomId: 'room1',
  clue: 'mi-pista'
});

socket2.on('game:error', (error) => {
  console.log('Error esperado:', error);
  // Debe mostrar: "No es tu turno"
});
```

**Resultado esperado**: 
- Debe retornar error: "No es tu turno"
- El servidor debe validar que el jugador tiene el turno antes de procesar

### 3.2 Intentar Votar Fuera de Turno

**Prueba: Votar cuando no es tu turno**
```javascript
// Intentar votar cuando es el turno de otro jugador
socket2.emit('game:submitVote', {
  roomId: 'room1',
  votedPlayerId: 'player-id-1'
});

socket2.on('game:error', (error) => {
  // Debe mostrar: "No es tu turno de votar"
});
```

**Resultado esperado**: 
- Debe rechazar el voto con error de turno

---

## 4. Pruebas de Validación de Estado del Juego

### 4.1 Intentar Votar Durante Fase de Pistas

**Prueba: Votar cuando el juego está en fase de pistas**
```javascript
// Cuando el juego está en fase 'clues', intentar votar
socket.emit('game:submitVote', {
  roomId: 'room1',
  votedPlayerId: 'player-id'
});

socket.on('game:error', (error) => {
  // Debe mostrar: "No estás en la fase de votación"
});
```

**Resultado esperado**: 
- Debe rechazar el voto con error de fase

### 4.2 Intentar Enviar Pista Durante Fase de Votación

**Prueba: Enviar pista cuando el juego está en fase de votación**
```javascript
// Cuando el juego está en fase 'voting', intentar enviar pista
socket.emit('game:submitClue', {
  roomId: 'room1',
  clue: 'mi-pista'
});

socket.on('game:error', (error) => {
  // Debe mostrar: "No estás en la fase de pistas"
});
```

**Resultado esperado**: 
- Debe rechazar la pista con error de fase

---

## 5. Pruebas de Autenticación

### 5.1 Acceso sin Token

**Prueba: Intentar conectar WebSocket sin token**
```javascript
const socket = io('http://localhost:3000');
// Sin auth token

socket.on('connect_error', (error) => {
  console.log('Error de conexión:', error);
  // Debe mostrar: "Token requerido" o "Token inválido"
});
```

**Resultado esperado**: 
- La conexión debe ser rechazada
- Debe retornar error de autenticación

### 5.2 Token Inválido

**Prueba: Conectar con token inválido**
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'token-invalido-123' }
});

socket.on('connect_error', (error) => {
  // Debe mostrar: "Token inválido"
});
```

**Resultado esperado**: 
- Debe rechazar la conexión

### 5.3 Acceso a Rutas Protegidas sin Token

**Prueba: Acceder a /api/auth/me sin token**
```bash
curl http://localhost:3000/api/auth/me
```

**Resultado esperado**: 
- Debe retornar 401 Unauthorized

**Prueba: Acceder con token válido**
```bash
# Primero obtener token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Luego usar el token
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado**: 
- Debe retornar información del usuario

---

## 6. Pruebas de Prevención de Trampas

### 6.1 Intentar Enviar Pista Duplicada

**Prueba: Enviar la misma pista dos veces**
```javascript
socket.emit('game:submitClue', { roomId: 'room1', clue: 'palabra' });
// Esperar confirmación
socket.emit('game:submitClue', { roomId: 'room1', clue: 'palabra' }); // Duplicada

socket.on('game:error', (error) => {
  // Debe mostrar: "Esta pista ya fue usada por otro jugador"
});
```

**Resultado esperado**: 
- La segunda pista debe ser rechazada
- Debe validar contra todas las pistas existentes (case-insensitive)

### 6.2 Intentar Usar la Palabra Secreta como Pista

**Prueba: Si conoces la palabra secreta, intentar usarla**
```javascript
// Si eres ciudadano y conoces la palabra secreta
socket.emit('game:submitClue', {
  roomId: 'room1',
  clue: 'palabra-secreta' // La palabra secreta real
});

socket.on('game:error', (error) => {
  // Debe mostrar: "No puedes usar la palabra secreta como pista"
});
```

**Resultado esperado**: 
- Debe rechazar la pista
- El servidor debe validar contra la palabra secreta

### 6.3 Intentar Votar por Sí Mismo

**Prueba: Votar por tu propio userId**
```javascript
socket.emit('game:submitVote', {
  roomId: 'room1',
  votedPlayerId: socket.userId // Tu propio ID
});

socket.on('game:error', (error) => {
  // Debe mostrar: "No puedes votar por ti mismo"
});
```

**Resultado esperado**: 
- Debe rechazar el voto

### 6.4 Intentar Iniciar Juego sin Ser Host

**Prueba: Jugador no-host intenta iniciar juego**
```javascript
// Conectarse como jugador que no es el host
socket.emit('game:start', { roomId: 'room1' });

socket.on('game:error', (error) => {
  // Debe mostrar: "Solo el host puede iniciar el juego"
});
```

**Resultado esperado**: 
- Debe rechazar la acción
- Solo el host (creador de la sala) puede iniciar

---

## 7. Pruebas de Límites de Longitud

### 7.1 Pista Demasiado Larga

**Prueba: Enviar pista de más de 50 caracteres**
```javascript
const longClue = 'a'.repeat(100); // 100 caracteres
socket.emit('game:submitClue', {
  roomId: 'room1',
  clue: longClue
});
```

**Resultado esperado**: 
- La pista debe ser truncada a 50 caracteres
- O debe ser rechazada si la validación es estricta

### 7.2 Username Demasiado Largo

**Prueba: Registrar usuario con nombre muy largo**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$(python -c 'print(\"a\" * 100)')\",
    \"email\": \"test@example.com\",
    \"password\": \"password123\"
  }"
```

**Resultado esperado**: 
- Debe truncar o rechazar el username
- Límite es 30 caracteres

---

## 8. Script de Pruebas Automatizadas

Puedes crear un script Node.js para automatizar algunas pruebas:

```javascript
// test-security.js
const io = require('socket.io-client');

async function testSecurity() {
  console.log('🧪 Iniciando pruebas de seguridad...\n');

  // 1. Prueba de sanitización XSS
  console.log('1. Probando sanitización XSS...');
  const socket = io('http://localhost:3000', {
    auth: { token: 'tu-token' }
  });

  socket.on('connect', () => {
    socket.emit('game:submitClue', {
      roomId: 'test-room',
      clue: '<script>alert("XSS")</script>'
    });
  });

  socket.on('game:error', (error) => {
    console.log('   ✅ Error capturado:', error.message);
  });

  // 2. Prueba de rate limiting
  console.log('2. Probando rate limiting...');
  for (let i = 0; i < 3; i++) {
    socket.emit('game:submitClue', {
      roomId: 'test-room',
      clue: `pista${i}`
    });
  }

  socket.on('rateLimitExceeded', (data) => {
    console.log('   ✅ Rate limit funcionando:', data.message);
  });

  // Agregar más pruebas...
}

testSecurity();
```

---

## 9. Checklist de Seguridad

Usa este checklist para verificar que todas las medidas están funcionando:

- [ ] **Sanitización XSS**: Las pistas con HTML/JS son escapadas
- [ ] **Sanitización Username**: Los usernames maliciosos son sanitizados
- [ ] **Sanitización Email**: Los emails inválidos son rechazados
- [ ] **Rate Limiting Auth**: Múltiples intentos de login son bloqueados
- [ ] **Rate Limiting WebSocket**: Spam de eventos es bloqueado
- [ ] **Validación de Turnos**: No se pueden saltar turnos
- [ ] **Validación de Estado**: No se pueden hacer acciones fuera de fase
- [ ] **Autenticación**: Acceso sin token es rechazado
- [ ] **Prevención de Trampas**: Pistas duplicadas son rechazadas
- [ ] **Límites de Longitud**: Inputs largos son truncados/rechazados

---

## 10. Herramientas Adicionales

### OWASP ZAP (Zed Attack Proxy)
Para pruebas más avanzadas de seguridad:
```bash
# Instalar OWASP ZAP
# https://www.zaproxy.org/download/

# Ejecutar escaneo básico
zap-cli quick-scan --self-contained http://localhost:3000
```

### Burp Suite
Para análisis más profundo de vulnerabilidades web.

---

## Notas Importantes

1. **No ejecutar estas pruebas en producción**: Solo en entorno de desarrollo
2. **Monitorear logs del servidor**: Verificar que los errores se registran correctamente
3. **Revisar respuestas del servidor**: Asegurarse de que no se expone información sensible en errores
4. **Probar con múltiples clientes**: Simular ataques desde diferentes IPs/usuarios

---

## Contacto y Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad real, por favor:
1. No la publiques públicamente
2. Reporta al equipo de desarrollo
3. Proporciona detalles específicos y pasos para reproducir
