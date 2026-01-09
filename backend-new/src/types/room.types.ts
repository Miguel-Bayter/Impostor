export enum RoomStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

export interface RoomPlayer {
  userId: string;
  username: string;
  socketId: string | null;
  joinedAt: string;
  isHost: boolean;
}

export interface RoomSettings {
  minPlayers: number;
  numImpostors: number;
}

export interface Room {
  id: string;
  hostId: string;
  name: string;
  status: RoomStatus;
  maxPlayers: number;
  players: RoomPlayer[];
  settings: RoomSettings;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Database document interface (with _id instead of id)
export interface RoomDocument extends Omit<Room, 'id'> {
  _id: string;
}
