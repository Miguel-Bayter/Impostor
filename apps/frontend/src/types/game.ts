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

export type User = SharedUserPayload;

export type Player = SharedRoomPlayer & {
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

export type GameState = Omit<SharedGameState, 'players'> & {
  players?: Player[];
  winner?: SharedWinner;
};

export interface GameAction {
  type: 'SET_USER' | 'SET_ROOM' | 'UPDATE_PLAYERS' | 'SET_GAME_STATE' | 'SET_PHASE' | 'ADD_CLUE' | 'RESET_GAME';
  payload: unknown;
}
