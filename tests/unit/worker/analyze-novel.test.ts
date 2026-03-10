import type { Job } from 'bullmq'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

const prismaMock = vi.hoisted(() => ({
  project: { findUnique: vi.fn() },
  novelPromotionProject: {
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
  },
  novelPromotionEpisode: { findFirst: vi.fn() },
  novelPromotionCharacter: { create: vi.fn(async () => ({ id: 'char-new-1' })) },
  novelPromotionLocation: { create: vi.fn(async () => ({ id: 'loc-new-1' })) },
  locationImage: { create: vi.fn(async () => ({})) },
}))

const llmMock = vi.hoisted(() => ({
  chatCompletion: vi.fn(async () => ({ id: 'completion-1' })),
  getCompletionContent: vi.fn(),
}))

const workerMock = vi.hoisted(() => ({
  reportTaskProgress: vi.fn(async () => undefined),
  assertTaskActive: vi.fn(async () => undefined),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/llm-client', () => llmMock)
vi.mock('@/lib/llm-observe/internal-stream-context', () => ({
  withInternalLLMStreamCallbacks: vi.fn(async (_callbacks: unknown, fn: () => Promise<unknown>) => await fn()),
}))
vi.mock('@/lib/constants', () => ({
  getArtStylePrompt: vi.fn(() => 'cinematic style'),
  removeLocationPromptSuffix: vi.fn((text: string) => text.replace(' [SUFFIX]', '')),
}))
vi.mock('@/lib/workers/shared', () => ({ reportTaskProgress: workerMock.reportTaskProgress }))
vi.mock('@/lib/workers/utils', () => ({ assertTaskActive: workerMock.assertTaskActive }))
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
vi.mock('@/lib/prompt-i18n', () => ({
  PROMPT_IDS: {
    NP_AGENT_CHARACTER_PROFILE: 'char',
    NP_SELECT_LOCATION: 'loc',
  },
  buildPrompt: vi.fn(() => 'analysis-prompt'),
}))

/** Tracks calls made to the script-client SDK functions. */
const scriptClientMock = vi.hoisted(() => ({
  runAnalyzeNovel: vi.fn(async () => ({
    success: true,
    characters: [{ id: 'char-new-1' }],
    locations: [{ id: 'loc-new-1' }],
    characterCount: 1,
    locationCount: 1,
  })),
}))
vi.mock('@/lib/mcp/clients/script-client', () => scriptClientMock)

import { handleAnalyzeNovelTask, runAnalyzeNovelService } from '@/lib/workers/handlers/analyze-novel'

function buildJob(): Job<TaskJobData> {
  return {
    data: {
      taskId: 'task-analyze-novel-1',
      type: TASK_TYPE.ANALYZE_NOVEL,
      locale: 'zh',
      projectId: 'project-1',
      episodeId: 'episode-1',
      targetType: 'NovelPromotionProject',
      targetId: 'np-project-1',
      payload: {},
      userId: 'user-1',
    },
  } as unknown as Job<TaskJobData>
}

// ---------------------------------------------------------------------------
// Routing test: verify the worker handler delegates to the script SDK client
// ---------------------------------------------------------------------------

describe('worker analyze-novel routing → script-client SDK', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handleAnalyzeNovelTask delegates to scriptClient.runAnalyzeNovel', async () => {
    const job = buildJob()
    const result = await handleAnalyzeNovelTask(job)

    expect(scriptClientMock.runAnalyzeNovel).toHaveBeenCalledWith(job)
    expect(result).toEqual(expect.objectContaining({ success: true, characterCount: 1 }))
  })
})

// ---------------------------------------------------------------------------
// Domain behavior tests: verify the service function behavior end-to-end
// ---------------------------------------------------------------------------

describe('worker analyze-novel behavior', () => {
  function buildContext() {
    return {
      taskId: 'task-analyze-novel-1',
      locale: 'zh' as const,
      projectId: 'project-1',
      episodeId: 'episode-1',
      userId: 'user-1',
      payload: {},
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
      onProgress: workerMock.reportTaskProgress as unknown as (progress: number, data: Record<string, unknown>) => Promise<void>,
      assertActive: workerMock.assertTaskActive as unknown as (checkpoint: string) => Promise<void>,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.project.findUnique.mockResolvedValue({
      id: 'project-1',
      mode: 'novel-promotion',
    })

    prismaMock.novelPromotionProject.findUnique.mockResolvedValue({
      id: 'np-project-1',
      analysisModel: 'llm::analysis-1',
      artStyle: 'cinematic',
      globalAssetText: '全局设定文本',
      characters: [{ id: 'char-existing', name: '已有角色' }],
      locations: [{ id: 'loc-existing', name: '已有场景', summary: 'old' }],
    })

    prismaMock.novelPromotionEpisode.findFirst.mockResolvedValue({
      novelText: '首集内容',
    })

    llmMock.getCompletionContent
      .mockReturnValueOnce(JSON.stringify({
        characters: [
          {
            name: '新角色',
            aliases: ['别名A'],
            role_level: 'main',
            personality_tags: ['冷静'],
            visual_keywords: ['黑发'],
          },
        ],
      }))
      .mockReturnValueOnce(JSON.stringify({
        locations: [
          {
            name: '新地点',
            summary: '雨夜街道',
            descriptions: ['雨夜街道 [SUFFIX]'],
          },
        ],
      }))
  })

  it('no global text and no episode text -> explicit error', async () => {
    prismaMock.novelPromotionProject.findUnique.mockResolvedValueOnce({
      id: 'np-project-1',
      analysisModel: 'llm::analysis-1',
      artStyle: 'cinematic',
      globalAssetText: '',
      characters: [],
      locations: [],
    })
    prismaMock.novelPromotionEpisode.findFirst.mockResolvedValueOnce({ novelText: '' })

    await expect(runAnalyzeNovelService(buildContext(), buildTestCallbacks())).rejects.toThrow('请先填写全局资产设定或剧本内容')
  })

  it('success path -> creates character/location and persists cleaned location descriptions', async () => {
    const result = await runAnalyzeNovelService(buildContext(), buildTestCallbacks())

    expect(result).toEqual({
      success: true,
      characters: [{ id: 'char-new-1' }],
      locations: [{ id: 'loc-new-1' }],
      characterCount: 1,
      locationCount: 1,
    })

    expect(prismaMock.novelPromotionCharacter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          novelPromotionProjectId: 'np-project-1',
          name: '新角色',
          aliases: JSON.stringify(['别名A']),
        }),
      }),
    )

    expect(prismaMock.novelPromotionLocation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          novelPromotionProjectId: 'np-project-1',
          name: '新地点',
          summary: '雨夜街道',
        }),
      }),
    )

    expect(prismaMock.locationImage.create).toHaveBeenCalledWith({
      data: {
        locationId: 'loc-new-1',
        imageIndex: 0,
        description: '雨夜街道',
      },
    })

    expect(prismaMock.novelPromotionProject.update).toHaveBeenCalledWith({
      where: { id: 'np-project-1' },
      data: { artStylePrompt: 'cinematic style' },
    })

    expect(workerMock.reportTaskProgress).toHaveBeenCalledWith(
      60,
      expect.objectContaining({
        stepId: 'analyze_characters',
        done: true,
        output: expect.stringContaining('"characters"'),
      }),
    )

    expect(workerMock.reportTaskProgress).toHaveBeenCalledWith(
      70,
      expect.objectContaining({
        stepId: 'analyze_locations',
        done: true,
        output: expect.stringContaining('"locations"'),
      }),
    )
  })
})
