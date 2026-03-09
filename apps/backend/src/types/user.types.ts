import type { SharedUserPayload } from '@impostor/types';

export interface UserPayload {
  userId: string;
  username: string;
  email: string;
}

export type UserPayloadContract = SharedUserPayload;

export interface JwtPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  user: UserPayload;
  token: string;
}
