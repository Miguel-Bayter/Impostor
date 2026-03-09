/**
 * API Service Layer
 * Provides type-safe HTTP methods for backend communication
 */

import api from './api';
import type { User, Room } from '@/types/game';

// Request/Response Types
export interface CreateRoomParams {
  name: string;
  maxPlayers: number;
  minPlayers: number;
  numImpostors: number;
  isPrivate: boolean;
}

export interface ListRoomsResponse {
  rooms: Room[];
}

export interface CreateRoomResponse {
  message: string;
  room: Room;
}

export interface JoinRoomResponse {
  message: string;
  room: Room;
}

export interface GetUserResponse {
  user: User;
}

export interface VerifyTokenResponse {
  valid: boolean;
  error?: string;
  message?: string;
}

/**
 * API Service Class
 * Centralizes all HTTP operations with type safety
 */
class ApiService {
  /**
   * List all public rooms
   */
  async listRooms(): Promise<Room[]> {
    const response = await api.get<ListRoomsResponse>('/api/rooms');
    return response.data.rooms || [];
  }

  /**
   * Create a new room
   */
  async createRoom(params: CreateRoomParams): Promise<Room> {
    const response = await api.post<CreateRoomResponse>('/api/rooms/create', params);
    return response.data.room;
  }

  /**
   * Join a room by ID
   */
  async joinRoom(roomId: string): Promise<Room> {
    const response = await api.post<JoinRoomResponse>('/api/rooms/join', { roomId });
    return response.data.room;
  }

  /**
   * Get current user information
   */
  async getMe(): Promise<User> {
    const response = await api.get<GetUserResponse>('/api/auth/me');
    return response.data.user;
  }

  /**
   * Verify if a token is valid
   */
  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    const response = await api.post<VerifyTokenResponse>('/api/auth/verify', { token });
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
