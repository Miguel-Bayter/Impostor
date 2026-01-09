export enum GamePhase {
  ROLES = 'roles',
  CLUES = 'clues',
  VOTING = 'voting',
  RESULTS = 'results',
  VICTORY = 'victory',
  TIE_BREAKER = 'tie-breaker',
}

export interface GamePlayer {
  userId: string;
  username: string;
  isImpostor: boolean;
  isEliminated: boolean;
}

export interface GameClue {
  playerId: string;
  playerName: string;
  clue: string;
}

export interface GameVotes {
  [voterId: string]: string; // voterId -> votedPlayerId
}

export interface GameState {
  roomId: string;
  secretWord: string | null; // null for impostors
  players: GamePlayer[];
  currentRound: number;
  currentTurn: number;
  clues: GameClue[];
  votes: GameVotes;
  phase: GamePhase;
  winner: 'citizens' | 'impostor' | null;
  rolesConfirmed: Set<string>;
}
