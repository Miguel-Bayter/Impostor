import type { SharedGamePhase, SharedGameState } from './game';
import type { SharedRoom, SharedRoomPlayer } from './room';

export interface SharedRoomError {
  error: string;
  message: string;
}

export interface SharedGameError {
  error: string;
  message: string;
}

export interface SharedServerToClientEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;

  'room:joined': (data: { room: SharedRoom }) => void;
  'room:left': (data: { room: SharedRoom | null }) => void;
  'room:closed': (data: { message: string }) => void;
  'room:playerJoined': (data: { player: SharedRoomPlayer; room: SharedRoom }) => void;
  'room:playerLeft': (data: { player: SharedRoomPlayer; room: SharedRoom }) => void;
  'room:state': (data: { room: SharedRoom }) => void;
  'room:reconnected': (data: { room: SharedRoom; gameState?: SharedGameState; message: string }) => void;
  'room:error': (data: SharedRoomError) => void;

  'game:state': (data: { gameState: SharedGameState; phase: SharedGamePhase }) => void;
  'game:phaseChanged': (data: { phase: SharedGamePhase; message?: string }) => void;
  'game:error': (data: SharedGameError) => void;
}

export interface SharedClientToServerEvents {
  'auth:login': (data: { email: string; password: string }) => void;
  'auth:register': (data: { username: string; email: string; password: string }) => void;

  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:state': (data: { roomId: string }) => void;

  'game:start': (data: { roomId: string }) => void;
  'game:submitClue': (data: { roomId: string; clue: string }) => void;
  'game:submitVote': (data: { roomId: string; votedPlayerId: string }) => void;
  'game:getState': (data: { roomId: string }) => void;
}
