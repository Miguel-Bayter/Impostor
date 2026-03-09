import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

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
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private roomsService: RoomsService) {}

  handleConnection(client: AuthenticatedSocket): void {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.data.user?.userId;
    if (!userId) return;

    console.log(`Client disconnected: ${client.id}, userId: ${userId}`);

    try {
      const { roomId, room } = await this.roomsService.handlePlayerDisconnect(userId, client.id);
      if (roomId && room) {
        this.server.to(roomId).emit('room:playerDisconnected', {
          room,
          userId,
        });
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:create')
  async handleCreateRoom(
    @MessageBody() dto: CreateRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const room = await this.roomsService.createRoom(userId, dto);

      // Join the socket room
      await client.join(room.id);

      client.emit('room:created', { room });
    } catch (error) {
      client.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to create room',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @MessageBody() dto: JoinRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const room = await this.roomsService.joinRoom(dto.roomId, userId, client.id);

      // Join the socket room
      await client.join(room.id);

      // Notify room about new player
      this.server.to(room.id).emit('room:playerJoined', { room });

      // Send room data to joining player
      client.emit('room:joined', { room });
    } catch (error) {
      client.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to join room',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:joinByCode')
  async handleJoinRoomByCode(
    @MessageBody() data: { code: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const room = await this.roomsService.joinRoomByCode(data.code, userId, client.id);

      // Join the socket room
      await client.join(room.id);

      // Notify room about new player
      this.server.to(room.id).emit('room:playerJoined', { room });

      // Send room data to joining player
      client.emit('room:joined', { room });
    } catch (error) {
      client.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to join room by code',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const userId = client.data.user?.userId;
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      await this.roomsService.leaveRoom(data.roomId, userId);

      // Leave the socket room
      await client.leave(data.roomId);

      // Notify room about player leaving
      this.server.to(data.roomId).emit('room:playerLeft', {
        userId,
      });

      client.emit('room:left', { success: true });
    } catch (error) {
      client.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to leave room',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:list')
  async handleListRooms(@ConnectedSocket() client: AuthenticatedSocket): Promise<void> {
    try {
      const rooms = await this.roomsService.listAvailableRooms();
      client.emit('room:list', { rooms });
    } catch (error) {
      client.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to list rooms',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:get')
  async handleGetRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const room = await this.roomsService.getRoom(data.roomId);
      client.emit('room:data', { room });
    } catch (error) {
      client.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to get room',
      });
    }
  }
}
