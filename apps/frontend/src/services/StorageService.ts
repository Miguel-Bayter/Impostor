/**
 * StorageService - Type-safe localStorage abstraction
 *
 * Provides a centralized, type-safe interface for browser storage operations
 * with automatic error handling and graceful fallbacks.
 *
 * Features:
 * - Enum-based storage keys (compile-time safety)
 * - Automatic JSON serialization/deserialization
 * - Error handling for private browsing mode, quota exceeded, etc.
 * - SSR-safe (checks for window availability)
 * - Never throws - returns null/false on errors
 */

/**
 * Object defining all storage keys used in the application
 * Prevents typos and provides autocomplete support
 * Using const object instead of enum for compatibility with erasableSyntaxOnly
 */
export const StorageKey = {
  AUTH_TOKEN: 'impostor_token',
  ROOM_ID: 'impostor_room_id',
  USER_PREFERENCES: 'impostor_preferences',
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

/**
 * Service class for type-safe localStorage operations
 */
export class StorageService {
  private static isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      // Test if storage is actually accessible (can fail in private mode)
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a value from localStorage
   * @param key Storage key from StorageKey enum
   * @returns Parsed value or null if not found/error occurred
   */
  static get<T>(key: StorageKey): T | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return null;
      }

      // Try to parse as JSON, if it fails return as string
      try {
        return JSON.parse(item) as T;
      } catch {
        // If not valid JSON, return as-is (handles plain strings)
        return item as T;
      }
    } catch (error) {
      console.warn(`[StorageService] Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in localStorage
   * @param key Storage key from StorageKey enum
   * @param value Value to store (will be JSON stringified)
   * @returns true if successful, false otherwise
   */
  static set<T>(key: StorageKey, value: T): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.warn(`[StorageService] Failed to set ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove a value from localStorage
   * @param key Storage key from StorageKey enum
   * @returns true if successful, false otherwise
   */
  static remove(key: StorageKey): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[StorageService] Failed to remove ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all values from localStorage
   * @returns true if successful, false otherwise
   */
  static clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.warn('[StorageService] Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key Storage key from StorageKey enum
   * @returns true if key exists, false otherwise
   */
  static has(key: StorageKey): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }
}
