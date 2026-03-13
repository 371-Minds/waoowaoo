/**
 * Typed SDK client for the MCP asset service.
 *
 * Each exported function is the sole dependency that workers and asset-hub API
 * routes should use when they need asset-hub image generation or modification.
 * The implementation is feature-flagged:
 *
 * - When `ASSET_MCP_ENABLED=true` and `ASSET_MCP_URL` is configured, all
 *   calls are dispatched to the remote asset MCP server via JSON-RPC.
 * - Otherwise, the existing handler functions are invoked in-process.  This
 *   is the default (and safe) production mode during Phase 2.
 *
 * Workers retain full ownership of task lifecycle (progress, heartbeat, SSE).
 */

import type { Job } from 'bullmq'
import type { TaskJobData } from '@/lib/task/types'
import type {
  AssetTaskContext,
  AssetHubImageResponse,
  AssetHubModifyResponse,
} from '@/lib/mcp/contracts'
import { BaseClient } from '@/lib/mcp/client/base-client'
import { isAssetMcpEnabled, resolveMcpServiceUrl } from '@/lib/mcp/client/registry'

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------

function buildAssetTaskContext(job: Job<TaskJobData>): AssetTaskContext {
  return {
    taskId: job.data.taskId,
    type: job.data.type,
    locale: job.data.locale,
    userId: job.data.userId,
    projectId: job.data.projectId,
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
    const url = resolveMcpServiceUrl('asset')
    if (!url) throw new Error('ASSET_MCP_URL is not configured')
    _httpClient = new BaseClient({ name: 'asset-client', baseUrl: url })
  }
  return _httpClient
}

// ---------------------------------------------------------------------------
// Exported SDK functions
// ---------------------------------------------------------------------------

/**
 * Generate asset-hub character or location images for the given BullMQ job.
 *
 * When `ASSET_MCP_ENABLED=true`, the work is dispatched to the remote asset
 * server.  Otherwise it runs in-process using the existing handler.
 */
export async function runAssetHubImage(job: Job<TaskJobData>): Promise<AssetHubImageResponse> {
  if (isAssetMcpEnabled()) {
    return await getHttpClient().invoke<AssetHubImageResponse>(
      'asset_hub_image',
      buildAssetTaskContext(job),
    )
  }
  const { handleAssetHubImageTask } = await import('@/lib/workers/handlers/asset-hub-image-task-handler')
  return await handleAssetHubImageTask(job) as AssetHubImageResponse
}

/**
 * Apply an AI-driven modification to an asset-hub character or location image.
 */
export async function runAssetHubModify(job: Job<TaskJobData>): Promise<AssetHubModifyResponse> {
  if (isAssetMcpEnabled()) {
    return await getHttpClient().invoke<AssetHubModifyResponse>(
      'asset_hub_modify',
      buildAssetTaskContext(job),
    )
  }
  const { handleAssetHubModifyTask } = await import('@/lib/workers/handlers/asset-hub-modify-task-handler')
  return await handleAssetHubModifyTask(job) as AssetHubModifyResponse
}
