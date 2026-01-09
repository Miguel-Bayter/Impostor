import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, CallbackWithoutResultAndOptionalError } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

// Extend UserDocument with comparePassword method
export interface UserDocument extends HydratedDocument<User> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, default: () => uuidv4() })
  _id!: string;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 30 })
  username!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, minlength: 6, select: false })
  password!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: null })
  lastLogin!: Date | null;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: String, default: null })
  socketId!: string | null;

  @Prop({ type: String, default: null })
  currentRoomId!: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ socketId: 1 }, { sparse: true });
UserSchema.index({ currentRoomId: 1 }, { sparse: true });

// Instance method for password comparison
UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash password before save
UserSchema.pre('save', async function (next: CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
