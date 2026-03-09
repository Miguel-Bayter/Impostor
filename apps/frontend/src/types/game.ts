/**
 * Tipos de datos para el juego Impostor
 */

export type Phase = 'waiting' | 'roles' | 'clues' | 'voting' | 'results' | 'victory';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Player {
  id: string;
  userId: string; // ID del usuario en la base de datos
  username: string;
  isHost: boolean;
  isReady: boolean;
  isImpostor?: boolean;
  isAlive: boolean;
  isConnected?: boolean;
  score: number;
}

export interface Clue {
  playerId: string;
  playerName: string;
  clue: string;
}

export interface Vote {
  voterId: string;
  votedId: string;
}

export interface Room {
  id: string;
  name: string;
  code?: string; // Código de sala privada
  hostId: string;
  players: Player[];
  maxPlayers: number;
  minPlayers?: number; // Jugadores mínimos para iniciar
  status: 'open' | 'waiting' | 'playing' | 'closed';
  isPrivate: boolean;
  settings?: {
    numImpostors?: number;
    minPlayers?: number;
    maxPlayers?: number;
  };
}

export interface GameState {
  roomId: string;
  phase: Phase;
  currentTurn?: number; // Player index (0-based)
  secretWord?: string;
  clues: Clue[];
  votes: { [voterId: string]: string }; // voterId -> targetId
  winners?: 'citizens' | 'impostors';
  impostorId?: string;
}

export interface GameAction {
  type: 'SET_USER' | 'SET_ROOM' | 'UPDATE_PLAYERS' | 'SET_GAME_STATE' | 'SET_PHASE' | 'ADD_CLUE' | 'RESET_GAME';
  payload: unknown;
}
