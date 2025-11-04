/**
 * Production-safe logging utility
 * Automatically removes logs in production builds
 * Provides structured logging in development
 */

// Check both Node.js and browser environments
const isDev = 
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Info logging - only in development
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },

  /**
   * Warning - always logged (production too)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Error - always logged (production too)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },

  /**
   * Tool execution logging - only in dev
   */
  tool: (toolName: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[TOOL:${toolName}]`, ...args)
    }
  },

  /**
   * Stream logging - only in dev
   */
  stream: (event: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[STREAM:${event}]`, ...args)
    }
  }
}

