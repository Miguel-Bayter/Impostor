/**
 * Modelo de Juego - Almacenamiento en Memoria
 * Fase 4: Lógica del Juego
 * 
 * NOTA: Este modelo usa almacenamiento en memoria (Map) para desarrollo.
 * En producción, migrar a base de datos (MongoDB/PostgreSQL).
 */

const { getRandomWord, validateClue, checkWordGuess, validateVote, calculateVotingResults, checkVictoryConditions, validateGameRules } = require('../utils/gameLogic');

class Game {
  constructor() {
    // Almacenamiento en memoria: Map<roomId, gameState>
    this.gamesByRoomId = new Map();
  }

  /**
   * Inicializar juego para una sala
   * @param {string} roomId - ID de la sala
   * @param {Array} players - Array de jugadores de la sala [{userId, username, ...}]
   * @param {number} numImpostors - Número de impostores
   * @returns {Object} Estado del juego inicializado
   */
  initGame(roomId, players, numImpostors) {
    // Validar reglas del juego
    const validation = validateGameRules(players.length, numImpostors);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage);
    }

    // Verificar que no haya un juego ya iniciado
    if (this.gamesByRoomId.has(roomId)) {
      throw new Error('El juego ya está iniciado en esta sala');
    }

    // Seleccionar palabra secreta
    const secretWord = getRandomWord();

    // Crear array de índices para seleccionar impostores
    const indices = Array.from({ length: players.length }, (_, i) => i);
    
    // Seleccionar índices aleatorios para impostores
    const impostorIndices = [];
    for (let i = 0; i < numImpostors; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      impostorIndices.push(indices.splice(randomIndex, 1)[0]);
    }

    // Crear jugadores con roles
    const gamePlayers = players.map((player, index) => ({
      userId: player.userId,
      username: player.username,
      isImpostor: impostorIndices.includes(index),
      isEliminated: false
    }));

    // Crear estado del juego
    const gameState = {
      roomId: roomId,
      secretWord: secretWord,
      players: gamePlayers,
      currentRound: 1,
      currentTurn: 0, // Índice del jugador actual en fase de pistas
      clues: [], // Array de objetos {playerId, playerName, clue}
      votes: {}, // Objeto {voterId: votedPlayerId}
      currentVotingTurn: 0, // Índice del jugador que está votando
      phase: 'roles', // 'roles' | 'clues' | 'voting' | 'results' | 'victory'
      winner: null, // 'citizens' | 'impostor' | null
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar en memoria
    this.gamesByRoomId.set(roomId, gameState);

    return this.getGameState(roomId);
  }

  /**
   * Obtener estado del juego (sanitizado - sin palabra secreta para impostores)
   * @param {string} roomId - ID de la sala
   * @param {string} userId - ID del usuario solicitante (opcional, para ocultar palabra secreta a impostores)
   * @returns {Object|null} Estado del juego o null si no existe
   */
  getGameState(roomId, userId = null) {
    const gameState = this.gamesByRoomId.get(roomId);
    
    if (!gameState) {
      return null;
    }

    // Crear copia del estado
    const sanitized = {
      roomId: gameState.roomId,
      players: gameState.players.map(p => ({
        userId: p.userId,
        username: p.username,
        isImpostor: p.isImpostor,
        isEliminated: p.isEliminated
      })),
      currentRound: gameState.currentRound,
      currentTurn: gameState.currentTurn,
      clues: gameState.clues.map(c => ({
        playerId: c.playerId,
        playerName: c.playerName,
        clue: c.clue
      })),
      votes: { ...gameState.votes },
      currentVotingTurn: gameState.currentVotingTurn,
      phase: gameState.phase,
      winner: gameState.winner,
      createdAt: gameState.createdAt,
      updatedAt: gameState.updatedAt
    };

    // Si se proporciona userId, incluir palabra secreta solo si el jugador no es impostor
    if (userId) {
      const player = gameState.players.find(p => p.userId === userId);
      if (player && !player.isImpostor) {
        sanitized.secretWord = gameState.secretWord;
      }
    } else {
      // Si no se proporciona userId, no incluir palabra secreta (por seguridad)
      sanitized.secretWord = null;
    }

    return sanitized;
  }

  /**
   * Obtener estado interno del juego (sin sanitizar, para uso interno)
   * @param {string} roomId - ID de la sala
   * @returns {Object|null} Estado del juego completo o null si no existe
   */
  getGameStateInternal(roomId) {
    return this.gamesByRoomId.get(roomId) || null;
  }

  /**
   * Procesar pista de un jugador
   * @param {string} roomId - ID de la sala
   * @param {string} playerId - ID del jugador que envía la pista
   * @param {string} clue - La pista
   * @returns {Object} Objeto con success (boolean), gameState y message
   */
  submitClue(roomId, playerId, clue) {
    const gameState = this.gamesByRoomId.get(roomId);
    
    if (!gameState) {
      throw new Error('Juego no encontrado');
    }

    // Verificar que estamos en fase de pistas
    if (gameState.phase !== 'clues') {
      throw new Error('No estás en la fase de pistas');
    }

    // Obtener jugadores activos
    const activePlayers = gameState.players.filter(p => !p.isEliminated);

    // Verificar que el jugador tiene el turno
    if (gameState.currentTurn >= activePlayers.length) {
      throw new Error('Todos los jugadores ya han dado su pista');
    }

    const currentPlayer = activePlayers[gameState.currentTurn];
    if (currentPlayer.userId !== playerId) {
      throw new Error('No es tu turno');
    }

    // Validar pista
    const validation = validateClue(clue, gameState.clues, gameState.secretWord);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage);
    }

    // Verificar si el jugador adivinó la palabra secreta
    const guessedWord = checkWordGuess(clue, gameState.secretWord);
    if (guessedWord) {
      // El jugador adivinó la palabra secreta - terminar ronda
      gameState.phase = 'results';
      gameState.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        wordGuessed: true,
        guessedBy: {
          userId: playerId,
          username: currentPlayer.username,
          isImpostor: currentPlayer.isImpostor
        },
        gameState: this.getGameState(roomId, playerId)
      };
    }

    // Agregar pista
    gameState.clues.push({
      playerId: playerId,
      playerName: currentPlayer.username,
      clue: clue.trim()
    });

    // Avanzar turno
    gameState.currentTurn++;
    gameState.updatedAt = new Date().toISOString();

    // Verificar si todos han dado pista
    if (gameState.currentTurn >= activePlayers.length) {
      // Todos han dado pista, pasar a fase de votación
      gameState.phase = 'voting';
      gameState.currentVotingTurn = 0;
    }

    return {
      success: true,
      wordGuessed: false,
      gameState: this.getGameState(roomId, playerId)
    };
  }

  /**
   * Procesar voto de un jugador
   * @param {string} roomId - ID de la sala
   * @param {string} voterId - ID del jugador que vota
   * @param {string} votedPlayerId - ID del jugador votado
   * @returns {Object} Objeto con success (boolean), gameState, votingComplete y results
   */
  submitVote(roomId, voterId, votedPlayerId) {
    const gameState = this.gamesByRoomId.get(roomId);
    
    if (!gameState) {
      throw new Error('Juego no encontrado');
    }

    // Verificar que estamos en fase de votación
    if (gameState.phase !== 'voting') {
      throw new Error('No estás en la fase de votación');
    }

    // Obtener jugadores activos
    const activePlayers = gameState.players.filter(p => !p.isEliminated);

    // Verificar que el jugador tiene el turno de votación
    if (gameState.currentVotingTurn >= activePlayers.length) {
      throw new Error('Todos los jugadores ya han votado');
    }

    const currentVoter = activePlayers[gameState.currentVotingTurn];
    if (currentVoter.userId !== voterId) {
      throw new Error('No es tu turno de votar');
    }

    // Validar voto
    const validation = validateVote(voterId, votedPlayerId, activePlayers);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage);
    }

    // Registrar voto
    gameState.votes[voterId] = votedPlayerId;

    // Avanzar turno de votación
    gameState.currentVotingTurn++;
    gameState.updatedAt = new Date().toISOString();

    // Verificar si todos han votado
    const allVoted = gameState.currentVotingTurn >= activePlayers.length;
    
    if (allVoted) {
      // Calcular resultados
      const results = calculateVotingResults(gameState.votes, gameState.players);
      const eliminatedPlayer = gameState.players.find(p => p.userId === results.mostVotedId);
      
      if (eliminatedPlayer) {
        eliminatedPlayer.isEliminated = true;
      }

      // Verificar condiciones de victoria
      const victoryCheck = checkVictoryConditions(gameState.players);
      
      if (victoryCheck.winner) {
        // Hay un ganador
        gameState.phase = 'victory';
        gameState.winner = victoryCheck.winner;
      } else {
        // El juego continúa
        gameState.phase = 'results';
      }

      return {
        success: true,
        votingComplete: true,
        results: {
          mostVotedId: results.mostVotedId,
          voteCounts: results.voteCounts,
          eliminatedPlayer: {
            userId: eliminatedPlayer.userId,
            username: eliminatedPlayer.username,
            isImpostor: eliminatedPlayer.isImpostor
          }
        },
        victoryCheck: victoryCheck,
        gameState: this.getGameState(roomId, voterId)
      };
    }

    return {
      success: true,
      votingComplete: false,
      gameState: this.getGameState(roomId, voterId)
    };
  }

  /**
   * Avanzar a la siguiente fase
   * @param {string} roomId - ID de la sala
   * @param {string} newPhase - Nueva fase ('clues' | 'voting' | 'results')
   */
  changePhase(roomId, newPhase) {
    const gameState = this.gamesByRoomId.get(roomId);
    
    if (!gameState) {
      throw new Error('Juego no encontrado');
    }

    const validPhases = ['roles', 'clues', 'voting', 'results', 'victory'];
    if (!validPhases.includes(newPhase)) {
      throw new Error(`Fase inválida: ${newPhase}`);
    }

    gameState.phase = newPhase;
    gameState.updatedAt = new Date().toISOString();
  }

  /**
   * Iniciar nueva ronda (después de resultados)
   * @param {string} roomId - ID de la sala
   */
  startNewRound(roomId) {
    const gameState = this.gamesByRoomId.get(roomId);
    
    if (!gameState) {
      throw new Error('Juego no encontrado');
    }

    // Verificar que no hay ganador
    if (gameState.winner) {
      throw new Error('El juego ya terminó');
    }

    // Nueva palabra secreta
    gameState.secretWord = getRandomWord();

    // Incrementar ronda
    gameState.currentRound++;

    // Resetear pistas y votos
    gameState.clues = [];
    gameState.votes = {};
    gameState.currentTurn = 0;
    gameState.currentVotingTurn = 0;

    // Cambiar a fase de pistas
    gameState.phase = 'clues';
    gameState.updatedAt = new Date().toISOString();
  }

  /**
   * Eliminar juego de una sala
   * @param {string} roomId - ID de la sala
   * @returns {boolean} true si se eliminó, false si no existía
   */
  deleteGame(roomId) {
    return this.gamesByRoomId.delete(roomId);
  }

  /**
   * Verificar si existe un juego para una sala
   * @param {string} roomId - ID de la sala
   * @returns {boolean} true si existe
   */
  hasGame(roomId) {
    return this.gamesByRoomId.has(roomId);
  }
}

// Exportar instancia singleton
module.exports = new Game();
