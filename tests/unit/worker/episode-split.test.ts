import type { Job } from 'bullmq'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

const prismaMock = vi.hoisted(() => ({
  project: {
    findUnique: vi.fn(async () => ({ id: 'project-1', mode: 'novel-promotion' })),
  },
  novelPromotionProject: {
    findFirst: vi.fn(async () => ({ id: 'np-project-1' })),
  },
}))

const llmClientMock = vi.hoisted(() => ({
  chatCompletion: vi.fn(async () => ({ id: 'completion-1' })),
  getCompletionContent: vi.fn(() => JSON.stringify({
    episodes: [
      {
        number: 1,
        title: '第一集',
        summary: '开端',
        startMarker: 'START_MARKER',
        endMarker: 'END_MARKER',
      },
    ],
  })),
}))

const configServiceMock = vi.hoisted(() => ({
  getUserModelConfig: vi.fn(async () => ({
    analysisModel: 'llm::analysis-model',
  })),
}))

const internalStreamMock = vi.hoisted(() => ({
  withInternalLLMStreamCallbacks: vi.fn(async (_callbacks: unknown, fn: () => Promise<unknown>) => await fn()),
}))

const sharedMock = vi.hoisted(() => ({
  reportTaskProgress: vi.fn(async () => {}),
}))

const utilsMock = vi.hoisted(() => ({
  assertTaskActive: vi.fn(async () => {}),
}))

const llmStreamMock = vi.hoisted(() => ({
  createWorkerLLMStreamContext: vi.fn(() => ({ streamId: 'stream-1' })),
  createWorkerLLMStreamCallbacks: vi.fn(() => ({
    flush: vi.fn(async () => {}),
  })),
}))

const promptMock = vi.hoisted(() => ({
  PROMPT_IDS: { NP_EPISODE_SPLIT: 'np_episode_split' },
  buildPrompt: vi.fn(() => 'EPISODE_SPLIT_PROMPT'),
}))

/** Tracks calls made to the script-client SDK functions. */
const scriptClientMock = vi.hoisted(() => ({
  runEpisodeSplit: vi.fn(async () => ({
    success: true,
    episodes: [{ number: 1, title: '第一集', summary: '开端', content: 'content', wordCount: 10 }],
  })),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/llm-client', () => llmClientMock)
vi.mock('@/lib/config-service', () => configServiceMock)
vi.mock('@/lib/llm-observe/internal-stream-context', () => internalStreamMock)
vi.mock('@/lib/workers/shared', () => sharedMock)
vi.mock('@/lib/workers/utils', () => utilsMock)
vi.mock('@/lib/workers/handlers/llm-stream', () => llmStreamMock)
vi.mock('@/lib/prompt-i18n', () => promptMock)
vi.mock('@/lib/novel-promotion/story-to-script/clip-matching', () => ({
  createTextMarkerMatcher: (content: string) => ({
    matchMarker: (marker: string, fromIndex = 0) => {
      const startIndex = content.indexOf(marker, fromIndex)
      if (startIndex === -1) return null
      return {
        startIndex,
        endIndex: startIndex + marker.length,
      }
    },
  }),
}))
vi.mock('@/lib/mcp/clients/script-client', () => scriptClientMock)

import { handleEpisodeSplitTask, runEpisodeSplitService } from '@/lib/workers/handlers/episode-split'

function buildJob(content: string): Job<TaskJobData> {
  return {
    data: {
      taskId: 'task-episode-split-1',
      type: TASK_TYPE.EPISODE_SPLIT_LLM,
      locale: 'zh',
      projectId: 'project-1',
      targetType: 'NovelPromotionProject',
      targetId: 'project-1',
      payload: { content },
      userId: 'user-1',
    },
  } as unknown as Job<TaskJobData>
}

function buildContext(content: string) {
  return {
    taskId: 'task-episode-split-1',
    locale: 'zh' as const,
    projectId: 'project-1',
    userId: 'user-1',
    payload: { content },
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

describe('worker episode-split routing → script-client SDK', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handleEpisodeSplitTask delegates to scriptClient.runEpisodeSplit', async () => {
    const job = buildJob('some content')
    const result = await handleEpisodeSplitTask(job)

    expect(scriptClientMock.runEpisodeSplit).toHaveBeenCalledWith(job)
    expect(result).toEqual(expect.objectContaining({ success: true }))
  })
})

// ---------------------------------------------------------------------------
// Domain behavior tests: verify the service function behavior end-to-end
// ---------------------------------------------------------------------------

describe('worker episode-split', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails fast when content is too short', async () => {
    const context = buildContext('short text')
    const callbacks = buildTestCallbacks()
    await expect(runEpisodeSplitService(context, callbacks)).rejects.toThrow('文本太短，至少需要 100 字')
  })

  it('returns matched episodes when ai boundaries are valid', async () => {
    const content = [
      '前置内容用于凑长度，确保文本超过一百字。这一段会重复两次以保证长度满足阈值。',
      '前置内容用于凑长度，确保文本超过一百字。这一段会重复两次以保证长度满足阈值。',
      'START_MARKER',
      '这里是第一集的正文内容，包含角色冲突与场景推进，长度足够用于单元测试验证。',
      'END_MARKER',
      '后置内容用于确保边界外还有文本，并继续补足长度。',
    ].join('')

    const context = buildContext(content)
    const callbacks = buildTestCallbacks()
    const result = await runEpisodeSplitService(context, callbacks)

    expect(result.success).toBe(true)
    expect(result.episodes).toHaveLength(1)
    expect(result.episodes[0]?.number).toBe(1)
    expect(result.episodes[0]?.title).toBe('第一集')
    expect(result.episodes[0]?.content).toContain('START_MARKER')
    expect(result.episodes[0]?.content).toContain('END_MARKER')
  })
})
