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

// ---------------------------------------------------------------------------
// Image service contracts
// ---------------------------------------------------------------------------

/**
 * Portable task context for image generation tasks.  Carries everything a
 * handler needs without binding it to a BullMQ Job object.
 */
export type ImageTaskContext = {
  taskId: string
  /** Task type constant from TASK_TYPE (e.g. 'image_character'). */
  type: string
  locale: string
  projectId: string
  userId: string
  targetId: string | null
  payload: Record<string, unknown>
  trace?: Record<string, unknown> | null
}

/** Generic result wrapper returned by all image task tools. */
export type ImageGenerationResponse = {
  success: boolean
  /** Handler-specific result fields; shape varies by task type. */
  result: Record<string, unknown>
}

// Typed aliases for the most common image tool responses.

/** Result of a character appearance image generation task. */
export type GenerateCharacterImageResponse = {
  /** Database ID of the updated CharacterAppearance record. */
  appearanceId: string
  /** Total number of image slots written (may be more than 1 for batch generation). */
  imageCount: number
  /** COS key / URL of the primary (selected) image, or null if none was set. */
  imageUrl: string | null
}

/** Result of a location image generation task. */
export type GenerateLocationImageResponse = {
  /** Number of location-image records updated. */
  updated: number
  /** Unique list of location IDs whose images were regenerated. */
  locationIds: string[]
}

/** Result of a storyboard panel image generation task. */
export type GeneratePanelImageResponse = {
  /** Database ID of the updated NovelPromotionPanel record. */
  panelId: string
  /** Number of candidate images generated (1 or more based on the task payload). */
  candidateCount: number
  /** COS key of the primary image when this was the first generation; null for subsequent regenerations (candidates are stored separately). */
  imageUrl: string | null
}

/** Result of a storyboard panel variant generation task. */
export type GeneratePanelVariantResponse = {
  /** Database ID of the new panel record that received the variant image. */
  panelId: string
  /** Storyboard ID the panel belongs to. */
  storyboardId: string
  /** COS key of the generated variant image. */
  imageUrl: string | null
}

/** Result of an AI-driven image modification task (character, location, or storyboard panel). */
export type ModifyAssetImageResponse = {
  /** Asset type that was modified: 'character' | 'location' | 'storyboard'. */
  type: string
  /** COS key of the modified image. */
  imageUrl: string
  /** Set when type is 'character'; database ID of the updated CharacterAppearance record. */
  appearanceId?: string
  /** Set when type is 'location'; database ID of the updated LocationImage record. */
  locationImageId?: string
  /** Set when type is 'storyboard'; database ID of the updated NovelPromotionPanel record. */
  panelId?: string
}

// ---------------------------------------------------------------------------
// Asset service contracts
// ---------------------------------------------------------------------------

/**
 * Portable context for asset-hub image generation and modification tasks.
 */
export type AssetTaskContext = {
  taskId: string
  /** Task type constant from TASK_TYPE (e.g. 'asset_hub_image'). */
  type: string
  locale: string
  userId: string
  projectId: string
  targetId: string | null
  payload: Record<string, unknown>
  trace?: Record<string, unknown> | null
}

export type AssetHubImageResponse = {
  type: string
  appearanceId?: string
  locationId?: string
  imageCount: number
}

export type AssetHubModifyResponse = {
  type: string
  imageUrl: string
  appearanceId?: string
  locationImageId?: string
}
