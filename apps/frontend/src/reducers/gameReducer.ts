import type { User, Room, GameState, Player, Phase } from '@/types/game';
import { StorageService, StorageKey } from '@/services/StorageService';

export interface State {
  user: User | null;
  room: Room | null;
  gameState: GameState | null;
  phase: Phase;
  token: string | null;
  error: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

export type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_ROOM'; payload: Room | null }
  | { type: 'SET_GAME_STATE'; payload: GameState | null }
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_GAME' };

export const initialState: State = {
  user: null,
  room: null,
  gameState: null,
  phase: 'waiting',
  token: StorageService.get<string>(StorageKey.AUTH_TOKEN),
  error: null,
  isConnected: false,
  isLoading: false,
};

export const gameReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TOKEN':
      if (action.payload) {
        StorageService.set(StorageKey.AUTH_TOKEN, action.payload);
      } else {
        StorageService.remove(StorageKey.AUTH_TOKEN);
      }
      return { ...state, token: action.payload };
    case 'SET_ROOM':
      return { ...state, room: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'UPDATE_PLAYERS':
      if (!state.room) return state;
      return {
        ...state,
        room: { ...state.room, players: action.payload },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_GAME':
      return {
        ...state,
        gameState: null,
        phase: 'waiting',
      };
    default:
      return state;
  }
};
