import type { SharedRoomPlayer } from './room';

export type SharedGamePhase =
  | 'waiting'
  | 'roles'
  | 'clues'
  | 'voting'
  | 'results'
  | 'victory'
  | 'tie-breaker';

export type SharedWinner = 'citizens' | 'impostor' | null;

export interface SharedClue {
  playerId: string;
  playerName: string;
  clue: string;
}

export interface SharedGameState {
  roomId: string;
  phase: SharedGamePhase;
  players?: SharedRoomPlayer[];
  currentTurn?: number;
  currentRound?: number;
  secretWord?: string | null;
  clues: SharedClue[];
  votes: Record<string, string>;
  winner?: SharedWinner;
  impostorId?: string;
}
