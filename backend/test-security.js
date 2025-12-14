/**
 * Script de Pruebas de Seguridad
 *
 * Ejecutar: node test-security.js
 *
 * Requisitos:
 * - Servidor corriendo en http://localhost:3000
 * - Tener un token JWT válido (puedes obtenerlo registrando un usuario)
 */

const io = require('socket.io-client');
const axios = require('axios');

const SERVER_URL = 'http://localhost:3000';
let authToken = null;
let userId = null;
let username = null;
let roomId = null;

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 ${testName}`, 'blue');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Test 1: Sanitización XSS en Pistas
 */
async function testXSSSanitization() {
  logTest('Test 1: Sanitización XSS en Pistas');

  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      auth: { token: authToken },
    });

    socket.on('connect', () => {
      log('Conectado al servidor...', 'cyan');

      // Test 1.1: Script injection
      log('\n1.1 Probando script injection...', 'yellow');
      socket.emit('game:submitClue', {
        roomId: roomId,
        clue: '<script>alert("XSS")</script>',
      });

      // Test 1.2: HTML tags maliciosos
      setTimeout(() => {
        log('\n1.2 Probando HTML tags maliciosos...', 'yellow');
        socket.emit('game:submitClue', {
          roomId: roomId,
          clue: '<img src=x onerror=alert(1)>',
        });
      }, 1000);

      // Test 1.3: Caracteres especiales válidos
      setTimeout(() => {
        log('\n1.3 Probando caracteres especiales válidos...', 'yellow');
        socket.emit('game:submitClue', {
          roomId: roomId,
          clue: 'café mañana',
        });
      }, 2000);
    });

    socket.on('game:error', (error) => {
      logError(`Error recibido: ${error.message}`);
    });

    socket.on('game:clueSubmitted', (data) => {
      logSuccess(`Pista recibida: "${data.clue.clue}"`);
      // Verificar que está escapada
      if (data.clue.clue.includes('<') || data.clue.clue.includes('>')) {
        logError('⚠️  ADVERTENCIA: La pista contiene caracteres HTML sin escapar!');
      } else {
        logSuccess('✓ Pista correctamente sanitizada (HTML escapado)');
      }
    });

    setTimeout(() => {
      socket.disconnect();
      resolve();
    }, 5000);
  });
}

/**
 * Test 2: Rate Limiting
 */
async function testRateLimiting() {
  logTest('Test 2: Rate Limiting en WebSockets');

  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      auth: { token: authToken },
    });

    socket.on('connect', () => {
      log('Enviando múltiples pistas rápidamente (límite: 1 por 2 segundos)...', 'yellow');

      let requestCount = 0;
      let successCount = 0;
      let rateLimitCount = 0;

      const sendClue = () => {
        requestCount++;
        socket.emit('game:submitClue', {
          roomId: roomId,
          clue: `pista-rapida-${requestCount}`,
        });
      };

      // Enviar 3 pistas en menos de 2 segundos
      sendClue();
      setTimeout(sendClue, 500);
      setTimeout(sendClue, 1000);

      socket.on('game:error', (error) => {
        if (error.error === 'Rate limit excedido') {
          rateLimitCount++;
          logSuccess(`Rate limit funcionando: ${error.message}`);
        } else {
          logError(`Error: ${error.message}`);
        }
      });

      socket.on('game:clueSubmitted', () => {
        successCount++;
        logSuccess(`Pista ${successCount} aceptada`);
      });

      socket.on('rateLimitExceeded', (data) => {
        rateLimitCount++;
        logSuccess(`Rate limit excedido: ${data.message}`);
      });

      setTimeout(() => {
        log(`\nResultados: ${successCount} aceptadas, ${rateLimitCount} bloqueadas`, 'cyan');
        if (rateLimitCount > 0) {
          logSuccess('✓ Rate limiting funcionando correctamente');
        } else {
          logError('✗ Rate limiting NO está funcionando');
        }
        socket.disconnect();
        resolve();
      }, 3000);
    });
  });
}

/**
 * Test 3: Validación de Turnos
 */
async function testTurnValidation() {
  logTest('Test 3: Validación de Turnos');

  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      auth: { token: authToken },
    });

    socket.on('connect', () => {
      log('Intentando enviar pista fuera de turno...', 'yellow');

      // Intentar enviar pista (probablemente fuera de turno)
      socket.emit('game:submitClue', {
        roomId: roomId,
        clue: 'pista-fuera-de-turno',
      });
    });

    socket.on('game:error', (error) => {
      if (error.message.includes('turno')) {
        logSuccess(`Validación de turnos funcionando: ${error.message}`);
      } else {
        logWarning(`Otro error: ${error.message}`);
      }
    });

    socket.on('game:clueSubmitted', () => {
      logWarning('Pista aceptada (puede ser tu turno)');
    });

    setTimeout(() => {
      socket.disconnect();
      resolve();
    }, 2000);
  });
}

/**
 * Test 4: Sanitización de Username
 */
async function testUsernameSanitization() {
  logTest('Test 4: Sanitización de Username');

  const testUsernames = [
    '<script>alert(1)</script>',
    'José_María-123',
    'user<script>test</script>name',
    'a'.repeat(100), // Muy largo
  ];

  for (const testUsername of testUsernames) {
    try {
      log(`\nProbando username: "${testUsername.substring(0, 30)}..."`, 'yellow');

      const response = await axios.post(`${SERVER_URL}/api/auth/register`, {
        username: testUsername,
        email: `test${Date.now()}@example.com`,
        password: 'password123',
      });

      logSuccess(`Username aceptado: "${response.data.user.username}"`);
      if (response.data.user.username.includes('<') || response.data.user.username.includes('>')) {
        logError('⚠️  ADVERTENCIA: Username contiene HTML sin escapar!');
      }
    } catch (error) {
      if (error.response) {
        log(`Username rechazado: ${error.response.data.message}`, 'yellow');
        logSuccess('✓ Validación funcionando');
      } else {
        logError(`Error: ${error.message}`);
      }
    }
  }
}

/**
 * Test 5: Rate Limiting en API REST
 */
async function testAPIRateLimiting() {
  logTest('Test 5: Rate Limiting en API REST (Login)');

  log('Enviando 6 intentos de login fallidos (límite: 5 por 15 minutos)...', 'yellow');

  let successCount = 0;
  let rateLimitCount = 0;

  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(
        `${SERVER_URL}/api/auth/login`,
        {
          email: 'wrong@example.com',
          password: 'wrongpassword',
        },
        {
          validateStatus: () => true, // Aceptar todos los códigos de estado
        },
      );

      if (response.status === 429) {
        rateLimitCount++;
        logSuccess(`Intento ${i}: Rate limit activado (${response.status})`);
        log(`   Mensaje: ${response.data.message}`, 'cyan');
      } else if (response.status === 401) {
        successCount++;
        log(`Intento ${i}: Rechazado por credenciales inválidas (${response.status})`, 'yellow');
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        rateLimitCount++;
        logSuccess(`Intento ${i}: Rate limit activado`);
      } else {
        logError(`Error en intento ${i}: ${error.message}`);
      }
    }

    // Pequeña pausa entre intentos
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  log(
    `\nResultados: ${successCount} rechazados, ${rateLimitCount} bloqueados por rate limit`,
    'cyan',
  );
  if (rateLimitCount > 0) {
    logSuccess('✓ Rate limiting en API funcionando');
  } else {
    logWarning('⚠️  Rate limiting puede no estar funcionando (verificar configuración)');
  }
}

/**
 * Setup inicial: Registrar usuario y obtener token
 */
async function setup() {
  logTest('Setup: Creando usuario de prueba');

  try {
    // Registrar usuario
    const registerResponse = await axios.post(`${SERVER_URL}/api/auth/register`, {
      username: `testuser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    authToken = registerResponse.data.token;
    userId = registerResponse.data.user.id;
    username = registerResponse.data.user.username;

    logSuccess(`Usuario creado: ${username}`);
    logSuccess(`Token obtenido: ${authToken.substring(0, 20)}...`);

    // Crear sala (necesitarías implementar esto o usar una sala existente)
    logWarning('⚠️  Nota: Necesitas crear una sala manualmente o ajustar roomId');
    logWarning('   Por ahora, algunos tests pueden fallar sin roomId válido');

    return true;
  } catch (error) {
    logError(`Error en setup: ${error.message}`);
    if (error.response) {
      logError(`Respuesta: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

/**
 * Función principal
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔒 PRUEBAS DE SEGURIDAD - JUEGO IMPOSTOR', 'blue');
  log('='.repeat(60) + '\n', 'cyan');

  // Setup
  const setupSuccess = await setup();
  if (!setupSuccess) {
    logError('No se pudo completar el setup. Abortando pruebas.');
    return;
  }

  // Ejecutar tests
  try {
    // Test 1: XSS Sanitization
    await testXSSSanitization();

    // Test 2: Rate Limiting
    await testRateLimiting();

    // Test 3: Turn Validation
    await testTurnValidation();

    // Test 4: Username Sanitization
    await testUsernameSanitization();

    // Test 5: API Rate Limiting
    await testAPIRateLimiting();

    log('\n' + '='.repeat(60), 'cyan');
    log('✅ PRUEBAS COMPLETADAS', 'green');
    log('='.repeat(60) + '\n', 'cyan');
    log(
      'Revisa los resultados arriba para verificar que todas las medidas de seguridad están funcionando.',
      'cyan',
    );
  } catch (error) {
    logError(`Error ejecutando tests: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  // Verificar que axios esté instalado
  try {
    require('axios');
  } catch (e) {
    console.error('❌ Error: axios no está instalado.');
    console.log('   Instala con: npm install axios');
    process.exit(1);
  }

  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testXSSSanitization,
  testRateLimiting,
  testTurnValidation,
  testUsernameSanitization,
  testAPIRateLimiting,
};
