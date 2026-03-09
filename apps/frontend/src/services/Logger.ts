/* eslint-disable no-console */
/**
 * Logger - Structured logging service
 *
 * Provides a centralized logging infrastructure with configurable log levels
 * and namespace support for better debugging and monitoring.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Namespace support for module identification
 * - Environment-aware (debug/info disabled in production)
 * - Structured logging with context objects
 * - Prepares codebase for external logging services (Sentry, LogRocket, etc.)
 *
 * Production Behavior:
 * - debug() and info() are completely disabled (no output)
 * - warn() and error() continue to output to console
 *
 * Usage:
 * ```typescript
 * const logger = new Logger('SocketClient');
 * logger.debug('Connected to server', { socketId: socket.id });
 * logger.info('Room joined', { roomId: 'abc123' });
 * logger.warn('Connection unstable', { retryCount: 3 });
 * logger.error('Failed to authenticate', error, { userId: '123' });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Helper function to convert unknown error to Error type
 */
export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export class Logger {
  private namespace: string;
  private isDevelopment: boolean;

  /**
   * Create a new logger instance
   * @param namespace Module or component name for log identification
   */
  constructor(namespace: string) {
    this.namespace = namespace;
    // Check if running in development mode (Vite sets import.meta.env.DEV)
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Format log message with namespace
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const levelPrefix = level.toUpperCase();
    return `[${timestamp}] [${levelPrefix}] [${this.namespace}] ${message}`;
  }

  /**
   * Format context object for display
   */
  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return '';
    }

    try {
      return `\n${JSON.stringify(context, null, 2)}`;
    } catch {
      // Fallback: try to stringify safely
      try {
        return `\n${JSON.stringify({ context }, null, 2)}`;
      } catch {
        return `\n[Unable to stringify context]`;
      }
    }
  }

  /**
   * Debug level logging - for detailed troubleshooting
   * Disabled in production
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) {
      return; // Silent in production
    }

    const formattedMessage = this.formatMessage('debug', message);
    const formattedContext = this.formatContext(context);

    console.log(formattedMessage + formattedContext);
  }

  /**
   * Info level logging - for general information
   * Disabled in production
   */
  info(message: string, context?: LogContext): void {
    if (!this.isDevelopment) {
      return; // Silent in production
    }

    const formattedMessage = this.formatMessage('info', message);
    const formattedContext = this.formatContext(context);

    console.log(formattedMessage + formattedContext);
  }

  /**
   * Warning level logging - for potentially harmful situations
   * Enabled in all environments
   */
  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('warn', message);
    const formattedContext = this.formatContext(context);

    console.warn(formattedMessage + formattedContext);
  }

  /**
   * Error level logging - for error conditions
   * Enabled in all environments
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const formattedMessage = this.formatMessage('error', message);
    const formattedContext = this.formatContext(context);

    if (error instanceof Error) {
      console.error(formattedMessage, '\n', error, formattedContext);

      // In production, you might want to send to external service here
      // e.g., Sentry.captureException(error, { tags: { namespace: this.namespace }, extra: context });
    } else if (error !== undefined) {
      console.error(formattedMessage, '\n', error, formattedContext);
    } else {
      console.error(formattedMessage + formattedContext);
    }
  }

  /**
   * Group related log messages (development only)
   * Useful for tracking complex operations
   */
  group(label: string): void {
    if (!this.isDevelopment) {
      return;
    }
    console.group(`[${this.namespace}] ${label}`);
  }

  /**
   * End a log group (development only)
   */
  groupEnd(): void {
    if (!this.isDevelopment) {
      return;
    }
    console.groupEnd();
  }
}
