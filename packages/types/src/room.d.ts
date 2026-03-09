export interface SharedRoomPlayer {
  userId: string;
  username: string;
  socketId?: string | null;
  joinedAt?: string;
  isHost: boolean;
  isReady?: boolean;
  isAlive?: boolean;
  isConnected?: boolean;
  score?: number;
  isImpostor?: boolean;
}

export interface SharedRoomSettings {
  minPlayers?: number;
  maxPlayers?: number;
  numImpostors?: number;
}

export type SharedRoomStatus = 'open' | 'waiting' | 'starting' | 'playing' | 'in_progress' | 'finished' | 'closed';

export interface SharedRoom {
  id: string;
  name: string;
  code?: string;
  hostId: string;
  players: SharedRoomPlayer[];
  maxPlayers: number;
  minPlayers?: number;
  status: SharedRoomStatus;
  isPrivate: boolean;
  settings?: SharedRoomSettings;
  createdAt?: string;
  updatedAt?: string;
}
