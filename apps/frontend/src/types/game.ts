import type {
  SharedClue,
  SharedGamePhase,
  SharedGameState,
  SharedRoom,
  SharedRoomPlayer,
  SharedUserPayload,
  SharedWinner,
} from '@impostor/types';

export type Phase = SharedGamePhase;

export type User = Omit<SharedUserPayload, 'userId'> & {
  id: string;
  userId?: string;
};

export type Player = SharedRoomPlayer & {
  id: string;
  score: number;
};

export type Clue = SharedClue;

export interface Vote {
  voterId: string;
  votedId: string;
}

export type Room = Omit<SharedRoom, 'players'> & {
  players: Player[];
};

export type GameState = Omit<SharedGameState, 'players' | 'winner' | 'winners'> & {
  players?: Player[];
  winner?: SharedWinner;
  winners?: 'citizens' | 'impostors';
};

export interface GameAction {
  type: 'SET_USER' | 'SET_ROOM' | 'UPDATE_PLAYERS' | 'SET_GAME_STATE' | 'SET_PHASE' | 'ADD_CLUE' | 'RESET_GAME';
  payload: unknown;
}
