/**
 * MCP Image Server — Phase 2 entrypoint.
 *
 * Registers MCP tools for all image generation and modification tasks: panel
 * image generation, character image generation, location image generation,
 * panel variant generation, and asset-image modification.
 *
 * Each tool initially delegates to the existing in-repo handler functions so
 * that the first cutover is low-risk and preserves all current behaviour.
 *
 * Run this server independently with:
 *   tsx --env-file=.env src/mcp/image-server/index.ts
 *
 * Environment variables:
 *   IMAGE_MCP_PORT     Port to listen on (default: 4002)
 *
 * The server is only useful when `IMAGE_MCP_ENABLED=true` and
 * `IMAGE_MCP_URL` points at this process.  By default both flags are off so
 * the workers continue to execute handlers in-process.
 */

import type { Job } from 'bullmq'
import type { TaskType, TaskJobData } from '@/lib/task/types'
import { BaseMcpServer } from '@/lib/mcp/server/base-server'
import { logInternal } from '@/lib/logging/semantic'
import type {
  ImageTaskContext,
  GenerateCharacterImageResponse,
  GenerateLocationImageResponse,
  GeneratePanelImageResponse,
  GeneratePanelVariantResponse,
  ModifyAssetImageResponse,
} from '@/lib/mcp/contracts'

// ---------------------------------------------------------------------------
// Mock Job builder
//
// Image handlers are currently coupled to the BullMQ Job interface. Until a
// full service-extraction refactor is done (extracting handlers into
// (context, callbacks) functions as Phase 1 did for script handlers), the
// server constructs a minimal mock Job that satisfies the handler requirements.
//
// The mock provides:
//   - job.data   — populated from the incoming ImageTaskContext
//   - job.id     — derived from taskId (used only for logging)
//
// Progress reporting and assertTaskActive both read only from job.data, so
// they work correctly with this mock during remote execution.
// ---------------------------------------------------------------------------

function buildMockJob(context: ImageTaskContext): Job<TaskJobData> {
  return {
    id: `mcp-${context.taskId}`,
    data: {
      taskId: context.taskId,
      type: context.type as TaskType,
      locale: context.locale as TaskJobData['locale'],
      projectId: context.projectId,
      userId: context.userId,
      // targetType is part of the TaskJobData schema but is only used by
      // billing and route-guard logic that does not run inside image handlers.
      // Populated as an empty string here; if a specific handler ever starts
      // reading this field, pass it through ImageTaskContext instead.
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

async function createImageServer(): Promise<BaseMcpServer> {
  const port = Number.parseInt(process.env.IMAGE_MCP_PORT || '4002', 10) || 4002
  const server = new BaseMcpServer({ name: 'image-server', port, version: '1.0.0' })

  server.registerTool<ImageTaskContext, GenerateCharacterImageResponse>({
    name: 'generate_character_image',
    description: 'Generate one or more character appearance images for a novel project.',
    async handler(context) {
      const { handleCharacterImageTask } = await import('@/lib/workers/handlers/character-image-task-handler')
      return await handleCharacterImageTask(buildMockJob(context)) as GenerateCharacterImageResponse
    },
  })

  server.registerTool<ImageTaskContext, GenerateLocationImageResponse>({
    name: 'generate_location_image',
    description: 'Generate location images for one or more location records in a novel project.',
    async handler(context) {
      const { handleLocationImageTask } = await import('@/lib/workers/handlers/location-image-task-handler')
      return await handleLocationImageTask(buildMockJob(context)) as GenerateLocationImageResponse
    },
  })

  server.registerTool<ImageTaskContext, GeneratePanelImageResponse>({
    name: 'generate_panel_image',
    description: 'Generate a storyboard panel image, including optional candidate generation.',
    async handler(context) {
      const { handlePanelImageTask } = await import('@/lib/workers/handlers/panel-image-task-handler')
      return await handlePanelImageTask(buildMockJob(context)) as GeneratePanelImageResponse
    },
  })

  server.registerTool<ImageTaskContext, GeneratePanelVariantResponse>({
    name: 'generate_panel_variant',
    description: 'Generate a variant image for an existing storyboard panel.',
    async handler(context) {
      const { handlePanelVariantTask } = await import('@/lib/workers/handlers/panel-variant-task-handler')
      return await handlePanelVariantTask(buildMockJob(context)) as GeneratePanelVariantResponse
    },
  })

  server.registerTool<ImageTaskContext, ModifyAssetImageResponse>({
    name: 'modify_asset_image',
    description: 'Apply an AI-driven image modification to a character appearance, location image, or storyboard panel.',
    async handler(context) {
      const { handleModifyAssetImageTask } = await import('@/lib/workers/handlers/image-task-handlers-core')
      return await handleModifyAssetImageTask(buildMockJob(context)) as ModifyAssetImageResponse
    },
  })

  return server
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

createImageServer()
  .then((server) => server.listen())
  .catch((error) => {
    logInternal('image-server', 'ERROR', 'Failed to start image MCP server', error)
    process.exit(1)
  })
