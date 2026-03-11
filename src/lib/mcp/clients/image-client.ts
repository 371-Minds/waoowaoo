/**
 * Typed SDK client for the MCP image service.
 *
 * Each exported function is the sole dependency that workers should use when
 * they need image-generation capabilities.  The implementation is
 * feature-flagged:
 *
 * - When `IMAGE_MCP_ENABLED=true` and `IMAGE_MCP_URL` is configured, all
 *   calls are dispatched to the remote image MCP server via JSON-RPC.
 * - Otherwise, the existing handler functions are invoked in-process. This is
 *   the default (and safe) production mode during Phase 2.
 *
 * Workers retain full ownership of task lifecycle (progress, heartbeat, SSE).
 */

import type { Job } from 'bullmq'
import type { TaskJobData } from '@/lib/task/types'
import type {
  ImageTaskContext,
  GenerateCharacterImageResponse,
  GenerateLocationImageResponse,
  GeneratePanelImageResponse,
  GeneratePanelVariantResponse,
  ModifyAssetImageResponse,
} from '@/lib/mcp/contracts'
import { BaseClient } from '@/lib/mcp/client/base-client'
import { isImageMcpEnabled, resolveMcpServiceUrl } from '@/lib/mcp/client/registry'

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------

function buildImageTaskContext(job: Job<TaskJobData>): ImageTaskContext {
  return {
    taskId: job.data.taskId,
    type: job.data.type,
    locale: job.data.locale,
    projectId: job.data.projectId,
    userId: job.data.userId,
    targetId: job.data.targetId ?? null,
    payload: (job.data.payload || {}) as Record<string, unknown>,
    trace: (job.data.trace as Record<string, unknown> | null | undefined) ?? null,
  }
}

// ---------------------------------------------------------------------------
// Lazy HTTP client (only instantiated when MCP mode is enabled)
// ---------------------------------------------------------------------------

let _httpClient: BaseClient | null = null

function getHttpClient(): BaseClient {
  if (!_httpClient) {
    const url = resolveMcpServiceUrl('image')
    if (!url) throw new Error('IMAGE_MCP_URL is not configured')
    _httpClient = new BaseClient({ name: 'image-client', baseUrl: url })
  }
  return _httpClient
}

// ---------------------------------------------------------------------------
// Exported SDK functions
// ---------------------------------------------------------------------------

/**
 * Generate one or more character images for the given BullMQ job.
 *
 * When `IMAGE_MCP_ENABLED=true`, the work is dispatched to the remote image
 * server.  Otherwise it runs in-process using the existing handler.
 */
export async function runGenerateCharacterImage(
  job: Job<TaskJobData>,
): Promise<GenerateCharacterImageResponse> {
  if (isImageMcpEnabled()) {
    return await getHttpClient().invoke<GenerateCharacterImageResponse>(
      'generate_character_image',
      buildImageTaskContext(job),
    )
  }
  const { handleCharacterImageTask } = await import('@/lib/workers/handlers/character-image-task-handler')
  return await handleCharacterImageTask(job) as GenerateCharacterImageResponse
}

/**
 * Generate location images for the given BullMQ job.
 */
export async function runGenerateLocationImage(
  job: Job<TaskJobData>,
): Promise<GenerateLocationImageResponse> {
  if (isImageMcpEnabled()) {
    return await getHttpClient().invoke<GenerateLocationImageResponse>(
      'generate_location_image',
      buildImageTaskContext(job),
    )
  }
  const { handleLocationImageTask } = await import('@/lib/workers/handlers/location-image-task-handler')
  return await handleLocationImageTask(job) as GenerateLocationImageResponse
}

/**
 * Generate a storyboard panel image for the given BullMQ job.
 */
export async function runGeneratePanelImage(
  job: Job<TaskJobData>,
): Promise<GeneratePanelImageResponse> {
  if (isImageMcpEnabled()) {
    return await getHttpClient().invoke<GeneratePanelImageResponse>(
      'generate_panel_image',
      buildImageTaskContext(job),
    )
  }
  const { handlePanelImageTask } = await import('@/lib/workers/handlers/panel-image-task-handler')
  return await handlePanelImageTask(job) as GeneratePanelImageResponse
}

/**
 * Generate a storyboard panel variant image for the given BullMQ job.
 */
export async function runGeneratePanelVariant(
  job: Job<TaskJobData>,
): Promise<GeneratePanelVariantResponse> {
  if (isImageMcpEnabled()) {
    return await getHttpClient().invoke<GeneratePanelVariantResponse>(
      'generate_panel_variant',
      buildImageTaskContext(job),
    )
  }
  const { handlePanelVariantTask } = await import('@/lib/workers/handlers/panel-variant-task-handler')
  return await handlePanelVariantTask(job) as GeneratePanelVariantResponse
}

/**
 * Apply an AI-driven image modification to a project asset (character
 * appearance, location image, or storyboard panel).
 */
export async function runModifyAssetImage(
  job: Job<TaskJobData>,
): Promise<ModifyAssetImageResponse> {
  if (isImageMcpEnabled()) {
    return await getHttpClient().invoke<ModifyAssetImageResponse>(
      'modify_asset_image',
      buildImageTaskContext(job),
    )
  }
  const { handleModifyAssetImageTask } = await import('@/lib/workers/handlers/image-task-handlers-core')
  return await handleModifyAssetImageTask(job) as ModifyAssetImageResponse
}
