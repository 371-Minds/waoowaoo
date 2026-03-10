import type { Job } from 'bullmq'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

const prismaMock = vi.hoisted(() => ({
  project: { findUnique: vi.fn() },
  novelPromotionProject: { findUnique: vi.fn() },
  novelPromotionEpisode: { findUnique: vi.fn() },
  novelPromotionClip: { update: vi.fn(async () => ({})) },
}))

const llmMock = vi.hoisted(() => ({
  chatCompletion: vi.fn(async () => ({ id: 'completion-1' })),
  getCompletionContent: vi.fn(() => '{"scenes":[{"index":1}]}'),
}))

const workerMock = vi.hoisted(() => ({
  reportTaskProgress: vi.fn(async () => undefined),
  assertTaskActive: vi.fn(async () => undefined),
}))

const helpersMock = vi.hoisted(() => ({
  parseScreenplayPayload: vi.fn(() => ({ scenes: [{ index: 1 }] })),
}))

/** Tracks calls made to the script-client SDK functions. */
const scriptClientMock = vi.hoisted(() => ({
  runScreenplayConvert: vi.fn(async () => ({
    episodeId: 'episode-1',
    total: 1,
    successCount: 1,
    failCount: 0,
    totalScenes: 1,
    results: [{ clipId: 'clip-1', success: true, sceneCount: 1 }],
  })),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/llm-client', () => llmMock)
vi.mock('@/lib/llm-observe/internal-stream-context', () => ({
  withInternalLLMStreamCallbacks: vi.fn(async (_callbacks: unknown, fn: () => Promise<unknown>) => await fn()),
}))
vi.mock('@/lib/constants', () => ({
  buildCharactersIntroduction: vi.fn(() => 'characters introduction'),
}))
vi.mock('@/lib/workers/shared', () => ({ reportTaskProgress: workerMock.reportTaskProgress }))
vi.mock('@/lib/workers/utils', () => ({ assertTaskActive: workerMock.assertTaskActive }))
vi.mock('@/lib/logging/semantic', () => ({ logAIAnalysis: vi.fn() }))
vi.mock('@/lib/logging/file-writer', () => ({ onProjectNameAvailable: vi.fn() }))
vi.mock('@/lib/workers/handlers/llm-stream', () => ({
  createWorkerLLMStreamContext: vi.fn(() => ({ streamRunId: 'run-1', nextSeqByStepLane: {} })),
  createWorkerLLMStreamCallbacks: vi.fn(() => ({
    onStage: vi.fn(),
    onChunk: vi.fn(),
    onComplete: vi.fn(),
    onError: vi.fn(),
    flush: vi.fn(async () => undefined),
  })),
}))
vi.mock('@/lib/workers/handlers/screenplay-convert-helpers', () => ({
  readText: (value: unknown) => (typeof value === 'string' ? value : ''),
  parseScreenplayPayload: helpersMock.parseScreenplayPayload,
}))
vi.mock('@/lib/prompt-i18n', () => ({
  PROMPT_IDS: { NP_SCREENPLAY_CONVERSION: 'np_screenplay_conversion' },
  getPromptTemplate: vi.fn(() => 'screenplay-template-{clip_content}-{clip_id}'),
}))
vi.mock('@/lib/mcp/clients/script-client', () => scriptClientMock)

import { handleScreenplayConvertTask, runScreenplayConvertService } from '@/lib/workers/handlers/screenplay-convert'

function buildJob(payload: Record<string, unknown>, episodeId: string | null = 'episode-1'): Job<TaskJobData> {
  return {
    data: {
      taskId: 'task-screenplay-1',
      type: TASK_TYPE.SCREENPLAY_CONVERT,
      locale: 'zh',
      projectId: 'project-1',
      episodeId,
      targetType: 'NovelPromotionEpisode',
      targetId: 'episode-1',
      payload,
      userId: 'user-1',
    },
  } as unknown as Job<TaskJobData>
}

function buildContext(payload: Record<string, unknown>, episodeId: string | null = 'episode-1') {
  return {
    taskId: 'task-screenplay-1',
    locale: 'zh' as const,
    projectId: 'project-1',
    episodeId,
    userId: 'user-1',
    payload,
  }
}

function buildTestCallbacks() {
  return {
    stream: {
      onStage: vi.fn(),
      onChunk: vi.fn(),
      onComplete: vi.fn(),
      onError: vi.fn(),
      flush: vi.fn(async () => undefined),
    },
    onProgress: vi.fn(async () => undefined),
    assertActive: vi.fn(async () => undefined),
  }
}

// ---------------------------------------------------------------------------
// Routing test: verify the worker handler delegates to the script SDK client
// ---------------------------------------------------------------------------

describe('worker screenplay-convert routing → script-client SDK', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handleScreenplayConvertTask delegates to scriptClient.runScreenplayConvert', async () => {
    const job = buildJob({ episodeId: 'episode-1' })
    const result = await handleScreenplayConvertTask(job)

    expect(scriptClientMock.runScreenplayConvert).toHaveBeenCalledWith(job)
    expect(result).toEqual(expect.objectContaining({ episodeId: 'episode-1', successCount: 1 }))
  })
})

// ---------------------------------------------------------------------------
// Domain behavior tests: verify the service function behavior end-to-end
// ---------------------------------------------------------------------------

describe('worker screenplay-convert behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Project One',
      mode: 'novel-promotion',
    })

    prismaMock.novelPromotionProject.findUnique.mockResolvedValue({
      id: 'np-project-1',
      analysisModel: 'llm::analysis-1',
      characters: [{ name: 'Hero' }],
      locations: [{ name: 'Old Town' }],
    })

    prismaMock.novelPromotionEpisode.findUnique.mockResolvedValue({
      id: 'episode-1',
      novelPromotionProjectId: 'np-project-1',
      clips: [
        {
          id: 'clip-1',
          content: 'clip 1 content',
        },
      ],
    })
  })

  it('missing episodeId -> explicit error', async () => {
    const context = buildContext({}, null)
    const callbacks = buildTestCallbacks()
    await expect(runScreenplayConvertService(context, callbacks)).rejects.toThrow('episodeId is required')
  })

  it('success path -> writes screenplay json to clip row', async () => {
    const context = buildContext({ episodeId: 'episode-1' })
    const callbacks = buildTestCallbacks()
    const result = await runScreenplayConvertService(context, callbacks)

    expect(result).toEqual(expect.objectContaining({
      episodeId: 'episode-1',
      total: 1,
      successCount: 1,
      failCount: 0,
      totalScenes: 1,
    }))

    expect(prismaMock.novelPromotionClip.update).toHaveBeenCalledWith({
      where: { id: 'clip-1' },
      data: {
        screenplay: JSON.stringify({
          scenes: [{ index: 1 }],
          clip_id: 'clip-1',
          original_text: 'clip 1 content',
        }),
      },
    })
  })

  it('clip parse failed -> throws partial failure error with code prefix', async () => {
    helpersMock.parseScreenplayPayload.mockImplementation(() => {
      throw new Error('invalid screenplay payload')
    })

    const context = buildContext({ episodeId: 'episode-1' })
    const callbacks = buildTestCallbacks()
    await expect(runScreenplayConvertService(context, callbacks)).rejects.toThrow('SCREENPLAY_CONVERT_PARTIAL_FAILED')
  })
})
