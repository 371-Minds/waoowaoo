/**
 * Shared JSON-RPC / MCP request, response, error, and health-check types.
 *
 * These types form the transport boundary between MCP service servers and the
 * typed SDK clients that workers and API routes use.  Domain modules should
 * never depend on this file directly; instead they receive plain typed inputs
 * and return typed outputs.  Only the server and client layers talk to these
 * contracts.
 */

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 envelope types
// ---------------------------------------------------------------------------

export type JsonRpcRequest<T = unknown> = {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: T
}

export type JsonRpcSuccessResponse<T = unknown> = {
  jsonrpc: '2.0'
  id: string | number
  result: T
}

export type JsonRpcErrorResponse = {
  jsonrpc: '2.0'
  id: string | number | null
  error: {
    code: number
    message: string
    data?: unknown
  }
}

export type JsonRpcResponse<T = unknown> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse

export function isJsonRpcError(response: JsonRpcResponse): response is JsonRpcErrorResponse {
  return 'error' in response
}

// ---------------------------------------------------------------------------
// Standard JSON-RPC error codes
// ---------------------------------------------------------------------------

export const JSON_RPC_ERROR_CODE = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  /** Domain-level errors use the range -32000 to -32099. */
  SERVER_ERROR: -32000,
  /** The task was cancelled or terminated externally. */
  TASK_TERMINATED: -32001,
  /** The underlying domain resource was not found. */
  NOT_FOUND: -32002,
  /** The service is not yet available (feature flag disabled). */
  UNAVAILABLE: -32003,
} as const

// ---------------------------------------------------------------------------
// MCP tool definition
// ---------------------------------------------------------------------------

export type McpToolDefinition<TInput = unknown, TOutput = unknown> = {
  name: string
  description: string
  handler: (input: TInput) => Promise<TOutput>
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export type McpHealthStatus = {
  status: 'ok' | 'degraded' | 'down'
  service: string
  version?: string
  uptime?: number
  timestamp: string
}

// ---------------------------------------------------------------------------
// Script service contracts
// ---------------------------------------------------------------------------

/**
 * Portable task context extracted from the BullMQ job.  This is what travels
 * across the service boundary (either in-process or over JSON-RPC).
 */
export type ScriptTaskContext = {
  taskId: string
  locale: string
  projectId: string
  episodeId?: string | null
  userId: string
  payload: Record<string, unknown>
}

/** Callbacks passed to domain service functions so they can report progress
 *  and stream AI output without importing worker-specific code. */
export type ScriptServiceCallbacks = {
  /** LLM stream callbacks (progress stage, chunk, complete, error) + flush. */
  stream: {
    onStage?: (stage: {
      stage: 'submit' | 'streaming' | 'fallback' | 'completed'
      provider?: string | null
      step?: {
        id?: string | null
        attempt?: number | null
        title?: string | null
        index?: number | null
        total?: number | null
      }
    }) => void
    onChunk?: (chunk: {
      kind: string
      delta: string
      seq: number
      lane?: string | null
      step?: {
        id?: string | null
        attempt?: number | null
        title?: string | null
        index?: number | null
        total?: number | null
      }
    }) => void
    onComplete?: (text: string, step?: {
      id?: string | null
      attempt?: number | null
      title?: string | null
      index?: number | null
      total?: number | null
    }) => void
    onError?: (error: unknown, step?: {
      id?: string | null
      attempt?: number | null
      title?: string | null
      index?: number | null
      total?: number | null
    }) => void
    flush: () => Promise<void>
  }
  /** Report progress to the calling worker / caller. */
  onProgress: (progress: number, data: Record<string, unknown>) => Promise<void>
  /** Assert the task is still active; throw TaskTerminatedError if not. */
  assertActive: (checkpoint: string) => Promise<void>
}

// ---------------------------------------------------------------------------
// Script tool request / response types
// ---------------------------------------------------------------------------

export type StoryToScriptRequest = ScriptTaskContext

export type StoryToScriptResponse = {
  episodeId: string
  clipCount: number
  screenplaySuccessCount: number
  screenplayFailedCount: number
  persistedCharacters: number
  persistedLocations: number
  persistedClips: number
  retryStepKey?: string
}

export type AnalyzeNovelRequest = ScriptTaskContext

export type AnalyzeNovelResponse = {
  success: boolean
  characters: Array<{ id: string }>
  locations: Array<{ id: string }>
  characterCount: number
  locationCount: number
}

export type EpisodeSplitRequest = ScriptTaskContext

export type EpisodeSplitResponse = {
  success: boolean
  episodes: Array<{
    number: number
    title: string
    summary: string
    content: string
    wordCount: number
  }>
}

export type ScreenplayConvertRequest = ScriptTaskContext

export type ScreenplayConvertResponse = {
  episodeId: string
  total: number
  successCount: number
  failCount: number
  totalScenes: number
  results: Array<{
    clipId: string
    success: boolean
    sceneCount?: number
    error?: string
  }>
}
