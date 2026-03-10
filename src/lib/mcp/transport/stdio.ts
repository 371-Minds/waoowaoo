/**
 * stdio transport for local MCP tooling.
 *
 * Reads newline-delimited JSON-RPC requests from stdin and writes responses
 * to stdout.  Useful for CLI tools and local development without a running
 * HTTP server.
 *
 * NOTE: Full stdio integration is a Phase 3+ concern.  This file establishes
 * the contract so callers can depend on it from Phase 1 onwards.
 */

import readline from 'node:readline'
import type { BaseMcpServer } from '../server/base-server'
import { JSON_RPC_ERROR_CODE } from '../contracts'

/** Start processing newline-delimited JSON-RPC messages on stdin/stdout. */
export async function runStdioTransport(server: BaseMcpServer): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, terminal: false })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      const err = {
        jsonrpc: '2.0',
        id: null,
        error: { code: JSON_RPC_ERROR_CODE.PARSE_ERROR, message: 'Parse error' },
      }
      process.stdout.write(JSON.stringify(err) + '\n')
      continue
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await server.dispatch(parsed as any)
    process.stdout.write(JSON.stringify(response) + '\n')
  }
}
