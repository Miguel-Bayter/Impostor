/**
 * Modelo de Juego - Almacenamiento en Memoria
 * Fase 4: Lógica del Juego
 *
 * NOTA: Este modelo usa almacenamiento en memoria (Map) para desarrollo.
 * En producción, migrar a base de datos (MongoDB/PostgreSQL).
 */

const {
  getRandomWord,
  validateClue,
  checkWordGuess,
  validateVote,
  calculateVotingResults,
  checkVictoryConditions,
  validateGameRules,
} = require('../utils/gameLogic');

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
      isEliminated: false,
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
      phase: 'roles', // 'roles' | 'clues' | 'voting' | 'results' | 'victory'
      winner: null, // 'citizens' | 'impostor' | null
      rolesConfirmed: new Set(), // Set de playerIds que han confirmado ver sus roles
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      players: gameState.players.map((p) => ({
        userId: p.userId,
        username: p.username,
        isImpostor: p.isImpostor,
        isEliminated: p.isEliminated,
      })),
      currentRound: gameState.currentRound,
      currentTurn: gameState.currentTurn,
      clues: gameState.clues.map((c) => ({
        playerId: c.playerId,
        playerName: c.playerName,
        clue: c.clue,
      })),
      votes: { ...gameState.votes },
      phase: gameState.phase,
      winner: gameState.winner,
      createdAt: gameState.createdAt,
      updatedAt: gameState.updatedAt,
    };

    // Si se proporciona userId, incluir palabra secreta solo si el jugador no es impostor
    if (userId) {
      const player = gameState.players.find((p) => p.userId === userId);
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
    const activePlayers = gameState.players.filter((p) => !p.isEliminated);

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
          isImpostor: currentPlayer.isImpostor,
        },
        gameState: this.getGameState(roomId, playerId),
      };
    }

    // Agregar pista
    gameState.clues.push({
      playerId: playerId,
      playerName: currentPlayer.username,
      clue: clue.trim(),
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
      gameState: this.getGameState(roomId, playerId),
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
    if (gameState.phase !== 'voting') {
      throw new Error('No estás en la fase de votación');
    }

    const activePlayers = gameState.players.filter((p) => !p.isEliminated);
    const validation = validateVote(voterId, votedPlayerId, activePlayers);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage);
    }

    // Verificar si el jugador ya ha votado
    if (gameState.votes[voterId]) {
      throw new Error('Ya has votado en esta ronda.');
    }

    gameState.votes[voterId] = votedPlayerId;
    gameState.updatedAt = new Date().toISOString();

    const allVoted = Object.keys(gameState.votes).length >= activePlayers.length;

    if (allVoted) {
      const results = calculateVotingResults(gameState.votes, gameState.players);
      
      if (results.isTie) {
        gameState.phase = 'tie-breaker';
        gameState.tiedPlayers = results.tiedPlayers; // Guardar jugadores empatados
        return {
          success: true,
          votingComplete: true,
          isTie: true,
          tiedPlayers: results.tiedPlayers.map(playerId => {
            const p = gameState.players.find(player => player.userId === playerId);
            return { userId: p.userId, username: p.username };
          }),
          gameState: this.getGameState(roomId, voterId),
        };
      }

      const eliminatedPlayer = gameState.players.find((p) => p.userId === results.mostVotedId);

      if (eliminatedPlayer) {
        eliminatedPlayer.isEliminated = true;
      }

      const victoryCheck = checkVictoryConditions(gameState.players);
      if (victoryCheck.winner) {
        gameState.phase = 'victory';
        gameState.winner = victoryCheck.winner;
      } else {
        gameState.phase = 'results';
      }

      return {
        success: true,
        votingComplete: true,
        isTie: false,
        results: {
          mostVotedId: results.mostVotedId,
          voteCounts: results.voteCounts,
          eliminatedPlayer: eliminatedPlayer ? {
            userId: eliminatedPlayer.userId,
            username: eliminatedPlayer.username,
            isImpostor: eliminatedPlayer.isImpostor,
          } : null,
        },
        victoryCheck: victoryCheck,
        gameState: this.getGameState(roomId, voterId),
      };
    }

    return {
      success: true,
      votingComplete: false,
      isTie: false,
      gameState: this.getGameState(roomId, voterId),
    };
  }

  /**
   * Resuelve un empate en la votación.
   * @param {string} roomId - ID de la sala.
   * @returns {Object} El resultado final de la votación después de resolver el empate.
   */
  breakTie(roomId) {
    const gameState = this.gamesByRoomId.get(roomId);
    if (!gameState || gameState.phase !== 'tie-breaker' || !gameState.tiedPlayers) {
      throw new Error('No hay un empate que resolver o el estado es incorrecto.');
    }

    // Usar la función de gameLogic para resolver el empate
    const { resolveVoteTie } = require('../utils/gameLogic');
    const eliminatedPlayerId = resolveVoteTie(gameState.tiedPlayers);

    const eliminatedPlayer = gameState.players.find((p) => p.userId === eliminatedPlayerId);
    if (eliminatedPlayer) {
      eliminatedPlayer.isEliminated = true;
    }
    
    // Limpiar el estado de empate
    delete gameState.tiedPlayers;

    const victoryCheck = checkVictoryConditions(gameState.players);
    if (victoryCheck.winner) {
      gameState.phase = 'victory';
      gameState.winner = victoryCheck.winner;
    } else {
      gameState.phase = 'results';
    }
    
    gameState.updatedAt = new Date().toISOString();

    return {
      success: true,
      votingComplete: true,
      isTie: true, // Se mantiene para que el cliente sepa que vino de un empate
      results: {
        mostVotedId: eliminatedPlayerId,
        voteCounts: gameState.votes, // Los votos originales
        eliminatedPlayer: eliminatedPlayer ? {
          userId: eliminatedPlayer.userId,
          username: eliminatedPlayer.username,
          isImpostor: eliminatedPlayer.isImpostor,
        } : null,
      },
      victoryCheck: victoryCheck,
    };
  }

  /**
   * Maneja la desconexión de un jugador en medio de una partida.
   * @param {string} roomId - ID de la sala.
   * @param {string} disconnectedPlayerId - ID del jugador que se desconectó.
   * @returns {Object|null} Objeto con el estado del juego actualizado o null si no hay cambios.
   */
  handlePlayerDisconnect(roomId, disconnectedPlayerId) {
    const gameState = this.gamesByRoomId.get(roomId);
    if (!gameState) return null;

    const player = gameState.players.find(
      (p) => p.userId === disconnectedPlayerId,
    );
    if (!player || player.isEliminated) return null;

    console.log(
      `[Game] Manejando desconexión del jugador ${player.username} en la sala ${roomId}.`,
    );
    player.isEliminated = true;
    gameState.updatedAt = new Date().toISOString();

    // Notificar que el jugador fue eliminado por desconexión
    const disconnectionUpdate = {
      eliminatedByDisconnect: {
        userId: player.userId,
        username: player.username,
        isImpostor: player.isImpostor,
      },
    };

    // 1. Revisar condiciones de victoria inmediatamente
    const victoryCheck = checkVictoryConditions(gameState.players);
    if (victoryCheck.winner) {
      gameState.phase = 'victory';
      gameState.winner = victoryCheck.winner;
      console.log(
        `[Game] Desconexión resultó en victoria para ${victoryCheck.winner}.`,
      );
      return {
        ...disconnectionUpdate,
        victoryCheck,
        gameState: this.getGameState(roomId),
      };
    }

    // 2. Ajustar el estado del juego según la fase actual
    const activePlayers = gameState.players.filter((p) => !p.isEliminated);

    if (gameState.phase === 'clues') {
      // Si el jugador desconectado tenía el turno, el turno no avanza automáticamente.
      // El siguiente jugador en la secuencia tomará el turno.
      // No se necesita un cambio explícito del `currentTurn` porque al recalcular
      // los jugadores activos, el índice `currentTurn` apuntará a un nuevo jugador si el
      // jugador actual fue el que se eliminó, o el array se acortará.
      // Sin embargo, si el último jugador se desconecta, la fase debe cambiar.
      if (gameState.currentTurn >= activePlayers.length) {
        gameState.phase = 'voting';
        gameState.votes = {}; // Reiniciar votos para la nueva fase
        console.log('[Game] Todos los jugadores activos han dado su pista tras desconexión. Pasando a votación.');
      }
    } else if (gameState.phase === 'voting') {
      // Si un jugador se desconecta durante la votación, se le cuenta como si hubiera votado.
      // Revisar si todos los jugadores activos restantes ya han votado.
      const remainingPlayersHaveVoted = activePlayers.every(
        (p) => gameState.votes[p.userId],
      );
      if (remainingPlayersHaveVoted && activePlayers.length > 0) {
        // Si todos los que quedan han votado, procesar los resultados.
        console.log('[Game] Todos los jugadores restantes han votado tras desconexión. Procesando resultados.');
        // Esta lógica es compleja y se maneja en `submitVote`. Aquí solo forzamos la transición si es necesario.
        // Dado que `submitVote` se encarga del cálculo, lo ideal es no duplicar esa lógica.
        // Simplemente nos aseguramos de que el juego no se quede atascado.
        // Una opción es emitir un evento especial que el `gameSocket` pueda usar para recalcular.
      }
    }

    console.log(
      `[Game] El jugador ${player.username} ha sido eliminado por desconexión.`,
    );
    return { ...disconnectionUpdate, gameState: this.getGameState(roomId) };
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
   * Confirmar que un jugador ha visto su rol
   * @param {string} roomId - ID de la sala
   * @param {string} playerId - ID del jugador que confirma
   * @returns {Object} Objeto con success (boolean), phaseChanged (boolean) y gameState
   */
  confirmRolesViewed(roomId, playerId) {
    const gameState = this.gamesByRoomId.get(roomId);

    if (!gameState) {
      throw new Error('Juego no encontrado');
    }

    // Verificar que estamos en fase de roles
    if (gameState.phase !== 'roles') {
      throw new Error('No estás en la fase de roles');
    }

    // Verificar que el jugador está en el juego
    const player = gameState.players.find((p) => p.userId === playerId);
    if (!player) {
      throw new Error('Jugador no encontrado en el juego');
    }

    // Verificar si ya confirmó
    if (gameState.rolesConfirmed.has(playerId)) {
      // Ya confirmó, retornar estado actual sin error
      return {
        success: true,
        phaseChanged: false,
        gameState: this.getGameState(roomId, playerId),
      };
    }

    // Marcar como confirmado
    gameState.rolesConfirmed.add(playerId);
    gameState.updatedAt = new Date().toISOString();

    // Verificar si todos los jugadores activos han confirmado
    const activePlayers = gameState.players.filter((p) => !p.isEliminated);
    const allConfirmed = activePlayers.every((p) => gameState.rolesConfirmed.has(p.userId));

    let phaseChanged = false;
    if (allConfirmed) {
      // Todos confirmaron, cambiar a fase de pistas
      gameState.phase = 'clues';
      phaseChanged = true;
      gameState.updatedAt = new Date().toISOString();
    }

    return {
      success: true,
      phaseChanged: phaseChanged,
      gameState: this.getGameState(roomId, playerId),
    };
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

    // Resetear pistas, votos y confirmaciones de roles
    gameState.clues = [];
    gameState.votes = {};
    gameState.rolesConfirmed = new Set();
    gameState.currentTurn = 0;

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
