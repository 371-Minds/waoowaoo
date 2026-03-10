/**
 * SSE (Server-Sent Events) transport for MCP services.
 *
 * This module provides helpers for emitting MCP progress events over an SSE
 * connection.  Domain servers can use `SseWriter` to push structured events
 * to connected clients without coupling their core logic to HTTP.
 *
 * NOTE: Full streaming integration is a Phase 3+ concern.  This file
 * establishes the contract so callers can program against it from Phase 1
 * onwards.
 */

export type SseEvent = {
  event?: string
  data: string
  id?: string
}

/** Minimal interface for writing SSE events; implementors can wrap an HTTP
 *  response stream or any other duplex sink. */
export interface SseWriter {
  write(event: SseEvent): void
  close(): void
}

/** Create a no-op SseWriter useful for local/in-process execution where
 *  SSE streaming is not required. */
export function createNoopSseWriter(): SseWriter {
  return {
    write: () => undefined,
    close: () => undefined,
  }
}

/** Format an event object as an SSE-compliant string. */
export function formatSseEvent(event: SseEvent): string {
  const parts: string[] = []
  if (event.id) parts.push(`id: ${event.id}`)
  if (event.event) parts.push(`event: ${event.event}`)
  parts.push(`data: ${event.data}`)
  parts.push('', '')
  return parts.join('\n')
}
