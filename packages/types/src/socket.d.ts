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
  pong: (data: unknown) => void;

  'room:joined': (data: { room: SharedRoom }) => void;
  'room:left': (data: { room?: SharedRoom | null; success?: boolean }) => void;
  'room:created': (data: { room: SharedRoom }) => void;
  'room:closed': (data: { message: string }) => void;
  'room:playerJoined': (data: { player: SharedRoomPlayer; room: SharedRoom }) => void;
  'room:playerLeft': (data: { player: SharedRoomPlayer; room: SharedRoom }) => void;
  'room:playerDisconnected': (data: { room: SharedRoom; userId: string }) => void;
  'room:state': (data: { room: SharedRoom }) => void;
  'room:reconnected': (data: {
    room: SharedRoom;
    gameState?: SharedGameState;
    message: string;
  }) => void;
  'room:list': (data: { rooms: SharedRoom[] }) => void;
  'room:data': (data: { room: SharedRoom }) => void;
  'room:error': (data: SharedRoomError) => void;

  'game:started': (data: { gameState: SharedGameState }) => void;
  'game:role': (data: { isImpostor: boolean; secretWord: string }) => void;
  'game:roleConfirmed': (data: { success: boolean }) => void;
  'game:state': (data: { gameState: SharedGameState; phase: SharedGamePhase }) => void;
  'game:clueSubmitted': (data: {
    gameState?: SharedGameState;
    playerId: string;
    playerName?: string;
    clue?: string;
    roomId?: string;
  }) => void;
  'game:clueAccepted': (data: { success: boolean }) => void;
  'game:turnChanged': (data: { currentTurn: number }) => void;
  'game:voteSubmitted': (data: {
    gameState?: SharedGameState;
    voterId: string;
    voterName?: string;
    votedPlayerId?: string;
  }) => void;
  'game:voteAccepted': (data: { success: boolean }) => void;
  'game:votingResults': (data: {
    results: { playerId: string; votes: number }[];
    eliminatedPlayer?: SharedRoomPlayer;
    victoryCheck?: { winner: 'citizens' | 'impostor' };
    isTieResolution?: boolean;
  }) => void;
  'game:tie': (data: { tiedPlayers: SharedRoomPlayer[] }) => void;
  'game:tieResolved': (data: { gameState: SharedGameState }) => void;
  'game:nextRound': (data: { gameState: SharedGameState }) => void;
  'game:phaseChanged': (data: { phase: SharedGamePhase; message?: string }) => void;
  'game:wordGuessed': (data: { message: string }) => void;
  'game:victory': (data: { winner: 'citizens' | 'impostor' }) => void;
  'game:ended': (data: { success: boolean }) => void;
  'game:endSuccess': (data: { success: boolean }) => void;
  'game:error': (data: SharedGameError) => void;
}

export interface SharedClientToServerEvents {
  'auth:login': (data: { email: string; password: string }) => void;
  'auth:register': (data: { username: string; email: string; password: string }) => void;

  'room:create': (data: {
    name: string;
    maxPlayers: number;
    minPlayers: number;
    numImpostors: number;
    isPrivate: boolean;
  }) => void;
  'room:join': (data: { roomId: string }) => void;
  'room:joinByCode': (data: { code: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:list': () => void;
  'room:get': (data: { roomId: string }) => void;
  'room:state': (data: { roomId: string }) => void;

  'game:start': (data: { roomId: string }) => void;
  'game:startCluesPhase': (data: { roomId: string }) => void;
  'game:submitClue': (data: { roomId: string; clue: string }) => void;
  'game:submitVote': (data: { roomId: string; votedPlayerId: string }) => void;
  'game:resolveTie': (data: { roomId: string }) => void;
  'game:startNewRound': (data: { roomId: string }) => void;
  'game:continueNextRound': (data: { roomId: string }) => void;
  'game:confirmRole': (data: { roomId: string }) => void;
  'game:confirmRoles': (data: { roomId: string }) => void;
  'game:end': (data: { roomId: string }) => void;
  'game:getState': (data: { roomId: string }) => void;
}
