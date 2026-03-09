export interface SharedUserPayload {
  userId: string;
  username: string;
  email: string;
}

export interface SharedAuthResponse {
  user: SharedUserPayload;
  token: string;
}

export interface SharedAuthError {
  error: string;
  message: string;
}
