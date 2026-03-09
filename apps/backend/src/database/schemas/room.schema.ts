import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RoomStatus, RoomPlayer, type RoomSettings } from '../../types/room.types';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ timestamps: false })
export class Room {
  @Prop({ type: String, default: () => uuidv4() })
  _id!: string;

  @Prop({ required: true })
  hostId!: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  name!: string;

  @Prop({
    type: String,
    enum: Object.values(RoomStatus),
    default: RoomStatus.WAITING,
  })
  status!: RoomStatus;

  @Prop({ required: true, min: 3, max: 12 })
  maxPlayers!: number;

  @Prop({ type: [Object], default: [] })
  players!: RoomPlayer[];

  @Prop({
    type: Object,
    default: { minPlayers: 3, numImpostors: 1 },
  })
  settings!: RoomSettings;

  @Prop({ default: false })
  isPrivate!: boolean;

  @Prop({ required: true })
  createdAt!: string;

  @Prop({ required: true })
  updatedAt!: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// Indexes
RoomSchema.index({ hostId: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ name: 1 });
RoomSchema.index({ 'players.userId': 1 });
