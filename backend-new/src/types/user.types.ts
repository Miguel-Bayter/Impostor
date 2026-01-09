export interface UserPayload {
  userId: string;
  username: string;
  email: string;
}

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
