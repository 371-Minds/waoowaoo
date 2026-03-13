/**
 * MCP Asset Server — Phase 2 entrypoint.
 *
 * Registers MCP tools for asset-hub image generation and modification tasks:
 * global-character image generation, global-location image generation, and
 * their corresponding AI-driven modification flows.
 *
 * Each tool initially delegates to the existing in-repo handler functions so
 * that the first cutover is low-risk and preserves all current behaviour.
 *
 * Run this server independently with:
 *   tsx --env-file=.env src/mcp/asset-server/index.ts
 *
 * Environment variables:
 *   ASSET_MCP_PORT     Port to listen on (default: 4003)
 *
 * The server is only useful when `ASSET_MCP_ENABLED=true` and
 * `ASSET_MCP_URL` points at this process.  By default both flags are off so
 * the workers continue to execute handlers in-process.
 */

import type { Job } from 'bullmq'
import type { TaskType, TaskJobData } from '@/lib/task/types'
import { BaseMcpServer } from '@/lib/mcp/server/base-server'
import { logInternal } from '@/lib/logging/semantic'
import type {
  AssetTaskContext,
  AssetHubImageResponse,
  AssetHubModifyResponse,
} from '@/lib/mcp/contracts'

// ---------------------------------------------------------------------------
// Mock Job builder
//
// Asset-hub handlers are currently coupled to the BullMQ Job interface.
// Until the handlers are extracted into (context, callbacks) service functions
// the server constructs a minimal mock Job that satisfies the handler
// requirements.  The mock provides job.data and job.id; progress reporting and
// assertTaskActive read only from job.data so they work correctly here.
// ---------------------------------------------------------------------------

function buildMockJob(context: AssetTaskContext): Job<TaskJobData> {
  return {
    id: `mcp-${context.taskId}`,
    data: {
      taskId: context.taskId,
      type: context.type as TaskType,
      locale: context.locale as TaskJobData['locale'],
      projectId: context.projectId,
      userId: context.userId,
      // targetType is part of the TaskJobData schema but is only used by
      // billing and route-guard logic that does not run inside asset handlers.
      // Populated as an empty string here; if a specific handler ever starts
      // reading this field, pass it through AssetTaskContext instead.
      targetType: '',
      targetId: context.targetId ?? '',
      payload: context.payload,
      trace: (context.trace as TaskJobData['trace']) ?? null,
    },
  } as unknown as Job<TaskJobData>
}

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

async function createAssetServer(): Promise<BaseMcpServer> {
  const port = Number.parseInt(process.env.ASSET_MCP_PORT || '4003', 10) || 4003
  const server = new BaseMcpServer({ name: 'asset-server', port, version: '1.0.0' })

  server.registerTool<AssetTaskContext, AssetHubImageResponse>({
    name: 'asset_hub_image',
    description: 'Generate images for a global-character or global-location asset in the asset hub.',
    async handler(context) {
      const { handleAssetHubImageTask } = await import('@/lib/workers/handlers/asset-hub-image-task-handler')
      return await handleAssetHubImageTask(buildMockJob(context)) as AssetHubImageResponse
    },
  })

  server.registerTool<AssetTaskContext, AssetHubModifyResponse>({
    name: 'asset_hub_modify',
    description: 'Apply an AI-driven modification to a global-character or global-location asset image.',
    async handler(context) {
      const { handleAssetHubModifyTask } = await import('@/lib/workers/handlers/asset-hub-modify-task-handler')
      return await handleAssetHubModifyTask(buildMockJob(context)) as AssetHubModifyResponse
    },
  })

  return server
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

createAssetServer()
  .then((server) => server.listen())
  .catch((error) => {
    logInternal('asset-server', 'ERROR', 'Failed to start asset MCP server', error)
    process.exit(1)
  })
