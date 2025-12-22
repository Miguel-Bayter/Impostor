const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const roomPlayerSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    socketId: { type: String, default: null },
    joinedAt: { type: String, required: true },
    isHost: { type: Boolean, default: false },
  },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    hostId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['waiting', 'starting', 'in_progress', 'finished'],
      default: 'waiting',
    },
    maxPlayers: { type: Number, required: true },
    players: { type: [roomPlayerSchema], default: [] },
    settings: {
      minPlayers: { type: Number, default: 3 },
      numImpostors: { type: Number, default: 1 },
    },
    isPrivate: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    timestamps: false,
  },
);

roomSchema.index({ hostId: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ name: 1 });
roomSchema.index({ 'players.userId': 1 });

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);
