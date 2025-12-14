/**
 * Juego Impostor - Lógica principal del juego (Multijugador)
 * Fase 5: Integración WebSockets
 * 
 * Maneja la UI y renderizado, mientras el servidor maneja la lógica del juego
 */

// ============================================
// ESTADO LOCAL (solo UI)
// ============================================

let socketClient = null;
let currentGameState = null;
let currentRoom = null;
let currentPhase = null;
let currentUser = null;

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Obtener URL del servidor (puede venir de variable de entorno o usar default)
    const serverUrl = window.SERVER_URL || 'http://localhost:3000';
    
    // Crear instancia del cliente WebSocket
    socketClient = new SocketClient(serverUrl);
    
    // Configurar callbacks de eventos
    setupSocketCallbacks();
    
    // Intentar reconectar con token guardado
    socketClient.reconnectWithStoredToken().then(connected => {
        if (connected) {
            currentUser = socketClient.getCurrentUser();
            showScreen('rooms');
            loadRooms();
        } else {
            showScreen('auth');
        }
    }).catch(() => {
        showScreen('auth');
    });
    
    // Configurar event listeners de UI
    setupUIEventListeners();
});

/**
 * Configurar callbacks para eventos del WebSocket
 */
function setupSocketCallbacks() {
    // Conexión/Desconexión
    socketClient.on('connect', () => {
        console.log('[Game] Conectado al servidor');
        hideError();
    });
    
    socketClient.on('disconnect', (reason) => {
        console.log('[Game] Desconectado:', reason);
        showError('Desconectado del servidor. Intentando reconectar...');
    });
    
    socketClient.on('error', (error) => {
        console.error('[Game] Error:', error);
        showError(error.message || error.error || 'Error desconocido');
    });
    
    // Eventos de salas
    socketClient.on('roomState', (room) => {
        currentRoom = room;
        updateRoomUI(room);
    });
    
    socketClient.on('playerJoined', (data) => {
        console.log('[Game] Jugador unido:', data);
        if (currentRoom) {
            updateRoomUI(currentRoom);
        }
    });
    
    socketClient.on('playerLeft', (data) => {
        console.log('[Game] Jugador salió:', data);
        if (currentRoom) {
            updateRoomUI(currentRoom);
        }
    });
    
    // Eventos de juego
    socketClient.on('gameState', (gameState, phase) => {
        currentGameState = gameState;
        currentPhase = phase || gameState?.phase;
        
        if (gameState) {
            updateGameUI(gameState, phase);
        }
    });
    
    socketClient.on('clueSubmitted', (data) => {
        console.log('[Game] Nueva pista:', data);
        if (currentGameState) {
            updateCluesDisplay(currentGameState);
        }
    });
    
    socketClient.on('voteSubmitted', (data) => {
        console.log('[Game] Voto recibido:', data);
        if (currentGameState) {
            updateVotingUI(currentGameState);
        }
    });
    
    socketClient.on('votingResults', (data) => {
        console.log('[Game] Resultados de votación:', data);
        showVotingResults(data);
    });
    
    socketClient.on('phaseChanged', (data) => {
        console.log('[Game] Fase cambiada:', data);
        currentPhase = data.phase;
        handlePhaseChange(data.phase, data.message);
    });
    
    socketClient.on('wordGuessed', (data) => {
        console.log('[Game] Palabra adivinada:', data);
        alert(`${data.message}\n\nLa ronda termina.`);
        // El servidor enviará el nuevo estado
    });
}

/**
 * Configurar event listeners de la UI
 */
function setupUIEventListeners() {
    // Autenticación
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }
    
    const authToggle = document.getElementById('auth-toggle');
    if (authToggle) {
        authToggle.addEventListener('click', toggleAuthMode);
    }
    
    // Salas
    const createRoomForm = document.getElementById('create-room-form');
    if (createRoomForm) {
        createRoomForm.addEventListener('submit', handleCreateRoom);
    }
    
    const joinRoomForm = document.getElementById('join-room-form');
    if (joinRoomForm) {
        joinRoomForm.addEventListener('submit', handleJoinRoom);
    }
    
    const refreshRoomsBtn = document.getElementById('btn-refresh-rooms');
    if (refreshRoomsBtn) {
        refreshRoomsBtn.addEventListener('click', loadRooms);
    }
    
    const leaveRoomBtn = document.getElementById('btn-leave-room');
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', handleLeaveRoom);
    }
    
    const startGameBtn = document.getElementById('btn-start-game');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', handleStartGame);
    }
    
    // Juego
    const submitClueBtn = document.getElementById('btn-submit-clue');
    if (submitClueBtn) {
        submitClueBtn.addEventListener('click', handleSubmitClue);
    }
    
    const clueInput = document.getElementById('clue-input');
    if (clueInput) {
        clueInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmitClue();
            }
        });
    }
    
    const finishCluesBtn = document.getElementById('btn-finish-clues');
    if (finishCluesBtn) {
        finishCluesBtn.addEventListener('click', () => {
            // En multijugador, esto se maneja automáticamente cuando todos dan pista
        });
    }
    
    const continueRolesBtn = document.getElementById('btn-continue-roles');
    if (continueRolesBtn) {
        continueRolesBtn.addEventListener('click', handleContinueRoles);
    }
    
    const submitVoteBtn = document.getElementById('btn-submit-vote');
    if (submitVoteBtn) {
        submitVoteBtn.addEventListener('click', handleSubmitVote);
    }
    
    const continueGameBtn = document.getElementById('btn-continue-game');
    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', handleContinueGame);
    }
    
    const newGameBtn = document.getElementById('btn-new-game');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', handleNewGame);
    }
    
    const playAgainBtn = document.getElementById('btn-play-again');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', handleNewGame);
    }
}

// ============================================
// NAVEGACIÓN ENTRE PANTALLAS
// ============================================

/**
 * Muestra una pantalla específica y oculta las demás
 */
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    const errorElement = document.getElementById('global-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Oculta el mensaje de error
 */
function hideError() {
    const errorElement = document.getElementById('global-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================

/**
 * Maneja el envío del formulario de autenticación
 */
async function handleAuthSubmit(e) {
    e.preventDefault();
    hideError();
    
    const authMode = document.getElementById('auth-mode').dataset.mode;
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (authMode === 'register') {
        // Registro
        const username = document.getElementById('auth-username').value;
        if (!username) {
            showError('El nombre de usuario es requerido');
            return;
        }
        
        try {
            const result = await socketClient.register(username, email, password);
            currentUser = result.user;
            showScreen('rooms');
            loadRooms();
        } catch (error) {
            showError(error.message || 'Error al registrar usuario');
        }
    } else {
        // Login
        try {
            const result = await socketClient.login(email, password);
            currentUser = result.user;
            showScreen('rooms');
            loadRooms();
        } catch (error) {
            showError(error.message || 'Error al iniciar sesión');
        }
    }
}

/**
 * Alterna entre modo login y registro
 */
function toggleAuthMode() {
    const authMode = document.getElementById('auth-mode');
    const usernameField = document.getElementById('auth-username-field');
    const toggleBtn = document.getElementById('auth-toggle');
    const submitBtn = document.getElementById('auth-submit');
    
    if (authMode.dataset.mode === 'login') {
        // Cambiar a registro
        authMode.dataset.mode = 'register';
        if (usernameField) usernameField.style.display = 'block';
        if (toggleBtn) toggleBtn.textContent = '¿Ya tienes cuenta? Inicia sesión';
        if (submitBtn) submitBtn.textContent = 'Registrarse';
    } else {
        // Cambiar a login
        authMode.dataset.mode = 'login';
        if (usernameField) usernameField.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = '¿No tienes cuenta? Regístrate';
        if (submitBtn) submitBtn.textContent = 'Iniciar Sesión';
    }
}

// ============================================
// SALAS
// ============================================

/**
 * Carga la lista de salas disponibles
 */
async function loadRooms() {
    try {
        const serverUrl = window.SERVER_URL || 'http://localhost:3000';
        const response = await fetch(`${serverUrl}/api/rooms`);
        const data = await response.json();
        
        displayRoomsList(data.rooms || []);
    } catch (error) {
        console.error('Error al cargar salas:', error);
    }
}

/**
 * Muestra la lista de salas disponibles
 */
function displayRoomsList(rooms) {
    const roomsList = document.getElementById('rooms-list');
    if (!roomsList) return;
    
    roomsList.innerHTML = '';
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<p class="empty-state">No hay salas disponibles. Crea una nueva sala.</p>';
        return;
    }
    
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <div class="room-info">
                <h3>${room.name || `Sala ${room.id}`}</h3>
                <p>ID: <strong>${room.id}</strong></p>
                <p>Jugadores: ${room.players.length}/${room.maxPlayers}</p>
                <p>Estado: ${room.status === 'waiting' ? 'Esperando' : 'En juego'}</p>
            </div>
            <button class="btn btn-primary" onclick="joinRoomById('${room.id}')">Unirse</button>
        `;
        roomsList.appendChild(roomCard);
    });
}

/**
 * Unirse a una sala por ID (llamado desde botón)
 */
window.joinRoomById = function(roomId) {
    handleJoinRoomById(roomId);
};

/**
 * Maneja unirse a una sala por ID
 */
async function handleJoinRoomById(roomId) {
    hideError();
    
    try {
        const serverUrl = window.SERVER_URL || 'http://localhost:3000';
        const token = localStorage.getItem('impostor_token');
        
        const response = await fetch(`${serverUrl}/api/rooms/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roomId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al unirse a la sala');
        }
        
        // Unirse por WebSocket
        socketClient.joinRoom(roomId);
        showScreen('room-waiting');
    } catch (error) {
        showError(error.message || 'Error al unirse a la sala');
    }
}

/**
 * Maneja crear una nueva sala
 */
async function handleCreateRoom(e) {
    e.preventDefault();
    hideError();
    
    const name = document.getElementById('room-name').value || `Sala de ${currentUser.username}`;
    const minPlayers = parseInt(document.getElementById('room-min-players').value) || 3;
    const maxPlayers = parseInt(document.getElementById('room-max-players').value) || 8;
    const numImpostors = parseInt(document.getElementById('room-num-impostors').value) || 1;
    
    try {
        const serverUrl = window.SERVER_URL || 'http://localhost:3000';
        const token = localStorage.getItem('impostor_token');
        
        const response = await fetch(`${serverUrl}/api/rooms/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                minPlayers,
                maxPlayers,
                numImpostors
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear sala');
        }
        
        const data = await response.json();
        
        // Unirse por WebSocket
        socketClient.joinRoom(data.room.id);
        showScreen('room-waiting');
    } catch (error) {
        showError(error.message || 'Error al crear sala');
    }
}

/**
 * Maneja unirse a una sala por formulario
 */
async function handleJoinRoom(e) {
    e.preventDefault();
    hideError();
    
    const roomId = document.getElementById('join-room-id').value.trim().toUpperCase();
    
    if (!roomId) {
        showError('Ingresa un ID de sala válido');
        return;
    }
    
    await handleJoinRoomById(roomId);
}

/**
 * Actualiza la UI de la sala
 */
function updateRoomUI(room) {
    if (!room) return;
    
    currentRoom = room;
    
    // Actualizar información de la sala
    const roomInfo = document.getElementById('room-info');
    if (roomInfo) {
        roomInfo.innerHTML = `
            <h2>${room.name || `Sala ${room.id}`}</h2>
            <p>ID: <strong>${room.id}</strong></p>
            <p>Jugadores: ${room.players.length}/${room.maxPlayers}</p>
            <p>Estado: ${room.status === 'waiting' ? 'Esperando jugadores' : 'En juego'}</p>
        `;
    }
    
    // Actualizar lista de jugadores
    const playersList = document.getElementById('room-players-list');
    if (playersList) {
        playersList.innerHTML = '';
        room.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            const isHost = room.hostId === player.userId;
            playerItem.innerHTML = `
                <span>${player.username}${isHost ? ' (Host)' : ''}</span>
            `;
            playersList.appendChild(playerItem);
        });
    }
    
    // Mostrar/ocultar botón de iniciar juego (solo host)
    const startGameBtn = document.getElementById('btn-start-game');
    if (startGameBtn) {
        const isHost = room.hostId === currentUser?.id;
        const canStart = room.status === 'waiting' && 
                        room.players.length >= (room.settings?.minPlayers || 3) &&
                        isHost;
        startGameBtn.style.display = canStart ? 'block' : 'none';
    }
}

/**
 * Maneja salir de la sala
 */
function handleLeaveRoom() {
    socketClient.leaveRoom();
    currentRoom = null;
    showScreen('rooms');
    loadRooms();
}

/**
 * Maneja iniciar el juego
 */
function handleStartGame() {
    hideError();
    try {
        socketClient.startGame();
    } catch (error) {
        showError(error.message || 'Error al iniciar el juego');
    }
}

/**
 * Maneja iniciar la fase de pistas (solo host)
 */
function handleContinueRoles() {
    hideError();
    
    // Verificar que el usuario es el host
    const isHost = currentRoom && currentRoom.hostId === currentUser.id;
    if (!isHost) {
        showError('Solo el host puede iniciar la partida');
        return;
    }
    
    try {
        socketClient.startCluesPhase();
        // Deshabilitar el botón para evitar múltiples clics
        const continueRolesBtn = document.getElementById('btn-continue-roles');
        if (continueRolesBtn) {
            continueRolesBtn.disabled = true;
            continueRolesBtn.textContent = 'Iniciando partida...';
        }
    } catch (error) {
        showError(error.message || 'Error al iniciar la partida');
    }
}

// ============================================
// JUEGO
// ============================================

/**
 * Maneja el cambio de fase del juego
 */
function handlePhaseChange(phase, message) {
    switch (phase) {
        case 'roles':
            showScreen('roles');
            break;
        case 'clues':
            showScreen('clues');
            break;
        case 'voting':
            showScreen('voting');
            break;
        case 'results':
            showScreen('results');
            break;
        case 'victory':
            showScreen('victory');
            break;
    }
    
    if (message) {
        console.log('[Game]', message);
    }
}

/**
 * Actualiza la UI del juego según el estado recibido
 */
function updateGameUI(gameState, phase) {
    if (!gameState) return;
    
    currentGameState = gameState;
    currentPhase = phase || gameState.phase;
    
    // Actualizar según la fase actual
    switch (currentPhase) {
        case 'roles':
            displayRoles(gameState);
            break;
        case 'clues':
            displayCluesPhase(gameState);
            break;
        case 'voting':
            displayVotingPhase(gameState);
            break;
        case 'results':
            // Los resultados se muestran cuando llega el evento votingResults
            break;
    }
}

/**
 * Muestra la pantalla de roles
 */
function displayRoles(gameState) {
    const container = document.getElementById('roles-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Verificar si el usuario actual es el host
    const isHost = currentRoom && currentRoom.hostId === currentUser.id;
    
    // Configurar botón según si es host o no
    const continueRolesBtn = document.getElementById('btn-continue-roles');
    if (continueRolesBtn) {
        if (isHost) {
            // Host puede iniciar la partida
            continueRolesBtn.disabled = false;
            continueRolesBtn.textContent = 'Iniciar Partida';
            continueRolesBtn.style.display = 'block';
        } else {
            // Otros jugadores solo esperan
            continueRolesBtn.disabled = true;
            continueRolesBtn.textContent = 'Esperando a que el host inicie la partida...';
            continueRolesBtn.style.display = 'block';
        }
    }
    
    // Encontrar el jugador actual
    const currentPlayer = gameState.players.find(p => p.userId === currentUser.id);
    
    if (currentPlayer) {
        const roleCard = document.createElement('div');
        roleCard.className = 'role-card';
        
        if (currentPlayer.isImpostor) {
            roleCard.classList.add('impostor-card');
            roleCard.innerHTML = `
                <div class="role-icon">🕵️</div>
                <h3>${currentPlayer.username}</h3>
                <p class="role-badge impostor-badge">IMPOSTOR</p>
                <p class="role-instruction">No conoces la palabra secreta. Debes deducirla de las pistas.</p>
            `;
        } else {
            roleCard.classList.add('citizen-card');
            roleCard.innerHTML = `
                <div class="role-icon">👤</div>
                <h3>${currentPlayer.username}</h3>
                <p class="role-badge citizen-badge">CIUDADANO</p>
                <p class="secret-word">Palabra secreta: <strong>${gameState.secretWord}</strong></p>
                <p class="role-instruction">Debes dar pistas relacionadas con esta palabra.</p>
            `;
        }
        
        container.appendChild(roleCard);
    }
}

/**
 * Muestra la fase de pistas
 */
function displayCluesPhase(gameState) {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const currentTurnIndex = gameState.currentTurn;
    
    if (currentTurnIndex >= activePlayers.length) {
        // Todos han dado pista, esperar cambio de fase
        return;
    }
    
    const currentTurnPlayer = activePlayers[currentTurnIndex];
    const isMyTurn = currentTurnPlayer.userId === currentUser.id;
    
    // Actualizar información del turno
    const playerNameElement = document.getElementById('current-player-name');
    const playerRoleElement = document.getElementById('current-player-role');
    const instructionsElement = document.getElementById('clues-instructions');
    const clueInput = document.getElementById('clue-input');
    const submitBtn = document.getElementById('btn-submit-clue');
    
    if (playerNameElement) {
        playerNameElement.textContent = currentTurnPlayer.username;
    }
    
    if (isMyTurn) {
        if (playerRoleElement) {
            playerRoleElement.textContent = currentTurnPlayer.isImpostor ? 'Rol: Impostor' : 'Rol: Ciudadano';
            playerRoleElement.className = currentTurnPlayer.isImpostor ? 'impostor-text' : 'citizen-text';
        }
        
        if (instructionsElement) {
            if (currentTurnPlayer.isImpostor) {
                instructionsElement.textContent = 'Eres el impostor. Da una pista basada en lo que has escuchado.';
            } else {
                instructionsElement.textContent = `La palabra secreta es "${gameState.secretWord}". Da una pista relacionada.`;
            }
        }
        
        if (clueInput) {
            clueInput.disabled = false;
            clueInput.focus();
        }
        
        if (submitBtn) {
            submitBtn.style.display = 'block';
        }
    } else {
        if (instructionsElement) {
            instructionsElement.textContent = `Esperando a que ${currentTurnPlayer.username} dé su pista...`;
        }
        
        if (clueInput) {
            clueInput.disabled = true;
            clueInput.value = '';
        }
        
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
    }
    
    // Actualizar lista de pistas
    updateCluesDisplay(gameState);
}

/**
 * Actualiza la lista de pistas mostradas
 */
function updateCluesDisplay(gameState) {
    const cluesList = document.getElementById('clues-list');
    if (!cluesList) return;
    
    cluesList.innerHTML = '';
    
    if (!gameState.clues || gameState.clues.length === 0) {
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

/**
 * Maneja enviar una pista
 */
function handleSubmitClue() {
    const clueInput = document.getElementById('clue-input');
    if (!clueInput) return;
    
    const clue = clueInput.value.trim();
    
    if (!clue) {
        showError('Por favor, ingresa una pista');
        return;
    }
    
    if (clue.length < 2) {
        showError('La pista debe tener al menos 2 caracteres');
        return;
    }
    
    hideError();
    
    try {
        socketClient.submitClue(clue);
        clueInput.value = '';
    } catch (error) {
        showError(error.message || 'Error al enviar pista');
    }
}

/**
 * Muestra la fase de votación
 */
function displayVotingPhase(gameState) {
    // Mostrar pistas
    const votingCluesList = document.getElementById('voting-clues-list');
    if (votingCluesList) {
        votingCluesList.innerHTML = '';
        
        if (gameState.clues && gameState.clues.length > 0) {
            gameState.clues.forEach(clueData => {
                const clueItem = document.createElement('div');
                clueItem.className = 'clue-item';
                clueItem.innerHTML = `
                    <span class="clue-player">${clueData.playerName}:</span>
                    <span class="clue-text">${clueData.clue}</span>
                `;
                votingCluesList.appendChild(clueItem);
            });
        }
    }
    
    // Mostrar jugadores para votar
    updateVotingUI(gameState);
}

/**
 * Actualiza la UI de votación
 */
function updateVotingUI(gameState) {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const currentVotingTurn = gameState.currentVotingTurn || 0;
    
    if (currentVotingTurn >= activePlayers.length) {
        // Todos han votado, esperar resultados
        return;
    }
    
    const currentVoter = activePlayers[currentVotingTurn];
    const isMyTurn = currentVoter.userId === currentUser.id;
    
    // Actualizar subtítulo
    const subtitle = document.querySelector('#screen-voting .subtitle');
    if (subtitle) {
        subtitle.textContent = isMyTurn 
            ? 'Es tu turno de votar' 
            : `Esperando a que ${currentVoter.username} vote...`;
    }
    
    // Mostrar jugadores disponibles para votar
    const votingContainer = document.getElementById('voting-players');
    if (!votingContainer) return;
    
    votingContainer.innerHTML = '';
    
    if (isMyTurn) {
        // Filtrar jugadores que pueden ser votados (excluir al votante)
        const votablePlayers = activePlayers.filter(p => p.userId !== currentUser.id);
        
        votablePlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'voting-card';
            playerCard.dataset.playerId = player.userId;
            
            playerCard.innerHTML = `
                <div class="voting-card-content">
                    <h4>${player.username}</h4>
                    <p class="voting-role">👤 Jugador</p>
                </div>
            `;
            
            playerCard.addEventListener('click', function() {
                document.querySelectorAll('.voting-card').forEach(card => {
                    card.classList.remove('selected');
                });
                playerCard.classList.add('selected');
                
                const submitBtn = document.getElementById('btn-submit-vote');
                if (submitBtn) {
                    submitBtn.style.display = 'block';
                    submitBtn.dataset.votedId = player.userId;
                }
            });
            
            votingContainer.appendChild(playerCard);
        });
    } else {
        votingContainer.innerHTML = '<p class="empty-state">Esperando a que otros jugadores voten...</p>';
    }
    
    // Ocultar botón de confirmar si no es mi turno
    const submitBtn = document.getElementById('btn-submit-vote');
    if (submitBtn && !isMyTurn) {
        submitBtn.style.display = 'none';
    }
}

/**
 * Maneja enviar un voto
 */
function handleSubmitVote() {
    const voteButton = document.getElementById('btn-submit-vote');
    if (!voteButton) return;
    
    const votedPlayerId = voteButton.dataset.votedId;
    
    if (!votedPlayerId) {
        showError('Selecciona un jugador para votar');
        return;
    }
    
    hideError();
    
    try {
        socketClient.submitVote(votedPlayerId);
        voteButton.style.display = 'none';
        voteButton.dataset.votedId = '';
    } catch (error) {
        showError(error.message || 'Error al enviar voto');
    }
}

/**
 * Muestra los resultados de la votación
 */
function showVotingResults(data) {
    const resultsContent = document.getElementById('results-content');
    if (!resultsContent) return;
    
    resultsContent.innerHTML = '';
    
    const { results, victoryCheck } = data;
    const eliminatedPlayer = results.eliminatedPlayer;
    
    // Información del jugador eliminado
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    if (eliminatedPlayer.isImpostor) {
        resultCard.classList.add('success-result');
        resultCard.innerHTML = `
            <div class="result-icon">✅</div>
            <h3>¡Impostor Eliminado!</h3>
            <p><strong>${eliminatedPlayer.username}</strong> era el impostor y ha sido eliminado.</p>
            <p class="result-message">Los ciudadanos ganan esta ronda.</p>
        `;
    } else {
        resultCard.classList.add('error-result');
        resultCard.innerHTML = `
            <div class="result-icon">❌</div>
            <h3>Jugador Inocente Eliminado</h3>
            <p><strong>${eliminatedPlayer.username}</strong> era un ciudadano y ha sido eliminado por error.</p>
            <p class="result-message">El juego continúa...</p>
        `;
    }
    
    resultsContent.appendChild(resultCard);
    
    // Mostrar conteo de votos
    if (results.voteCounts) {
        const votesCard = document.createElement('div');
        votesCard.className = 'votes-summary';
        votesCard.innerHTML = '<h4>Resumen de votos:</h4>';
        
        const votesList = document.createElement('div');
        votesList.className = 'votes-list';
        
        Object.entries(results.voteCounts).forEach(([playerId, count]) => {
            const player = currentGameState.players.find(p => p.userId === playerId);
            if (player) {
                const voteItem = document.createElement('div');
                voteItem.className = 'vote-item';
                voteItem.innerHTML = `
                    <span>${player.username}:</span>
                    <strong>${count} voto${count !== 1 ? 's' : ''}</strong>
                `;
                votesList.appendChild(voteItem);
            }
        });
        
        votesCard.appendChild(votesList);
        resultsContent.appendChild(votesCard);
    }
    
    // Si hay un ganador, mostrar pantalla de victoria
    if (victoryCheck && victoryCheck.winner) {
        setTimeout(() => {
            showVictoryScreen(victoryCheck.winner);
        }, 3000);
    }
}

/**
 * Muestra la pantalla de victoria
 */
function showVictoryScreen(winner) {
    showScreen('victory');
    
    const victoryTitle = document.getElementById('victory-title');
    const victoryContent = document.getElementById('victory-content');
    
    if (!victoryTitle || !victoryContent) return;
    
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
 * Maneja continuar el juego (nueva ronda)
 */
function handleContinueGame() {
    try {
        socketClient.startNewRound();
    } catch (error) {
        showError(error.message || 'Error al iniciar nueva ronda');
    }
}

/**
 * Maneja nuevo juego (volver a salas)
 */
function handleNewGame() {
    socketClient.leaveRoom();
    currentRoom = null;
    currentGameState = null;
    currentPhase = null;
    showScreen('rooms');
    loadRooms();
}
