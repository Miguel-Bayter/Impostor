import * as validator from 'validator';

const LIMITS = {
  CLUE_MAX_LENGTH: 50,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 100,
  ROOM_NAME_MAX_LENGTH: 50,
};

export function sanitizeClue(clue: string): string {
  if (!clue || typeof clue !== 'string') return '';

  let sanitized = clue.trim();
  if (sanitized.length > LIMITS.CLUE_MAX_LENGTH) {
    sanitized = sanitized.substring(0, LIMITS.CLUE_MAX_LENGTH);
  }

  sanitized = validator.escape(sanitized);
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return '';

  let sanitized = username.trim();
  if (sanitized.length > LIMITS.USERNAME_MAX_LENGTH) {
    sanitized = sanitized.substring(0, LIMITS.USERNAME_MAX_LENGTH);
  }

  sanitized = validator.escape(sanitized);
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\sáéíóúÁÉÍÓÚñÑüÜ]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null;

  let sanitized = email.toLowerCase().trim();
  if (sanitized.length > LIMITS.EMAIL_MAX_LENGTH) {
    sanitized = sanitized.substring(0, LIMITS.EMAIL_MAX_LENGTH);
  }

  if (!validator.isEmail(sanitized)) return null;

  return sanitized;
}

export function sanitizeRoomName(roomName: string): string {
  return sanitizeString(roomName, LIMITS.ROOM_NAME_MAX_LENGTH);
}

function sanitizeString(input: string, maxLength = 100): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input.trim();
  if (maxLength > 0 && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  sanitized = validator.escape(sanitized);
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

export function isValidAfterSanitization(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return input.trim().length > 0;
}

export { LIMITS };
