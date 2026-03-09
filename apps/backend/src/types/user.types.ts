import type { SharedAuthResponse, SharedUserPayload } from '@impostor/types';

export type UserPayload = SharedUserPayload;

export type UserPayloadContract = SharedUserPayload;

export interface JwtPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export type AuthResponse = SharedAuthResponse;
