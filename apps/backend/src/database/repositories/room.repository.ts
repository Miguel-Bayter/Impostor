import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room as RoomSchema, RoomDocument } from '../schemas/room.schema';
import { Room, RoomStatus } from '../../types/room.types';

@Injectable()
export class RoomRepository {
  constructor(@InjectModel(RoomSchema.name) private roomModel: Model<RoomDocument>) {}

  async create(
    hostId: string,
    hostUsername: string,
    name: string,
    maxPlayers: number,
    minPlayers: number,
    numImpostors: number,
    isPrivate: boolean,
  ): Promise<RoomDocument> {
    const now = new Date().toISOString();
    const room = new this.roomModel({
      hostId,
      name,
      maxPlayers,
      settings: { minPlayers, numImpostors },
      isPrivate,
      status: RoomStatus.WAITING,
      players: [
        {
          userId: hostId,
          username: hostUsername,
          socketId: null,
          joinedAt: now,
          isHost: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
    return room.save();
  }

  async findById(roomId: string): Promise<RoomDocument | null> {
    return this.roomModel.findById(roomId).exec();
  }

  async findByCodePrefix(codePrefix: string): Promise<RoomDocument | null> {
    const rooms = await this.roomModel.find().exec();
    return rooms.find((room) => room._id.startsWith(codePrefix)) || null;
  }

  async findByPlayerId(userId: string): Promise<RoomDocument | null> {
    return this.roomModel.findOne({ 'players.userId': userId }).exec();
  }

  async findAvailableRooms(): Promise<RoomDocument[]> {
    return this.roomModel
      .find({
        status: RoomStatus.WAITING,
        isPrivate: false,
      })
      .exec();
  }

  async addPlayer(
    roomId: string,
    userId: string,
    username: string,
    socketId: string,
  ): Promise<RoomDocument | null> {
    const now = new Date().toISOString();
    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          $push: {
            players: {
              userId,
              username,
              socketId,
              joinedAt: now,
              isHost: false,
            },
          },
          updatedAt: now,
        },
        { new: true },
      )
      .exec();
  }

  async removePlayer(roomId: string, userId: string): Promise<RoomDocument | null> {
    const now = new Date().toISOString();
    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          $pull: { players: { userId } },
          updatedAt: now,
        },
        { new: true },
      )
      .exec();
  }

  async updatePlayerSocket(
    roomId: string,
    userId: string,
    socketId: string,
  ): Promise<RoomDocument | null> {
    const now = new Date().toISOString();
    return this.roomModel
      .findOneAndUpdate(
        { _id: roomId, 'players.userId': userId },
        {
          $set: { 'players.$.socketId': socketId },
          updatedAt: now,
        },
        { new: true },
      )
      .exec();
  }

  async updateStatus(roomId: string, status: RoomStatus): Promise<RoomDocument | null> {
    const now = new Date().toISOString();
    return this.roomModel
      .findByIdAndUpdate(roomId, { status, updatedAt: now }, { new: true })
      .exec();
  }

  async updateHost(roomId: string, newHostId: string): Promise<RoomDocument | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    const players = room.players.map((player) => ({
      ...player,
      isHost: player.userId === newHostId,
    }));

    const now = new Date().toISOString();
    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          hostId: newHostId,
          players,
          updatedAt: now,
        },
        { new: true },
      )
      .exec();
  }

  async delete(roomId: string): Promise<void> {
    await this.roomModel.findByIdAndDelete(roomId).exec();
  }

  async deleteOldRooms(olderThan: Date): Promise<number> {
    const result = await this.roomModel
      .deleteMany({
        status: RoomStatus.WAITING,
        createdAt: { $lt: olderThan.toISOString() },
      })
      .exec();
    return result.deletedCount || 0;
  }

  sanitizeRoom(room: RoomDocument): Room {
    return {
      id: room._id,
      hostId: room.hostId,
      name: room.name,
      status: room.status,
      maxPlayers: room.maxPlayers,
      players: room.players.map((player) => ({
        userId: player.userId,
        username: player.username,
        socketId: null, // Don't expose socket IDs
        joinedAt: player.joinedAt,
        isHost: player.isHost,
      })),
      settings: room.settings,
      isPrivate: room.isPrivate,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
