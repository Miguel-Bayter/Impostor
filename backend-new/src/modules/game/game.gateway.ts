import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { GameService } from './game.service';
import { GamePhase } from '../../types/game.types';
import { SubmitClueDto } from './dto/submit-clue.dto';
import { SubmitVoteDto } from './dto/submit-vote.dto';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      userId: string;
      username: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private gameService: GameService) {}

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:start')
  async handleStartGame(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const gameState = await this.gameService.startGame(data.roomId, userId);

      // Notify all players in room
      this.server.to(data.roomId).emit('game:started', { gameState });

      // Send individual roles to each player
      for (const player of gameState.players) {
        const playerRole = await this.gameService.getPlayerRole(data.roomId, player.userId);

        // Find player's socket and send their role
        const playerSockets = await this.server.in(data.roomId).fetchSockets();
        const playerSocket = playerSockets.find(
          (s) => (s as unknown as AuthenticatedSocket).data.user?.userId === player.userId,
        );

        if (playerSocket) {
          playerSocket.emit('game:role', {
            isImpostor: playerRole.isImpostor,
            secretWord: playerRole.secretWord,
          });
        }
      }
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to start game',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:confirmRole')
  async handleConfirmRole(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      await this.gameService.confirmRole(data.roomId, userId);

      const gameState = await this.gameService.getGameState(data.roomId);
      if (gameState) {
        // Notify all players
        this.server.to(data.roomId).emit('game:phaseChanged', {
          phase: gameState.phase,
          gameState,
        });
      }

      client.emit('game:roleConfirmed', { success: true });
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to confirm role',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:submitClue')
  async handleSubmitClue(
    @MessageBody() dto: SubmitClueDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const gameState = await this.gameService.submitClue(dto.roomId, userId, dto.clue);

      // Notify all players
      this.server.to(dto.roomId).emit('game:clueSubmitted', {
        gameState,
        playerId: userId,
      });

      // If phase changed to voting, notify
      if (gameState.phase === GamePhase.VOTING) {
        this.server.to(dto.roomId).emit('game:phaseChanged', {
          phase: gameState.phase,
          gameState,
        });
      }

      client.emit('game:clueAccepted', { success: true });
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to submit clue',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:submitVote')
  async handleSubmitVote(
    @MessageBody() dto: SubmitVoteDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const gameState = await this.gameService.submitVote(dto.roomId, userId, dto.votedPlayerId);

      // Notify all players
      this.server.to(dto.roomId).emit('game:voteSubmitted', {
        gameState,
        voterId: userId,
      });

      // If phase changed, notify
      if (
        gameState.phase === GamePhase.RESULTS ||
        gameState.phase === GamePhase.VICTORY ||
        gameState.phase === GamePhase.TIE_BREAKER
      ) {
        this.server.to(dto.roomId).emit('game:phaseChanged', {
          phase: gameState.phase,
          gameState,
        });
      }

      client.emit('game:voteAccepted', { success: true });
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to submit vote',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:resolveTie')
  async handleResolveTie(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const gameState = await this.gameService.resolveTie(data.roomId);

      // Notify all players
      this.server.to(data.roomId).emit('game:tieResolved', { gameState });

      // Notify phase change
      this.server.to(data.roomId).emit('game:phaseChanged', {
        phase: gameState.phase,
        gameState,
      });
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to resolve tie',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:continueNextRound')
  async handleContinueNextRound(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const gameState = await this.gameService.continueToNextRound(data.roomId);

      // Notify all players
      this.server.to(data.roomId).emit('game:nextRound', { gameState });

      // Notify phase change
      this.server.to(data.roomId).emit('game:phaseChanged', {
        phase: gameState.phase,
        gameState,
      });
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to continue to next round',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:end')
  async handleEndGame(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      await this.gameService.endGame(data.roomId);

      // Notify all players
      this.server.to(data.roomId).emit('game:ended', { success: true });

      client.emit('game:endSuccess', { success: true });
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to end game',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('game:getState')
  async handleGetGameState(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const gameState = await this.gameService.getGameState(data.roomId);

      if (!gameState) {
        throw new WsException('Game not found');
      }

      client.emit('game:state', { gameState });
    } catch (error) {
      client.emit('game:error', {
        message: error instanceof Error ? error.message : 'Failed to get game state',
      });
    }
  }
}
