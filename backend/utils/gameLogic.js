/**
 * Utilidades de Lógica del Juego
 * Fase 4: Lógica del Juego
 * 
 * Contiene funciones para validación, palabras secretas y lógica del juego
 */

// Base de datos de palabras secretas
const WORDS_DATABASE = [
    // Animales
    'vaca', 'perro', 'gato', 'león', 'tigre', 'elefante', 'jirafa', 'zebra',
    'oso', 'lobo', 'conejo', 'ardilla', 'pájaro', 'águila', 'pez', 'delfín',
    'ballena', 'tiburón', 'caballo', 'cerdo', 'oveja', 'gallina', 'pato',
    
    // Comida
    'pizza', 'hamburguesa', 'pasta', 'ensalada', 'sopa', 'sandwich', 'taco',
    'sushi', 'helado', 'pastel', 'chocolate', 'manzana', 'plátano', 'naranja',
    'fresa', 'uva', 'pan', 'queso', 'leche', 'huevo', 'arroz', 'pollo',
    
    // Deportes
    'fútbol', 'baloncesto', 'tenis', 'natación', 'ciclismo', 'correr',
    'voleibol', 'béisbol', 'golf', 'boxeo', 'karate', 'yoga', 'gimnasia',
    
    // Profesiones
    'médico', 'profesor', 'bombero', 'policía', 'cocinero', 'ingeniero',
    'arquitecto', 'músico', 'artista', 'escritor', 'periodista', 'abogado',
    'piloto', 'enfermero', 'dentista', 'veterinario',
    
    // Lugares
    'hospital', 'escuela', 'parque', 'playa', 'montaña', 'ciudad', 'pueblo',
    'biblioteca', 'museo', 'cine', 'restaurante', 'hotel', 'aeropuerto',
    'estación', 'supermercado', 'iglesia', 'estadio',
    
    // Transporte
    'coche', 'autobús', 'tren', 'avión', 'barco', 'bicicleta', 'motocicleta',
    'helicóptero', 'submarino', 'metro', 'taxi',
    
    // Tecnología
    'computadora', 'teléfono', 'tablet', 'televisión', 'radio', 'cámara',
    'auriculares', 'ratón', 'teclado', 'impresora', 'internet', 'wifi',
    
    // Naturaleza
    'árbol', 'flor', 'hoja', 'agua', 'fuego', 'tierra', 'aire', 'sol',
    'luna', 'estrella', 'nube', 'lluvia', 'nieve', 'viento', 'mar',
    'río', 'lago', 'bosque', 'desierto', 'volcán',
    
    // Objetos del hogar
    'mesa', 'silla', 'cama', 'sofá', 'ventana', 'puerta', 'espejo',
    'lámpara', 'reloj', 'libro', 'pluma', 'cuaderno', 'maleta',
    
    // Ropa
    'camisa', 'pantalón', 'vestido', 'zapatos', 'sombrero', 'guantes',
    'bufanda', 'chaqueta', 'abrigo', 'calcetines', 'cinturón',
    
    // Instrumentos musicales
    'guitarra', 'piano', 'violín', 'trompeta', 'batería', 'flauta',
    'saxofón', 'arpa', 'tambor', 'acordeón',
    
    // Colores
    'rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado', 'rosa',
    'negro', 'blanco', 'gris', 'marrón', 'dorado', 'plateado',
    
    // Emociones
    'felicidad', 'tristeza', 'alegría', 'miedo', 'sorpresa', 'enojo',
    'amor', 'odio', 'esperanza', 'calma', 'ansiedad',
    
    // Acciones
    'correr', 'caminar', 'saltar', 'nadar', 'volar', 'bailar', 'cantar',
    'dormir', 'comer', 'beber', 'leer', 'escribir', 'dibujar', 'pintar',
    
    // Tiempo
    'mañana', 'tarde', 'noche', 'día', 'semana', 'mes', 'año', 'hora',
    'minuto', 'segundo', 'ayer', 'hoy', 'pasado', 'futuro',
    
    // Cuerpo humano
    'cabeza', 'brazo', 'pierna', 'mano', 'pie', 'ojo', 'oreja', 'nariz',
    'boca', 'diente', 'cabello', 'corazón', 'pulmón', 'hueso',
    
    // Materiales
    'madera', 'metal', 'plástico', 'vidrio', 'papel', 'tela', 'piedra',
    'arena', 'barro', 'hierro', 'oro', 'plata', 'diamante',
    
    // Formas
    'círculo', 'cuadrado', 'triángulo', 'rectángulo', 'óvalo', 'estrella',
    'corazón', 'diamante', 'hexágono', 'pentágono',
    
    // Estaciones
    'primavera', 'verano', 'otoño', 'invierno',
    
    // Días de la semana
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo',
    
    // Meses
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Obtiene una palabra aleatoria de la base de datos
 * @returns {string} Una palabra secreta aleatoria
 */
function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * WORDS_DATABASE.length);
    return WORDS_DATABASE[randomIndex];
}

/**
 * Verifica si una pista coincide exactamente con la palabra secreta
 * @param {string} clue - La pista ingresada por el jugador
 * @param {string} secretWord - La palabra secreta de la ronda
 * @returns {boolean} true si la pista coincide exactamente con la palabra secreta
 */
function checkWordGuess(clue, secretWord) {
    // Normalizar ambas palabras: eliminar espacios y convertir a minúsculas
    const normalizedClue = clue.trim().toLowerCase();
    const normalizedSecretWord = secretWord.toLowerCase();
    
    // Comparar si son exactamente iguales
    return normalizedClue === normalizedSecretWord;
}

/**
 * Valida que una pista no haya sido usada previamente
 * @param {string} clue - La pista a validar
 * @param {Array} existingClues - Array de objetos con pistas ya ingresadas {playerId, playerName, clue}
 * @returns {Object} Objeto con isValid (boolean) y errorMessage (string) si hay error
 */
function validateClueNotRepeated(clue, existingClues) {
    // Normalizar la pista ingresada para comparación
    const normalizedClue = clue.trim().toLowerCase();
    
    // Si no hay pistas existentes, la pista es válida
    if (!existingClues || existingClues.length === 0) {
        return { isValid: true, errorMessage: '' };
    }
    
    // Normalizar todas las pistas existentes y comparar
    const normalizedExistingClues = existingClues.map(c => c.clue.trim().toLowerCase());
    
    if (normalizedExistingClues.includes(normalizedClue)) {
        return {
            isValid: false,
            errorMessage: 'Esta pista ya fue usada por otro jugador. Por favor, ingresa otra palabra.'
        };
    }
    
    return { isValid: true, errorMessage: '' };
}

/**
 * Valida una pista completa (formato, no repetida, no es la palabra secreta)
 * @param {string} clue - La pista a validar
 * @param {Array} existingClues - Array de pistas existentes
 * @param {string} secretWord - Palabra secreta de la ronda
 * @returns {Object} Objeto con isValid (boolean) y errorMessage (string) si hay error
 */
function validateClue(clue, existingClues, secretWord) {
    // Validar que la pista no esté vacía
    if (!clue || !clue.trim()) {
        return {
            isValid: false,
            errorMessage: 'Por favor, ingresa una pista'
        };
    }
    
    // Validar longitud mínima
    if (clue.trim().length < 2) {
        return {
            isValid: false,
            errorMessage: 'La pista debe tener al menos 2 caracteres'
        };
    }
    
    // Validar que no esté repetida
    const repeatValidation = validateClueNotRepeated(clue, existingClues);
    if (!repeatValidation.isValid) {
        return repeatValidation;
    }
    
    // Validar que no sea la palabra secreta
    if (checkWordGuess(clue, secretWord)) {
        return {
            isValid: false,
            errorMessage: 'No puedes usar la palabra secreta como pista'
        };
    }
    
    return { isValid: true, errorMessage: '' };
}

/**
 * Valida un voto
 * @param {string} voterId - ID del jugador que vota
 * @param {string} votedPlayerId - ID del jugador votado
 * @param {Array} activePlayers - Array de jugadores activos (no eliminados)
 * @returns {Object} Objeto con isValid (boolean) y errorMessage (string) si hay error
 */
function validateVote(voterId, votedPlayerId, activePlayers) {
    // Verificar que el votante existe y está activo
    const voter = activePlayers.find(p => p.userId === voterId);
    if (!voter || voter.isEliminated) {
        return {
            isValid: false,
            errorMessage: 'El votante no es válido o ha sido eliminado'
        };
    }
    
    // Verificar que el votado existe y está activo
    const voted = activePlayers.find(p => p.userId === votedPlayerId);
    if (!voted || voted.isEliminated) {
        return {
            isValid: false,
            errorMessage: 'El jugador votado no es válido o ha sido eliminado'
        };
    }
    
    // Verificar que no se vote a sí mismo
    if (voterId === votedPlayerId) {
        return {
            isValid: false,
            errorMessage: 'No puedes votar por ti mismo'
        };
    }
    
    return { isValid: true, errorMessage: '' };
}

/**
 * Calcula los resultados de la votación
 * @param {Object} votes - Objeto {voterId: votedPlayerId}
 * @param {Array} players - Array de jugadores
 * @returns {Object} Objeto con mostVotedId, voteCounts, tiedPlayers
 */
function calculateVotingResults(votes, players) {
    // Contar votos
    const voteCounts = {};
    Object.values(votes).forEach(votedId => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });
    
    // Encontrar el más votado
    let maxVotes = 0;
    let mostVotedId = null;
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            mostVotedId = playerId;
        }
    });
    
    // Manejar empates (seleccionar aleatoriamente entre los empatados)
    const tiedPlayers = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([playerId, _]) => playerId);
    
    if (tiedPlayers.length > 1) {
        mostVotedId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
    }
    
    return {
        mostVotedId,
        voteCounts,
        tiedPlayers,
        maxVotes
    };
}

/**
 * Verifica las condiciones de victoria
 * @param {Array} players - Array de jugadores
 * @returns {Object} Objeto con winner ('citizens' | 'impostor' | null) y message
 */
function checkVictoryConditions(players) {
    const activePlayers = players.filter(p => !p.isEliminated);
    const activeImpostors = activePlayers.filter(p => p.isImpostor);
    const activeCitizens = activePlayers.filter(p => !p.isImpostor);
    
    // Si no quedan impostores, ganan los ciudadanos
    if (activeImpostors.length === 0) {
        return {
            winner: 'citizens',
            message: 'Todos los impostores han sido eliminados. Los ciudadanos ganan.'
        };
    }
    
    // Si el impostor queda solo con 1 persona (o igual número), gana el impostor
    // Regla: Si impostores >= ciudadanos, el impostor gana
    if (activeImpostors.length >= activeCitizens.length) {
        return {
            winner: 'impostor',
            message: 'El impostor ha sobrevivido hasta el final. Los impostores ganan.'
        };
    }
    
    // El juego continúa
    return {
        winner: null,
        message: 'El juego continúa...'
    };
}

/**
 * Valida las reglas del juego antes de iniciar
 * @param {number} numPlayers - Número total de jugadores
 * @param {number} numImpostors - Número de impostores
 * @returns {Object} Objeto con isValid (boolean) y errorMessage (string) si hay error
 */
function validateGameRules(numPlayers, numImpostors) {
    if (numPlayers < 4) {
        return {
            isValid: false,
            errorMessage: 'Se requieren al menos 4 jugadores'
        };
    }
    
    if (numImpostors < 1) {
        return {
            isValid: false,
            errorMessage: 'Debe haber al menos 1 impostor'
        };
    }
    
    if (numImpostors > 3) {
        return {
            isValid: false,
            errorMessage: 'Máximo 3 impostores permitidos'
        };
    }
    
    if (numImpostors >= numPlayers) {
        return {
            isValid: false,
            errorMessage: 'No puede haber más impostores que jugadores'
        };
    }
    
    return { isValid: true, errorMessage: '' };
}

module.exports = {
    getRandomWord,
    checkWordGuess,
    validateClueNotRepeated,
    validateClue,
    validateVote,
    calculateVotingResults,
    checkVictoryConditions,
    validateGameRules
};
