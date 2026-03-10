/**
 * Retrying typed client wrapper for MCP JSON-RPC services.
 *
 * Callers use `BaseClient.invoke()` to send a JSON-RPC request to a remote
 * MCP server.  A simple exponential back-off retry policy is applied to
 * transient network errors; domain errors (JSON-RPC error responses) are
 * surfaced immediately as `McpError` instances.
 */

import type { JsonRpcRequest, JsonRpcResponse } from '../contracts'
import { JSON_RPC_ERROR_CODE, isJsonRpcError } from '../contracts'
import { McpError, McpInternalError } from '../errors'
import { logInternal } from '@/lib/logging/semantic'

export type BaseClientOptions = {
  /** Service name used in log messages. */
  name: string
  /** Base URL of the MCP server (e.g. http://localhost:4001). */
  baseUrl: string
  /** Maximum number of attempts for transient errors. Defaults to 3. */
  maxRetries?: number
  /** Initial retry delay in ms. Defaults to 200. */
  retryDelayMs?: number
}

// ---------------------------------------------------------------------------
// BaseClient
// ---------------------------------------------------------------------------

export class BaseClient {
  private readonly options: Required<BaseClientOptions>
  private reqCounter = 0

  constructor(options: BaseClientOptions) {
    this.options = {
      name: options.name,
      baseUrl: options.baseUrl.replace(/\/$/, ''),
      maxRetries: options.maxRetries ?? 3,
      retryDelayMs: options.retryDelayMs ?? 200,
    }
  }

  // -------------------------------------------------------------------------
  // Typed invocation
  // -------------------------------------------------------------------------

  async invoke<TResult>(method: string, params?: unknown): Promise<TResult> {
    const id = ++this.reqCounter
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      ...(params !== undefined ? { params } : {}),
    }

    let lastError: unknown
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const response = await this.sendRequest(request)
        if (isJsonRpcError(response)) {
          const { code, message, data } = response.error
          // Do not retry domain errors.
          throw new McpError(message, code, data)
        }
        return response.result as TResult
      } catch (error) {
        lastError = error
        // Propagate domain errors immediately.
        if (error instanceof McpError) throw error
        if (attempt < this.options.maxRetries) {
          const delay = this.options.retryDelayMs * 2 ** (attempt - 1)
          logInternal(
            this.options.name,
            'WARN',
            `Transient error on attempt ${attempt}/${this.options.maxRetries}, retrying in ${delay}ms`,
            error,
          )
          await sleep(delay)
        }
      }
    }
    throw new McpInternalError(
      `Request to ${this.options.name}/${method} failed after ${this.options.maxRetries} attempts`,
      lastError,
    )
  }

  // -------------------------------------------------------------------------
  // Internal HTTP dispatch
  // -------------------------------------------------------------------------

  private async sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const url = `${this.options.baseUrl}/`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok && res.status !== 200) {
      throw new Error(`HTTP ${res.status} from ${url}`)
    }
    return (await res.json()) as JsonRpcResponse
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
