import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RoomRepository } from '../../database/repositories/room.repository';
import { UserRepository } from '../../database/repositories/user.repository';
import { Room, RoomStatus, RoomPlayer } from '../../types/room.types';
import { RoomDocument } from '../../database/schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { sanitizeRoomName } from '../../common/utils/sanitizer.util';

@Injectable()
export class RoomsService {
  constructor(
    private roomRepository: RoomRepository,
    private userRepository: UserRepository,
  ) {}

  async createRoom(userId: string, dto: CreateRoomDto): Promise<Room> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already in a room
    const existingRoom = await this.roomRepository.findByPlayerId(userId);
    if (existingRoom) {
      throw new ConflictException('You are already in a room');
    }

    const roomName = dto.name ? sanitizeRoomName(dto.name) : `${user.username}'s Room`;
    const maxPlayers = dto.maxPlayers || 8;
    const minPlayers = dto.minPlayers || 3;
    const numImpostors = dto.numImpostors || 1;
    const isPrivate = dto.isPrivate || false;

    if (minPlayers < 3) {
      throw new BadRequestException('Minimum players must be at least 3');
    }

    if (maxPlayers < minPlayers) {
      throw new BadRequestException('Maximum players cannot be less than minimum players');
    }

    if (numImpostors >= minPlayers) {
      throw new BadRequestException('Number of impostors must be less than minimum players');
    }

    const room = await this.roomRepository.create(
      userId,
      user.username,
      roomName,
      maxPlayers,
      minPlayers,
      numImpostors,
      isPrivate,
    );

    await this.userRepository.updateCurrentRoom(userId, room._id);

    return this.formatRoom(room);
  }

  async joinRoom(roomId: string, userId: string, socketId: string): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      throw new BadRequestException('Room is full');
    }

    // Check if game already started
    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Game already started');
    }

    // Check if user is already in this room
    const existingPlayer = room.players.find((p) => p.userId === userId);
    if (existingPlayer) {
      // Reconnection: update socket ID
      const updatedRoom = await this.roomRepository.updatePlayerSocket(roomId, userId, socketId);
      if (!updatedRoom) {
        throw new NotFoundException('Failed to update player socket');
      }
      await this.userRepository.updateSocketId(userId, socketId);
      return this.formatRoom(updatedRoom);
    }

    // Check if user is in another room
    const otherRoom = await this.roomRepository.findByPlayerId(userId);
    if (otherRoom) {
      throw new ConflictException('You are already in another room');
    }

    // Add player to room
    const updatedRoom = await this.roomRepository.addPlayer(
      roomId,
      userId,
      user.username,
      socketId,
    );
    if (!updatedRoom) {
      throw new NotFoundException('Failed to join room');
    }

    await this.userRepository.updateCurrentRoom(userId, roomId);
    await this.userRepository.updateSocketId(userId, socketId);

    return this.formatRoom(updatedRoom);
  }

  async joinRoomByCode(code: string, userId: string, socketId: string): Promise<Room> {
    const room = await this.roomRepository.findByCodePrefix(code);
    if (!room) {
      throw new NotFoundException('Room not found with that code');
    }

    return this.joinRoom(room._id, userId, socketId);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const player = room.players.find((p) => p.userId === userId);
    if (!player) {
      throw new BadRequestException('You are not in this room');
    }

    await this.userRepository.updateCurrentRoom(userId, null);
    await this.userRepository.updateSocketId(userId, null);

    // If host leaves, transfer host to another player or delete room
    if (player.isHost) {
      if (room.players.length === 1) {
        // Last player, delete room
        await this.roomRepository.delete(roomId);
      } else {
        // Transfer host to next player
        const newHost = room.players.find((p) => p.userId !== userId);
        if (newHost) {
          await this.roomRepository.updateHost(roomId, newHost.userId);
        }
        await this.roomRepository.removePlayer(roomId, userId);
      }
    } else {
      await this.roomRepository.removePlayer(roomId, userId);
    }
  }

  async getRoom(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return this.formatRoom(room);
  }

  async listAvailableRooms(): Promise<Room[]> {
    const rooms = await this.roomRepository.findAvailableRooms();
    return rooms.map((room) => this.formatRoom(room));
  }

  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<Room> {
    const room = await this.roomRepository.updateStatus(roomId, status);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return this.formatRoom(room);
  }

  async handlePlayerDisconnect(
    userId: string,
    _socketId: string,
  ): Promise<{ roomId: string | null; room: Room | null }> {
    const room = await this.roomRepository.findByPlayerId(userId);
    if (!room) {
      return { roomId: null, room: null };
    }

    // Update socket to null (mark as disconnected, but don't remove from room yet)
    await this.roomRepository.updatePlayerSocket(room._id, userId, '');
    await this.userRepository.updateSocketId(userId, null);

    return {
      roomId: room._id,
      room: this.formatRoom(room),
    };
  }

  private formatRoom(room: RoomDocument): Room {
    return {
      id: room._id,
      hostId: room.hostId,
      name: room.name,
      status: room.status,
      maxPlayers: room.maxPlayers,
      players: room.players.map(
        (p): RoomPlayer => ({
          userId: p.userId,
          username: p.username,
          socketId: null, // Don't expose socket IDs
          joinedAt: p.joinedAt,
          isHost: p.isHost,
        }),
      ),
      settings: room.settings,
      isPrivate: room.isPrivate,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
