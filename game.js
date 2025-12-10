/**
 * Juego Impostor - Lógica principal del juego
 * Maneja el estado del juego, flujo de pantallas y todas las mecánicas
 */

// ============================================
// ESTADO DEL JUEGO
// ============================================

/**
 * Objeto que contiene todo el estado del juego
 */
let gameState = {
    // Configuración inicial
    totalPlayers: 0,
    totalImpostors: 0,
    
    // Jugadores
    players: [], // Array de objetos {id, name, isImpostor, isEliminated, clue, vote}
    
    // Palabra secreta
    secretWord: '',
    
    // Ronda actual
    currentRound: 1,
    currentTurn: 0, // Índice del jugador actual
    clues: [], // Array de objetos {playerId, playerName, clue}
    
    // Votación
    votes: {}, // Objeto {voterId: votedPlayerId}
    currentVotingTurn: 0, // Índice del jugador que está votando
    
    // Pantalla actual
    currentScreen: 'start'
};

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa el juego con la configuración del usuario
 */
function initGame() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const numImpostors = parseInt(document.getElementById('num-impostors').value);
    
    // Validar reglas del juego
    if (!validateGameRules(numPlayers, numImpostors)) {
        return false;
    }
    
    // Configurar estado inicial
    gameState.totalPlayers = numPlayers;
    gameState.totalImpostors = numImpostors;
    gameState.players = [];
    gameState.secretWord = getRandomWord();
    gameState.currentRound = 1;
    gameState.currentTurn = 0;
    gameState.clues = [];
    gameState.votes = {};
    
    // Crear jugadores
    createPlayers(numPlayers, numImpostors);
    
    // Asignar palabra secreta a jugadores no impostores
    assignSecretWord();
    
    // Mostrar pantalla de roles
    showScreen('roles');
    displayRoles();
    
    return true;
}

/**
 * Valida las reglas del juego
 * @param {number} numPlayers - Número total de jugadores
 * @param {number} numImpostors - Número de impostores
 * @returns {boolean} true si las reglas son válidas
 */
function validateGameRules(numPlayers, numImpostors) {
    const errorElement = document.getElementById('start-error');
    errorElement.textContent = '';
    
    if (numPlayers < 4) {
        errorElement.textContent = 'Se requieren al menos 4 jugadores';
        return false;
    }
    
    if (numImpostors < 1) {
        errorElement.textContent = 'Debe haber al menos 1 impostor';
        return false;
    }
    
    if (numImpostors > 3) {
        errorElement.textContent = 'Máximo 3 impostores permitidos';
        return false;
    }
    
    if (numImpostors >= numPlayers) {
        errorElement.textContent = 'No puede haber más impostores que jugadores';
        return false;
    }
    
    return true;
}

/**
 * Crea los jugadores y asigna roles aleatoriamente
 * @param {number} totalPlayers - Número total de jugadores
 * @param {number} numImpostors - Número de impostores
 */
function createPlayers(totalPlayers, numImpostors) {
    // Crear array de índices para seleccionar impostores
    const indices = Array.from({ length: totalPlayers }, (_, i) => i);
    
    // Seleccionar índices aleatorios para impostores
    const impostorIndices = [];
    for (let i = 0; i < numImpostors; i++) {
        const randomIndex = Math.floor(Math.random() * indices.length);
        impostorIndices.push(indices.splice(randomIndex, 1)[0]);
    }
    
    // Crear jugadores
    for (let i = 0; i < totalPlayers; i++) {
        gameState.players.push({
            id: i,
            name: `Jugador ${i + 1}`,
            isImpostor: impostorIndices.includes(i),
            isEliminated: false,
            clue: '',
            vote: null
        });
    }
}

/**
 * Asigna la palabra secreta a los jugadores que no son impostores
 */
function assignSecretWord() {
    // La palabra secreta ya está asignada en gameState.secretWord
    // Los impostores no la conocen (se maneja en la UI)
}

// ============================================
// NAVEGACIÓN ENTRE PANTALLAS
// ============================================

/**
 * Muestra una pantalla específica y oculta las demás
 * @param {string} screenId - ID de la pantalla a mostrar
 */
function showScreen(screenId) {
    // Ocultar todas las pantallas
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar la pantalla solicitada
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        gameState.currentScreen = screenId;
    }
}

// ============================================
// PANTALLA DE ROLES
// ============================================

/**
 * Muestra la pantalla de asignación de roles
 */
function displayRoles() {
    const container = document.getElementById('roles-container');
    container.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const roleCard = document.createElement('div');
        roleCard.className = 'role-card';
        
        if (player.isImpostor) {
            roleCard.classList.add('impostor-card');
            roleCard.innerHTML = `
                <div class="role-icon">🕵️</div>
                <h3>${player.name}</h3>
                <p class="role-badge impostor-badge">IMPOSTOR</p>
                <p class="role-instruction">No conoces la palabra secreta. Debes deducirla de las pistas.</p>
            `;
        } else {
            roleCard.classList.add('citizen-card');
            roleCard.innerHTML = `
                <div class="role-icon">👤</div>
                <h3>${player.name}</h3>
                <p class="role-badge citizen-badge">CIUDADANO</p>
                <p class="secret-word">Palabra secreta: <strong>${gameState.secretWord}</strong></p>
                <p class="role-instruction">Debes dar pistas relacionadas con esta palabra.</p>
            `;
        }
        
        container.appendChild(roleCard);
    });
}

// ============================================
// PANTALLA DE PISTAS
// ============================================

/**
 * Inicia la fase de pistas
 */
function startCluesPhase() {
    // Resetear pistas
    gameState.clues = [];
    gameState.currentTurn = 0;
    
    // Mostrar pantalla de pistas
    showScreen('clues');
    
    // Mostrar primer turno
    displayCurrentTurn();
    updateCluesList();
}

/**
 * Muestra el turno actual del jugador
 */
function displayCurrentTurn() {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    
    if (gameState.currentTurn >= activePlayers.length) {
        // Todos han dado pista
        finishCluesPhase();
        return;
    }
    
    const currentPlayer = activePlayers[gameState.currentTurn];
    const playerNameElement = document.getElementById('current-player-name');
    const playerRoleElement = document.getElementById('current-player-role');
    const instructionsElement = document.getElementById('clues-instructions');
    const clueInput = document.getElementById('clue-input');
    
    playerNameElement.textContent = currentPlayer.name;
    
    if (currentPlayer.isImpostor) {
        playerRoleElement.textContent = 'Rol: Impostor';
        playerRoleElement.className = 'impostor-text';
        instructionsElement.textContent = 'Eres el impostor. Da una pista basada en lo que has escuchado.';
    } else {
        playerRoleElement.textContent = 'Rol: Ciudadano';
        playerRoleElement.className = 'citizen-text';
        instructionsElement.textContent = `La palabra secreta es "${gameState.secretWord}". Da una pista relacionada.`;
    }
    
    // Limpiar input
    clueInput.value = '';
    clueInput.focus();
    
    // Mostrar/ocultar botones
    document.getElementById('btn-submit-clue').style.display = 'block';
    document.getElementById('btn-finish-clues').style.display = 'none';
    document.getElementById('clue-error').textContent = '';
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
 * Valida que una pista no haya sido usada previamente por otro jugador
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
 * Procesa la pista del jugador actual
 */
function submitClue() {
    const clueInput = document.getElementById('clue-input');
    const clue = clueInput.value.trim().toLowerCase();
    const errorElement = document.getElementById('clue-error');
    
    // Validar pista
    if (!clue) {
        errorElement.textContent = 'Por favor, ingresa una pista';
        return;
    }
    
    if (clue.length < 2) {
        errorElement.textContent = 'La pista debe tener al menos 2 caracteres';
        return;
    }
    
    // Validar que la pista no se repita con las pistas de otros jugadores
    const validationResult = validateClueNotRepeated(clueInput.value.trim(), gameState.clues);
    if (!validationResult.isValid) {
        errorElement.textContent = validationResult.errorMessage;
        return;
    }
    
    // Obtener jugador actual antes de verificar adivinanza
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const currentPlayer = activePlayers[gameState.currentTurn];
    
    // Verificar si el jugador adivinó la palabra secreta exacta
    if (checkWordGuess(clueInput.value.trim(), gameState.secretWord)) {
        // Mostrar mensaje informativo
        const playerRole = currentPlayer.isImpostor ? 'impostor' : 'jugador';
        alert(`¡${currentPlayer.name} (${playerRole}) adivinó la palabra secreta "${gameState.secretWord}"!\n\nLa ronda finaliza y el juego se reinicia.`);
        
        // Reiniciar el juego automáticamente
        resetGame();
        return;
    }
    
    // Agregar pista
    
    gameState.clues.push({
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        clue: clueInput.value.trim()
    });
    
    // Avanzar turno
    gameState.currentTurn++;
    updateCluesList();
    
    // Mostrar siguiente turno o finalizar
    if (gameState.currentTurn >= activePlayers.length) {
        finishCluesPhase();
    } else {
        displayCurrentTurn();
    }
}

/**
 * Finaliza la fase de pistas
 */
function finishCluesPhase() {
    document.getElementById('btn-submit-clue').style.display = 'none';
    document.getElementById('btn-finish-clues').style.display = 'block';
    document.getElementById('clues-instructions').textContent = 'Todos han dado su pista. Presiona "Finalizar Ronda" para continuar a la votación.';
}

/**
 * Actualiza la lista de pistas mostradas
 */
function updateCluesList() {
    const cluesList = document.getElementById('clues-list');
    cluesList.innerHTML = '';
    
    if (gameState.clues.length === 0) {
        cluesList.innerHTML = '<p class="empty-state">Aún no hay pistas</p>';
        return;
    }
    
    gameState.clues.forEach(clueData => {
        const clueItem = document.createElement('div');
        clueItem.className = 'clue-item';
        clueItem.innerHTML = `
            <span class="clue-player">${clueData.playerName}:</span>
            <span class="clue-text">${clueData.clue}</span>
        `;
        cluesList.appendChild(clueItem);
    });
}

// ============================================
// PANTALLA DE VOTACIÓN
// ============================================

/**
 * Inicia la fase de votación
 */
function startVotingPhase() {
    // Resetear votos
    gameState.votes = {};
    gameState.currentVotingTurn = 0;
    
    // Mostrar pantalla de votación
    showScreen('voting');
    
    // Mostrar pistas
    displayVotingClues();
    
    // Mostrar primer turno de votación
    displayCurrentVotingTurn();
}

/**
 * Muestra las pistas en la pantalla de votación
 */
function displayVotingClues() {
    const cluesList = document.getElementById('voting-clues-list');
    cluesList.innerHTML = '';
    
    gameState.clues.forEach(clueData => {
        const clueItem = document.createElement('div');
        clueItem.className = 'clue-item';
        clueItem.innerHTML = `
            <span class="clue-player">${clueData.playerName}:</span>
            <span class="clue-text">${clueData.clue}</span>
        `;
        cluesList.appendChild(clueItem);
    });
}

/**
 * Muestra el turno actual de votación
 */
function displayCurrentVotingTurn() {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const subtitle = document.querySelector('#screen-voting .subtitle');
    
    if (gameState.currentVotingTurn >= activePlayers.length) {
        // Todos han votado
        calculateVotingResults();
        return;
    }
    
    const currentVoter = activePlayers[gameState.currentVotingTurn];
    subtitle.textContent = `${currentVoter.name} está votando...`;
    
    // Mostrar jugadores disponibles para votar (excluyendo al votante actual)
    displayVotingPlayers(activePlayers, currentVoter);
}

/**
 * Muestra los jugadores disponibles para votar
 * @param {Array} activePlayers - Lista de jugadores activos
 * @param {Object} currentVoter - Jugador que está votando actualmente
 */
function displayVotingPlayers(activePlayers, currentVoter) {
    const votingContainer = document.getElementById('voting-players');
    votingContainer.innerHTML = '';
    
    // Filtrar jugadores que pueden ser votados (excluir al votante)
    const votablePlayers = activePlayers.filter(p => p.id !== currentVoter.id);
    
    if (votablePlayers.length === 0) {
        // Caso edge: solo queda un jugador
        calculateVotingResults();
        return;
    }
    
    votablePlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'voting-card';
        playerCard.dataset.playerId = player.id;
        
        playerCard.innerHTML = `
            <div class="voting-card-content">
                <h4>${player.name}</h4>
                <p class="voting-role">👤 Jugador</p>
            </div>
        `;
        
        // Agregar evento de click
        playerCard.addEventListener('click', function() {
            // Remover selección anterior
            document.querySelectorAll('.voting-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Seleccionar esta tarjeta
            playerCard.classList.add('selected');
            
            // Mostrar botón de confirmar
            document.getElementById('btn-submit-vote').style.display = 'block';
            document.getElementById('btn-submit-vote').dataset.votedId = player.id;
        });
        
        votingContainer.appendChild(playerCard);
    });
}

/**
 * Procesa el voto del jugador actual
 */
function submitVote() {
    const voteButton = document.getElementById('btn-submit-vote');
    const votedPlayerId = parseInt(voteButton.dataset.votedId);
    
    if (votedPlayerId === null || votedPlayerId === undefined) {
        return;
    }
    
    // Registrar voto del jugador actual
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const currentVoter = activePlayers[gameState.currentVotingTurn];
    
    gameState.votes[currentVoter.id] = votedPlayerId;
    
    // Ocultar botón de confirmar
    voteButton.style.display = 'none';
    voteButton.dataset.votedId = '';
    
    // Avanzar al siguiente turno
    gameState.currentVotingTurn++;
    
    // Mostrar siguiente turno o calcular resultados
    if (gameState.currentVotingTurn >= activePlayers.length) {
        // Todos han votado
        calculateVotingResults();
    } else {
        // Mostrar siguiente turno
        displayCurrentVotingTurn();
    }
}

/**
 * Calcula los resultados de la votación
 */
function calculateVotingResults() {
    // Contar votos
    const voteCounts = {};
    Object.values(gameState.votes).forEach(votedId => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });
    
    // Encontrar el más votado
    let maxVotes = 0;
    let mostVotedId = null;
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            mostVotedId = parseInt(playerId);
        }
    });
    
    // Manejar empates (seleccionar aleatoriamente entre los empatados)
    const tiedPlayers = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([playerId, _]) => parseInt(playerId));
    
    if (tiedPlayers.length > 1) {
        mostVotedId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
    }
    
    // Eliminar jugador votado
    const eliminatedPlayer = gameState.players.find(p => p.id === mostVotedId);
    if (eliminatedPlayer) {
        eliminatedPlayer.isEliminated = true;
    }
    
    // Mostrar resultados
    showVotingResults(eliminatedPlayer, voteCounts);
}

// ============================================
// PANTALLA DE RESULTADOS
// ============================================

/**
 * Muestra los resultados de la votación
 */
function showVotingResults(eliminatedPlayer, voteCounts) {
    showScreen('results');
    
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = '';
    
    // Información del jugador eliminado
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    if (eliminatedPlayer.isImpostor) {
        resultCard.classList.add('success-result');
        resultCard.innerHTML = `
            <div class="result-icon">✅</div>
            <h3>¡Impostor Eliminado!</h3>
            <p><strong>${eliminatedPlayer.name}</strong> era el impostor y ha sido eliminado.</p>
            <p class="result-message">Los ciudadanos ganan esta ronda.</p>
        `;
    } else {
        resultCard.classList.add('error-result');
        resultCard.innerHTML = `
            <div class="result-icon">❌</div>
            <h3>Jugador Inocente Eliminado</h3>
            <p><strong>${eliminatedPlayer.name}</strong> era un ciudadano y ha sido eliminado por error.</p>
            <p class="result-message">El juego continúa...</p>
        `;
    }
    
    resultsContent.appendChild(resultCard);
    
    // Mostrar conteo de votos
    const votesCard = document.createElement('div');
    votesCard.className = 'votes-summary';
    votesCard.innerHTML = '<h4>Resumen de votos:</h4>';
    
    const votesList = document.createElement('div');
    votesList.className = 'votes-list';
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        const player = gameState.players.find(p => p.id === parseInt(playerId));
        if (player) {
            const voteItem = document.createElement('div');
            voteItem.className = 'vote-item';
            voteItem.innerHTML = `
                <span>${player.name}:</span>
                <strong>${count} voto${count !== 1 ? 's' : ''}</strong>
            `;
            votesList.appendChild(voteItem);
        }
    });
    
    votesCard.appendChild(votesList);
    resultsContent.appendChild(votesCard);
    
    // Verificar condiciones de victoria
    checkVictoryConditions();
}

/**
 * Verifica las condiciones de victoria
 */
function checkVictoryConditions() {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const activeImpostors = activePlayers.filter(p => p.isImpostor);
    const activeCitizens = activePlayers.filter(p => !p.isImpostor);
    
    // Si no quedan impostores, ganan los ciudadanos
    if (activeImpostors.length === 0) {
        showVictoryScreen('citizens');
        return;
    }
    
    // Si el impostor queda solo con 1 persona (o igual número), gana el impostor
    // Regla: Si impostores >= ciudadanos, el impostor gana
    if (activeImpostors.length >= activeCitizens.length) {
        showVictoryScreen('impostor');
        return;
    }
    
    // El juego continúa
    // El botón "Continuar Juego" iniciará una nueva ronda de pistas
}

/**
 * Continúa el juego con una nueva ronda
 */
function continueGame() {
    gameState.currentRound++;
    startCluesPhase();
}

// ============================================
// PANTALLA DE VICTORIA
// ============================================

/**
 * Muestra la pantalla de victoria
 * @param {string} winner - 'citizens' o 'impostor'
 */
function showVictoryScreen(winner) {
    showScreen('victory');
    
    const victoryContent = document.getElementById('victory-content');
    const victoryTitle = document.getElementById('victory-title');
    
    if (winner === 'citizens') {
        victoryTitle.textContent = '🏆 ¡Ciudadanos Ganaron!';
        victoryTitle.className = 'title victory-title citizen-victory';
        victoryContent.innerHTML = `
            <div class="victory-card citizen-victory-card">
                <div class="victory-icon">✅</div>
                <h3>¡Felicidades!</h3>
                <p>Todos los impostores han sido eliminados.</p>
                <p class="victory-message">Los ciudadanos han ganado el juego.</p>
            </div>
        `;
    } else {
        victoryTitle.textContent = '🕵️ ¡Impostor Ganó!';
        victoryTitle.className = 'title victory-title impostor-victory';
        victoryContent.innerHTML = `
            <div class="victory-card impostor-victory-card">
                <div class="victory-icon">🕵️</div>
                <h3>¡El Impostor Gana!</h3>
                <p>El impostor ha sobrevivido hasta el final.</p>
                <p class="victory-message">Los impostores han ganado el juego.</p>
            </div>
        `;
    }
}

/**
 * Reinicia el juego desde el inicio
 */
function resetGame() {
    showScreen('start');
    gameState = {
        totalPlayers: 0,
        totalImpostors: 0,
        players: [],
        secretWord: '',
        currentRound: 1,
        currentTurn: 0,
        clues: [],
        votes: {},
        currentVotingTurn: 0,
        currentScreen: 'start'
    };
    
    // Limpiar formulario
    document.getElementById('start-form').reset();
    document.getElementById('num-players').value = 4;
    document.getElementById('num-impostors').value = 1;
    document.getElementById('start-error').textContent = '';
}

// ============================================
// EVENT LISTENERS
// ============================================

// Cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Formulario de inicio
    document.getElementById('start-form').addEventListener('submit', function(e) {
        e.preventDefault();
        initGame();
    });
    
    // Botón continuar en pantalla de roles
    document.getElementById('btn-continue-roles').addEventListener('click', function() {
        startCluesPhase();
    });
    
    // Botón enviar pista
    document.getElementById('btn-submit-clue').addEventListener('click', function() {
        submitClue();
    });
    
    // Enter en input de pista
    document.getElementById('clue-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitClue();
        }
    });
    
    // Botón finalizar pistas
    document.getElementById('btn-finish-clues').addEventListener('click', function() {
        startVotingPhase();
    });
    
    // Botón confirmar voto
    document.getElementById('btn-submit-vote').addEventListener('click', function() {
        submitVote();
    });
    
    // Botón continuar juego
    document.getElementById('btn-continue-game').addEventListener('click', function() {
        continueGame();
    });
    
    // Botón nuevo juego (desde resultados)
    document.getElementById('btn-new-game').addEventListener('click', function() {
        resetGame();
    });
    
    // Botón jugar de nuevo (desde victoria)
    document.getElementById('btn-play-again').addEventListener('click', function() {
        resetGame();
    });
});

