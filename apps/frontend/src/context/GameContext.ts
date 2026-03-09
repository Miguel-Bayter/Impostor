import { createContext, type Dispatch } from 'react';
import type { State, Action } from '@/reducers/gameReducer';

export interface GameContextProps {
  state: State;
  dispatch: Dispatch<Action>;
}

export const GameContext = createContext<GameContextProps | undefined>(undefined);
