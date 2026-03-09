import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserPayload } from '../../types/user.types';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(username: string, email: string, password: string): Promise<UserDocument> {
    const user = new this.userModel({ username, email, password });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  async updateSocketId(userId: string, socketId: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { socketId });
  }

  async updateCurrentRoom(userId: string, roomId: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { currentRoomId: roomId });
  }

  async findBySocketId(socketId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ socketId }).exec();
  }

  async findByRoomId(roomId: string): Promise<UserDocument[]> {
    return this.userModel.find({ currentRoomId: roomId }).exec();
  }

  toPayload(user: UserDocument): UserPayload {
    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  }
}
