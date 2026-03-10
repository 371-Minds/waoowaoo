/**
 * MCP Script Server — Phase 1 entrypoint.
 *
 * Registers MCP tools for story-to-script processing, novel analysis,
 * episode splitting, and screenplay conversion. Each tool initially delegates
 * to the existing in-repo domain service functions so that the first cutover
 * is low-risk and preserves all current behaviour.
 *
 * Run this server independently with:
 *   tsx --env-file=.env src/mcp/script-server/index.ts
 *
 * Environment variables:
 *   SCRIPT_MCP_PORT     Port to listen on (default: 4001)
 *
 * The server is only useful when `SCRIPT_MCP_ENABLED=true` and
 * `SCRIPT_MCP_URL` points at this process. By default both flags are off so
 * the workers continue to execute domain services in-process.
 */

import { BaseMcpServer } from '@/lib/mcp/server/base-server'
import { logInternal } from '@/lib/logging/semantic'
import type {
  ScriptTaskContext,
  ScriptServiceCallbacks,
  StoryToScriptResponse,
  AnalyzeNovelResponse,
  EpisodeSplitResponse,
  ScreenplayConvertResponse,
} from '@/lib/mcp/contracts'

// ---------------------------------------------------------------------------
// No-op callbacks: used when the server executes domain services in-process
// without an attached worker progress channel.  A real implementation would
// pipe these events back to the caller via SSE.
// ---------------------------------------------------------------------------

function buildNoopCallbacks(): ScriptServiceCallbacks {
  return {
    stream: {
      onStage: () => undefined,
      onChunk: () => undefined,
      onComplete: () => undefined,
      onError: () => undefined,
      flush: async () => undefined,
    },
    onProgress: async () => undefined,
    assertActive: async () => undefined,
  }
}

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

async function createScriptServer(): Promise<BaseMcpServer> {
  const port = Number.parseInt(process.env.SCRIPT_MCP_PORT || '4001', 10) || 4001
  const server = new BaseMcpServer({ name: 'script-server', port, version: '1.0.0' })

  server.registerTool<ScriptTaskContext, StoryToScriptResponse>({
    name: 'story_to_script',
    description: 'Run the story-to-script pipeline: character analysis, location analysis, clip splitting, and screenplay conversion.',
    async handler(context) {
      const { runStoryToScriptService } = await import('@/lib/workers/handlers/story-to-script')
      return await runStoryToScriptService(context, buildNoopCallbacks())
    },
  })

  server.registerTool<ScriptTaskContext, AnalyzeNovelResponse>({
    name: 'analyze_novel',
    description: 'Analyse novel content to extract and persist character profiles and location data.',
    async handler(context) {
      const { runAnalyzeNovelService } = await import('@/lib/workers/handlers/analyze-novel')
      return await runAnalyzeNovelService(context, buildNoopCallbacks())
    },
  })

  server.registerTool<ScriptTaskContext, EpisodeSplitResponse>({
    name: 'episode_split',
    description: 'Use AI to split novel text into discrete episodes with boundary markers.',
    async handler(context) {
      const { runEpisodeSplitService } = await import('@/lib/workers/handlers/episode-split')
      return await runEpisodeSplitService(context, buildNoopCallbacks())
    },
  })

  server.registerTool<ScriptTaskContext, ScreenplayConvertResponse>({
    name: 'screenplay_convert',
    description: 'Convert novel clips into structured screenplay JSON for storyboard generation.',
    async handler(context) {
      const { runScreenplayConvertService } = await import('@/lib/workers/handlers/screenplay-convert')
      return await runScreenplayConvertService(context, buildNoopCallbacks())
    },
  })

  return server
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

createScriptServer()
  .then((server) => server.listen())
  .catch((error) => {
    logInternal('script-server', 'ERROR', 'Failed to start script MCP server', error)
    process.exit(1)
  })
