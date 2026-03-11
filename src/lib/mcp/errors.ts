/**
 * Typed transport / domain error mapping for MCP service boundaries.
 *
 * All errors that cross a service boundary should be wrapped or mapped here so
 * that callers receive consistent, typed error information regardless of whether
 * the service runs in-process or over HTTP/JSON-RPC.
 */

import { JSON_RPC_ERROR_CODE } from './contracts'

// ---------------------------------------------------------------------------
// Base error class
// ---------------------------------------------------------------------------

export class McpError extends Error {
  readonly code: number
  readonly data?: unknown

  constructor(message: string, code: number, data?: unknown) {
    super(message)
    this.name = 'McpError'
    this.code = code
    this.data = data
  }
}

// ---------------------------------------------------------------------------
// Typed error subtypes
// ---------------------------------------------------------------------------

export class McpInvalidParamsError extends McpError {
  constructor(message: string, data?: unknown) {
    super(message, JSON_RPC_ERROR_CODE.INVALID_PARAMS, data)
    this.name = 'McpInvalidParamsError'
  }
}

export class McpNotFoundError extends McpError {
  constructor(message: string, data?: unknown) {
    super(message, JSON_RPC_ERROR_CODE.NOT_FOUND, data)
    this.name = 'McpNotFoundError'
  }
}

export class McpUnavailableError extends McpError {
  constructor(message: string, data?: unknown) {
    super(message, JSON_RPC_ERROR_CODE.UNAVAILABLE, data)
    this.name = 'McpUnavailableError'
  }
}

export class McpInternalError extends McpError {
  constructor(message: string, data?: unknown) {
    super(message, JSON_RPC_ERROR_CODE.INTERNAL_ERROR, data)
    this.name = 'McpInternalError'
  }
}

// ---------------------------------------------------------------------------
// Error mapping helpers
// ---------------------------------------------------------------------------

/** Convert any thrown value into a structured McpError. */
export function toMcpError(error: unknown): McpError {
  if (error instanceof McpError) return error
  const message = error instanceof Error ? error.message : String(error)
  return new McpInternalError(message, error instanceof Error ? { stack: error.stack } : undefined)
}

/** Extract a serialisable error payload suitable for a JSON-RPC error response. */
export function serializeError(error: unknown): { code: number; message: string; data?: unknown } {
  const mcpError = toMcpError(error)
  return {
    code: mcpError.code,
    message: mcpError.message,
    data: mcpError.data,
  }
}
