/**
 * Common MCP server bootstrap: tool registration, request dispatch,
 * health-check handler, and graceful shutdown hooks.
 *
 * Each domain MCP server (script-server, image-server, etc.) creates an
 * instance of BaseMcpServer, registers its tools, then calls `listen()`.
 */

import http from 'node:http'
import type { McpToolDefinition, McpHealthStatus, JsonRpcRequest, JsonRpcResponse } from '../contracts'
import { JSON_RPC_ERROR_CODE } from '../contracts'
import { serializeError } from '../errors'
import { logInternal } from '@/lib/logging/semantic'

type ServerOptions = {
  /** Service name for health check and logging. */
  name: string
  /** TCP port to listen on. */
  port: number
  /** Optional service version string. */
  version?: string
}

// ---------------------------------------------------------------------------
// BaseMcpServer
// ---------------------------------------------------------------------------

export class BaseMcpServer {
  private readonly options: ServerOptions
  private readonly tools = new Map<string, McpToolDefinition>()
  private server: http.Server | null = null
  private readonly startedAt = Date.now()

  constructor(options: ServerOptions) {
    this.options = options
  }

  // -------------------------------------------------------------------------
  // Tool registration
  // -------------------------------------------------------------------------

  registerTool<TInput, TOutput>(tool: McpToolDefinition<TInput, TOutput>): this {
    this.tools.set(tool.name, tool as McpToolDefinition)
    return this
  }

  // -------------------------------------------------------------------------
  // Request dispatch
  // -------------------------------------------------------------------------

  async dispatch(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request

    if (method === 'health') {
      return { jsonrpc: '2.0', id, result: this.buildHealthStatus() }
    }

    const tool = this.tools.get(method)
    if (!tool) {
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: {
          code: JSON_RPC_ERROR_CODE.METHOD_NOT_FOUND,
          message: `Method not found: ${method}`,
        },
      }
    }

    try {
      const result = await tool.handler(params)
      return { jsonrpc: '2.0', id, result }
    } catch (error) {
      logInternal(this.options.name, 'ERROR', `Tool ${method} failed`, error)
      return { jsonrpc: '2.0', id: id ?? null, error: serializeError(error) }
    }
  }

  // -------------------------------------------------------------------------
  // HTTP listener
  // -------------------------------------------------------------------------

  listen(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        if (req.method === 'GET' && req.url === '/health') {
          const status = this.buildHealthStatus()
          res.writeHead(status.status === 'ok' ? 200 : 503, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(status))
          return
        }

        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          let parsed: JsonRpcRequest
          try {
            parsed = JSON.parse(body)
          } catch {
            const errResponse: JsonRpcResponse = {
              jsonrpc: '2.0',
              id: null,
              error: { code: JSON_RPC_ERROR_CODE.PARSE_ERROR, message: 'Parse error' },
            }
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(errResponse))
            return
          }

          const response = await this.dispatch(parsed)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(response))
        })
      })

      this.server.listen(this.options.port, () => {
        logInternal(this.options.name, 'INFO', `MCP server listening on port ${this.options.port}`)
        resolve()
      })

      this.registerShutdownHooks()
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve()
        return
      }
      this.server.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  // -------------------------------------------------------------------------
  // Health
  // -------------------------------------------------------------------------

  private buildHealthStatus(): McpHealthStatus {
    return {
      status: 'ok',
      service: this.options.name,
      version: this.options.version,
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    }
  }

  // -------------------------------------------------------------------------
  // Shutdown hooks
  // -------------------------------------------------------------------------

  private registerShutdownHooks() {
    const shutdown = async (signal: string) => {
      logInternal(this.options.name, 'INFO', `Received ${signal}, shutting down…`)
      await this.stop()
      process.exit(0)
    }
    process.once('SIGTERM', () => void shutdown('SIGTERM'))
    process.once('SIGINT', () => void shutdown('SIGINT'))
  }
}
