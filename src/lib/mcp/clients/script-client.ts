/**
 * Typed SDK client for the MCP script service.
 *
 * Each exported function is the sole dependency that workers and API handlers
 * should use when they need script-processing capabilities. The implementation
 * is feature-flagged:
 *
 * - When `SCRIPT_MCP_ENABLED=true` and `SCRIPT_MCP_URL` is configured, all
 *   calls are dispatched to the remote script MCP server via JSON-RPC.
 * - Otherwise, the domain service functions are invoked in-process. This is
 *   the default (and safe) production mode during Phase 1.
 *
 * Workers retain full ownership of task lifecycle (progress, heartbeat, SSE).
 * The domain service functions accept a `ScriptServiceCallbacks` object that
 * the worker populates with job-specific implementations.
 */

import type { Job } from 'bullmq'
import type { TaskJobData } from '@/lib/task/types'
import type {
  ScriptTaskContext,
  ScriptServiceCallbacks,
  StoryToScriptResponse,
  AnalyzeNovelResponse,
  EpisodeSplitResponse,
  ScreenplayConvertResponse,
} from '@/lib/mcp/contracts'
import { BaseClient } from '@/lib/mcp/client/base-client'
import { isScriptMcpEnabled, resolveMcpServiceUrl } from '@/lib/mcp/client/registry'
import { createWorkerLLMStreamCallbacks, createWorkerLLMStreamContext } from '@/lib/workers/handlers/llm-stream'
import { reportTaskProgress } from '@/lib/workers/shared'
import { assertTaskActive } from '@/lib/workers/utils'

// ---------------------------------------------------------------------------
// Context / callback helpers
// ---------------------------------------------------------------------------

function buildScriptTaskContext(job: Job<TaskJobData>): ScriptTaskContext {
  return {
    taskId: job.data.taskId,
    locale: job.data.locale,
    projectId: job.data.projectId,
    episodeId: job.data.episodeId ?? null,
    userId: job.data.userId,
    payload: (job.data.payload || {}) as Record<string, unknown>,
  }
}

function buildWorkerCallbacks(job: Job<TaskJobData>, label: string): ScriptServiceCallbacks {
  const streamContext = createWorkerLLMStreamContext(job, label)
  const stream = createWorkerLLMStreamCallbacks(job, streamContext)
  return {
    stream,
    onProgress: async (progress, data) => { await reportTaskProgress(job, progress, data) },
    assertActive: async (checkpoint) => { await assertTaskActive(job, checkpoint) },
  }
}

// ---------------------------------------------------------------------------
// Lazy HTTP client (only instantiated when MCP mode is enabled)
// ---------------------------------------------------------------------------

let _httpClient: BaseClient | null = null

function getHttpClient(): BaseClient {
  if (!_httpClient) {
    const url = resolveMcpServiceUrl('script')
    if (!url) throw new Error('SCRIPT_MCP_URL is not configured')
    _httpClient = new BaseClient({ name: 'script-client', baseUrl: url })
  }
  return _httpClient
}

// ---------------------------------------------------------------------------
// Exported SDK functions
// ---------------------------------------------------------------------------

/**
 * Run the story-to-script pipeline for the given BullMQ job.
 *
 * When `SCRIPT_MCP_ENABLED=true`, the work is dispatched to the remote script
 * server. Otherwise it runs in-process, which is the default behaviour.
 */
export async function runStoryToScript(job: Job<TaskJobData>): Promise<StoryToScriptResponse> {
  if (isScriptMcpEnabled()) {
    const context = buildScriptTaskContext(job)
    return await getHttpClient().invoke<StoryToScriptResponse>('story_to_script', context)
  }
  const context = buildScriptTaskContext(job)
  const callbacks = buildWorkerCallbacks(job, 'story_to_script')
  const { runStoryToScriptService } = await import('@/lib/workers/handlers/story-to-script')
  return await runStoryToScriptService(context, callbacks)
}

/**
 * Run novel asset analysis (characters and locations) for the given BullMQ job.
 */
export async function runAnalyzeNovel(job: Job<TaskJobData>): Promise<AnalyzeNovelResponse> {
  if (isScriptMcpEnabled()) {
    const context = buildScriptTaskContext(job)
    return await getHttpClient().invoke<AnalyzeNovelResponse>('analyze_novel', context)
  }
  const context = buildScriptTaskContext(job)
  const callbacks = buildWorkerCallbacks(job, 'analyze_novel')
  const { runAnalyzeNovelService } = await import('@/lib/workers/handlers/analyze-novel')
  return await runAnalyzeNovelService(context, callbacks)
}

/**
 * Run the episode split pipeline for the given BullMQ job.
 */
export async function runEpisodeSplit(job: Job<TaskJobData>): Promise<EpisodeSplitResponse> {
  if (isScriptMcpEnabled()) {
    const context = buildScriptTaskContext(job)
    return await getHttpClient().invoke<EpisodeSplitResponse>('episode_split', context)
  }
  const context = buildScriptTaskContext(job)
  const callbacks = buildWorkerCallbacks(job, 'episode_split')
  const { runEpisodeSplitService } = await import('@/lib/workers/handlers/episode-split')
  return await runEpisodeSplitService(context, callbacks)
}

/**
 * Run screenplay conversion for the given BullMQ job.
 */
export async function runScreenplayConvert(job: Job<TaskJobData>): Promise<ScreenplayConvertResponse> {
  if (isScriptMcpEnabled()) {
    const context = buildScriptTaskContext(job)
    return await getHttpClient().invoke<ScreenplayConvertResponse>('screenplay_convert', context)
  }
  const context = buildScriptTaskContext(job)
  const callbacks = buildWorkerCallbacks(job, 'screenplay_convert')
  const { runScreenplayConvertService } = await import('@/lib/workers/handlers/screenplay-convert')
  return await runScreenplayConvertService(context, callbacks)
}
