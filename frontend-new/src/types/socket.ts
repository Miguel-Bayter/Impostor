/**
 * Socket Event Type Definitions
 * Provides strict typing for Socket.io client-server communication
 */

import type { User, Room, GameState, Phase, Player } from './game';

// Server → Client Events
export interface ServerToClientEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;

  // Room events
  'room:joined': (data: { room: Room }) => void;
  'room:left': (data: { room: Room }) => void;
  'room:closed': (data: { message: string }) => void;
  'room:playerJoined': (data: { player: Player; room: Room }) => void;
  'room:playerLeft': (data: { player: Player; room: Room }) => void;
  'room:state': (data: { room: Room }) => void;
  'room:reconnected': (data: { room: Room; gameState?: GameState; message: string }) => void;
  'room:error': (data: { error: string; message: string }) => void;

  // Game events
  'game:state': (data: { gameState: GameState; phase: Phase }) => void;
  'game:clueSubmitted': (data: { playerName: string; clue: string; playerId: string; roomId: string }) => void;
  'game:turnChanged': (data: { currentTurn: number }) => void;
  'game:voteSubmitted': (data: { voterId: string; voterName: string; votedPlayerId: string }) => void;
  'game:votingResults': (data: {
    results: { playerId: string; votes: number }[];
    eliminatedPlayer?: Player;
    victoryCheck?: { winner: 'citizens' | 'impostors' };
    isTieResolution?: boolean;
  }) => void;
  'game:tie': (data: { tiedPlayers: Player[] }) => void;
  'game:phaseChanged': (data: { phase: Phase; message?: string }) => void;
  'game:wordGuessed': (data: { message: string }) => void;
  'game:victory': (data: { winner: 'citizens' | 'impostors' }) => void;
  'game:error': (data: { error: string; message: string }) => void;

  // Test event
  pong: (data: unknown) => void;
}

// Client → Server Events
export interface ClientToServerEvents {
  // Auth events
  'auth:login': (data: { email: string; password: string }) => void;
  'auth:register': (data: { username: string; email: string; password: string }) => void;

  // Room events
  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:state': (data: { roomId: string }) => void;

  // Game events
  'game:start': (data: { roomId: string }) => void;
  'game:startCluesPhase': (data: { roomId: string }) => void;
  'game:submitClue': (data: { roomId: string; clue: string }) => void;
  'game:submitVote': (data: { roomId: string; votedPlayerId: string }) => void;
  'game:resolveTie': (data: { roomId: string }) => void;
  'game:getState': (data: { roomId: string }) => void;
  'game:startNewRound': (data: { roomId: string }) => void;
  'game:confirmRoles': (data: { roomId: string }) => void; // deprecated
}

// Authentication Response Types
export interface AuthSuccessResponse {
  user: User;
  token: string;
}

export interface AuthErrorResponse {
  error: string;
  message: string;
}

// Type alias for voting results data
export type VotingResultsData = {
  results: { playerId: string; votes: number }[];
  eliminatedPlayer?: Player;
  victoryCheck?: { winner: 'citizens' | 'impostors' };
  isTieResolution?: boolean;
};

/**
 * Simplified event payload mapping for type-safe socket event handling
 * Maps event names to their payload types for compile-time safety
 */
export interface SocketEvents {
  // Connection events
  connect: void;
  disconnect: string;
  error: { error: string; message: string };

  // Room events
  roomState: Room | null;
  roomClosed: { message: string };
  playerJoined: { player: Player; room: Room };
  playerLeft: { player: Player; room: Room };
  roomReconnected: { room: Room; gameState?: GameState };

  // Game events
  gameState: { gameState: GameState; phase: Phase };
  clueSubmitted: { playerName: string; clue: string };
  voteSubmitted: { voterId: string; voterName?: string };
  votingResults: VotingResultsData;
  phaseChanged: { phase: Phase; message?: string };
  wordGuessed: { message: string };
  gameTie: { tiedPlayers: Player[] };
  gameVictory: { winner: 'citizens' | 'impostors' };
}

/**
 * Type-safe callback inference for socket events
 * Automatically infers the correct callback type based on event name
 *
 * @template K - Event name from SocketEvents
 *
 * @example
 * // Callback for 'connect' event (void payload)
 * const onConnect: SocketEventCallback<'connect'> = () => { ... };
 *
 * // Callback for 'playerJoined' event (typed payload)
 * const onPlayerJoined: SocketEventCallback<'playerJoined'> = (data) => {
 *   // data is typed as { player: Player; room: Room }
 * };
 */
export type SocketEventCallback<K extends keyof SocketEvents> = SocketEvents[K] extends void
  ? () => void
  : (data: SocketEvents[K]) => void;
