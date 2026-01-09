import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RoomRepository } from '../../database/repositories/room.repository';
import { RoomsService } from '../rooms/rooms.service';
import { RedisService } from '../redis/redis.service';
import { GameState, GamePhase, GamePlayer, GameClue } from '../../types/game.types';
import { RoomStatus } from '../../types/room.types';
import {
  getRandomWord,
  validateClue,
  validateVote,
  calculateVotingResults,
  resolveVoteTie,
  checkVictoryConditions,
  validateGameRules,
} from '../../common/utils/game-logic.util';
import { sanitizeClue } from '../../common/utils/sanitizer.util';

@Injectable()
export class GameService {
  private readonly GAME_STATE_TTL = 86400; // 24 hours
  private readonly inMemoryGameStates = new Map<string, GameState>(); // Fallback when Redis unavailable

  constructor(
    private roomRepository: RoomRepository,
    private roomsService: RoomsService,
    private redisService: RedisService,
  ) {}

  async startGame(roomId: string, hostId: string): Promise<GameState> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hostId !== hostId) {
      throw new BadRequestException('Only the host can start the game');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Game already started');
    }

    const numPlayers = room.players.length;
    const numImpostors = room.settings.numImpostors;

    const validation = validateGameRules(numPlayers, numImpostors);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errorMessage);
    }

    // Assign roles
    const players: GamePlayer[] = room.players.map((p) => ({
      userId: p.userId,
      username: p.username,
      isImpostor: false,
      isEliminated: false,
    }));

    // Randomly assign impostors
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numImpostors; i++) {
      shuffled[i].isImpostor = true;
    }

    // Get secret word
    const secretWord = getRandomWord();

    // Create game state
    const gameState: GameState = {
      roomId,
      secretWord,
      players,
      currentRound: 1,
      currentTurn: 0,
      clues: [],
      votes: {},
      phase: GamePhase.ROLES,
      winner: null,
      rolesConfirmed: new Set(),
    };

    // Save game state to Redis
    await this.saveGameState(roomId, gameState);

    // Update room status
    await this.roomsService.updateRoomStatus(roomId, RoomStatus.IN_PROGRESS);

    return gameState;
  }

  async confirmRole(roomId: string, userId: string): Promise<void> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new NotFoundException('Game not found');
    }

    if (gameState.phase !== GamePhase.ROLES) {
      throw new BadRequestException('Not in roles phase');
    }

    gameState.rolesConfirmed.add(userId);

    // Check if all players confirmed
    if (gameState.rolesConfirmed.size === gameState.players.length) {
      gameState.phase = GamePhase.CLUES;
      gameState.rolesConfirmed.clear();
    }

    await this.saveGameState(roomId, gameState);
  }

  async submitClue(roomId: string, userId: string, clue: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new NotFoundException('Game not found');
    }

    if (gameState.phase !== GamePhase.CLUES) {
      throw new BadRequestException('Not in clues phase');
    }

    const player = gameState.players.find((p) => p.userId === userId);
    if (!player) {
      throw new NotFoundException('Player not found in game');
    }

    if (player.isEliminated) {
      throw new BadRequestException('You have been eliminated');
    }

    // Check if player already submitted a clue
    const existingClue = gameState.clues.find((c) => c.playerId === userId);
    if (existingClue) {
      throw new BadRequestException('You already submitted a clue');
    }

    // Sanitize clue
    const sanitized = sanitizeClue(clue);
    if (!sanitized) {
      throw new BadRequestException('Invalid clue');
    }

    // Validate clue
    const validation = validateClue(sanitized, gameState.clues, gameState.secretWord || '');
    if (!validation.isValid) {
      throw new BadRequestException(validation.errorMessage);
    }

    // Add clue
    const newClue: GameClue = {
      playerId: userId,
      playerName: player.username,
      clue: sanitized,
    };

    gameState.clues.push(newClue);

    // Check if all active players submitted clues
    const activePlayers = gameState.players.filter((p) => !p.isEliminated);
    if (gameState.clues.length === activePlayers.length) {
      gameState.phase = GamePhase.VOTING;
    }

    await this.saveGameState(roomId, gameState);
    return gameState;
  }

  async submitVote(roomId: string, userId: string, votedPlayerId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new NotFoundException('Game not found');
    }

    if (gameState.phase !== GamePhase.VOTING) {
      throw new BadRequestException('Not in voting phase');
    }

    const player = gameState.players.find((p) => p.userId === userId);
    if (!player) {
      throw new NotFoundException('Player not found in game');
    }

    if (player.isEliminated) {
      throw new BadRequestException('You have been eliminated');
    }

    // Check if player already voted
    if (gameState.votes[userId]) {
      throw new BadRequestException('You already voted');
    }

    // Validate vote
    const validation = validateVote(userId, votedPlayerId, gameState.players);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errorMessage);
    }

    // Add vote
    gameState.votes[userId] = votedPlayerId;

    // Check if all active players voted
    const activePlayers = gameState.players.filter((p) => !p.isEliminated);
    if (Object.keys(gameState.votes).length === activePlayers.length) {
      // Calculate results
      const results = calculateVotingResults(gameState.votes, gameState.players);

      if (results.isTie) {
        gameState.phase = GamePhase.TIE_BREAKER;
      } else if (results.mostVotedId) {
        // Eliminate player
        const eliminatedPlayer = gameState.players.find((p) => p.userId === results.mostVotedId);
        if (eliminatedPlayer) {
          eliminatedPlayer.isEliminated = true;
        }

        // Check victory conditions
        const victoryCheck = checkVictoryConditions(gameState.players);
        if (victoryCheck.winner) {
          gameState.winner = victoryCheck.winner;
          gameState.phase = GamePhase.VICTORY;
        } else {
          gameState.phase = GamePhase.RESULTS;
        }
      } else {
        gameState.phase = GamePhase.RESULTS;
      }
    }

    await this.saveGameState(roomId, gameState);
    return gameState;
  }

  async resolveTie(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new NotFoundException('Game not found');
    }

    if (gameState.phase !== GamePhase.TIE_BREAKER) {
      throw new BadRequestException('Not in tie breaker phase');
    }

    // Calculate voting results
    const results = calculateVotingResults(gameState.votes, gameState.players);

    if (!results.isTie || results.tiedPlayers.length === 0) {
      throw new BadRequestException('No tie to resolve');
    }

    // Randomly select one of the tied players
    const eliminatedId = resolveVoteTie(results.tiedPlayers);
    if (eliminatedId) {
      const eliminatedPlayer = gameState.players.find((p) => p.userId === eliminatedId);
      if (eliminatedPlayer) {
        eliminatedPlayer.isEliminated = true;
      }
    }

    // Check victory conditions
    const victoryCheck = checkVictoryConditions(gameState.players);
    if (victoryCheck.winner) {
      gameState.winner = victoryCheck.winner;
      gameState.phase = GamePhase.VICTORY;
    } else {
      gameState.phase = GamePhase.RESULTS;
    }

    await this.saveGameState(roomId, gameState);
    return gameState;
  }

  async continueToNextRound(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new NotFoundException('Game not found');
    }

    if (gameState.phase !== GamePhase.RESULTS) {
      throw new BadRequestException('Not in results phase');
    }

    // Check victory conditions again
    const victoryCheck = checkVictoryConditions(gameState.players);
    if (victoryCheck.winner) {
      gameState.winner = victoryCheck.winner;
      gameState.phase = GamePhase.VICTORY;
      await this.saveGameState(roomId, gameState);
      return gameState;
    }

    // Reset for next round
    gameState.currentRound += 1;
    gameState.currentTurn = 0;
    gameState.clues = [];
    gameState.votes = {};
    gameState.phase = GamePhase.CLUES;

    await this.saveGameState(roomId, gameState);
    return gameState;
  }

  async endGame(roomId: string): Promise<void> {
    // Remove from in-memory storage
    this.inMemoryGameStates.delete(roomId);

    // Try to remove from Redis if available
    try {
      await this.redisService.del(`game:${roomId}`);
    } catch {
      // Redis unavailable, ignore
    }

    await this.roomsService.updateRoomStatus(roomId, RoomStatus.FINISHED);
  }

  async getGameState(roomId: string): Promise<GameState | null> {
    try {
      const data = await this.redisService.getJson<GameState>(`game:${roomId}`);
      if (!data) {
        // Fallback to in-memory storage
        return this.inMemoryGameStates.get(roomId) || null;
      }

      // Convert rolesConfirmed from array back to Set
      const rolesArray = Array.isArray(data.rolesConfirmed) ? data.rolesConfirmed : [];
      return {
        ...data,
        rolesConfirmed: new Set<string>(rolesArray as string[]),
      };
    } catch {
      // Redis unavailable, use in-memory storage
      return this.inMemoryGameStates.get(roomId) || null;
    }
  }

  async getPlayerRole(
    roomId: string,
    userId: string,
  ): Promise<{ isImpostor: boolean; secretWord: string | null }> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new NotFoundException('Game not found');
    }

    const player = gameState.players.find((p) => p.userId === userId);
    if (!player) {
      throw new NotFoundException('Player not found in game');
    }

    return {
      isImpostor: player.isImpostor,
      secretWord: player.isImpostor ? null : gameState.secretWord,
    };
  }

  private async saveGameState(roomId: string, gameState: GameState): Promise<void> {
    // Save to in-memory storage first (always works)
    this.inMemoryGameStates.set(roomId, gameState);

    // Try to save to Redis if available
    try {
      const serializable = {
        ...gameState,
        rolesConfirmed: Array.from(gameState.rolesConfirmed),
      };
      await this.redisService.setJson(`game:${roomId}`, serializable, this.GAME_STATE_TTL);
    } catch {
      // Redis unavailable, in-memory storage will be used
      console.log(`Redis unavailable, using in-memory storage for room ${roomId}`);
    }
  }
}
