# waoowaoo Refactor Implementation Plan

This document replaces the earlier prompt-style notes with an implementation plan grounded in the current repository layout.

## Refactor scope

The target refactor has three parallel goals:

1. Extract the current monolithic workflow/runtime logic into domain-oriented MCP services with typed SDK clients.
2. Expand the existing OpenAI-compatible layer into a production-ready `/api/v1` surface.
3. Add Render Network support for heavy rendering workloads without breaking the existing local pipeline.

The safest path is **incremental extraction**, not a rewrite. The current task system, Prisma models, and project domain types are already valuable stable contracts and should remain the backbone of the migration.

---

## 1. Current codebase map

### Stable core that should remain the orchestration backbone

| Area | Existing files | Why it should stay central |
| --- | --- | --- |
| Task contracts | `src/lib/task/types.ts`, `src/lib/task/queues.ts`, `src/lib/task/service.ts`, `src/lib/task/publisher.ts`, `src/lib/task/reconcile.ts` | Already defines task lifecycle, queue routing, SSE payload shape, and retry semantics. |
| Worker lifecycle | `src/lib/workers/index.ts`, `src/lib/workers/shared.ts`, `src/lib/workers/user-concurrency-gate.ts` | Already centralizes worker startup, shutdown, retry handling, and concurrency rules. |
| Run orchestration | `src/lib/run-runtime/*` | Provides graph execution and pipeline abstractions that can stay as the application-side orchestration layer. |
| Domain types | `src/types/project.ts`, `src/types/character-profile.ts`, `src/types/storyboard-types.ts` | Existing project/storyboard/media shapes should remain the source of truth for shared types. |
| Persistence | `prisma/schema.prisma` | Current tables encode project, media, storyboard, voice, and task state. Changes should be additive. |

### Current domain modules that are candidates for service extraction

| Domain | Existing files/directories |
| --- | --- |
| Script/text processing | `src/lib/ai-runtime/*`, `src/lib/workflows/story-to-script/graph.ts`, `src/lib/novel-promotion/story-to-script/*`, `src/lib/workers/handlers/story-to-script.ts`, `analyze-novel.ts`, `episode-split.ts`, `screenplay-convert.ts` |
| Storyboard/video orchestration | `src/lib/workflows/script-to-storyboard/graph.ts`, `src/lib/novel-promotion/script-to-storyboard/*`, `src/lib/workers/video.worker.ts`, `src/lib/workers/handlers/script-to-storyboard.ts`, `clips-build.ts` |
| Image generation | `src/lib/image-generation/*`, `src/lib/generators/*`, `src/lib/workers/image.worker.ts`, image-related handlers under `src/lib/workers/handlers/` |
| Voice/audio | `src/lib/voice/*`, `src/lib/lipsync/*`, `src/lib/workers/voice.worker.ts`, `src/lib/workers/handlers/voice-*` |
| Asset/storage | `src/lib/storage/*`, `src/lib/asset-utils/*`, `src/app/api/asset-hub/**/route.ts` |
| Model gateway / OpenAI compatibility | `src/lib/model-gateway/*`, `src/lib/llm/*`, `src/lib/generator-api.ts`, `src/lib/api-config.ts` |

### Existing tests that should anchor the migration

| Coverage area | Existing tests |
| --- | --- |
| Worker behavior | `tests/unit/worker/image-worker.test.ts`, `video-worker.test.ts`, `voice-worker.test.ts`, `story-to-script*.test.ts`, `script-to-storyboard*.test.ts` |
| OpenAI-compatible logic | `tests/unit/model-gateway/*`, `tests/unit/llm/*openai-compatible*.test.ts`, `tests/unit/generators/openai-compatible-*.test.ts` |
| Storage | `tests/unit/storage/bootstrap.test.ts`, `tests/unit/storage/factory.test.ts` |
| API routes | `tests/integration/api/contract/*`, `tests/integration/api/specific/asset-hub-*.test.ts` |
| Run/task integration | `tests/unit/run-runtime/*`, `tests/unit/task/*`, `tests/integration/chain/*.chain.test.ts` |

---

## 2. Design principles for the migration

1. **Do not replace the task model.** `TaskJobData`, `TaskType`, queue names, and SSE lifecycle events should remain the application-level contract.
2. **Keep Prisma changes additive.** Existing project/media/task tables should stay intact; new tables should only support the new API and Render integrations.
3. **Extract behind interfaces before moving code.** The first milestone is creating service contracts and client adapters while reusing existing implementations.
4. **Use feature-flagged cutovers.** Each new MCP-backed path should be enabled by config so production can fall back to in-process execution.
5. **Prefer shared types over duplicated request models.** The refactor should reuse `src/types/*`, `src/lib/task/types.ts`, and `src/lib/model-gateway/types.ts` where possible.
6. **Keep transport concerns separate from domain logic.** JSON-RPC/MCP handling should live in shared transport code, not inside domain handlers.
7. **Expand the current OpenAI-compatible code instead of building a second API stack.** The repository already has the right starting point in `src/lib/model-gateway/openai-compat/`.

---

## 3. Recommended target structure

To keep the migration production-safe, keep everything in the existing TypeScript repo first. Avoid a multi-package split until the service boundaries are stable.

### New shared foundation

- `src/lib/mcp/contracts.ts` — shared JSON-RPC/MCP request, response, error, and health-check types.
- `src/lib/mcp/errors.ts` — typed transport/domain error mapping.
- `src/lib/mcp/transport/sse.ts` — SSE server/client transport.
- `src/lib/mcp/transport/stdio.ts` — stdio transport for local tooling.
- `src/lib/mcp/server/base-server.ts` — common server bootstrap, tool registration, health handlers, shutdown hooks.
- `src/lib/mcp/client/base-client.ts` — retrying typed client wrapper with request validation.
- `src/lib/mcp/client/registry.ts` — resolves service URLs from environment and exposes health checks.

### New service entrypoints

- `src/mcp/script-server/index.ts`
- `src/mcp/image-server/index.ts`
- `src/mcp/video-server/index.ts`
- `src/mcp/voice-server/index.ts`
- `src/mcp/asset-server/index.ts`

Each server should expose MCP tools/resources but initially call the existing in-repo domain modules. This keeps the first cutover low-risk.

### New SDK surface

- `src/lib/mcp/clients/script-client.ts`
- `src/lib/mcp/clients/image-client.ts`
- `src/lib/mcp/clients/video-client.ts`
- `src/lib/mcp/clients/voice-client.ts`
- `src/lib/mcp/clients/asset-client.ts`

These clients become the only service-facing dependency used by workers and `/api/v1` handlers.

---

## 4. File-by-file implementation plan

## Phase 0 — shared contracts and rollout controls

| File / directory | Change needed | Notes |
| --- | --- | --- |
| `.env.example` | Add MCP endpoint flags, cutover flags, OpenAI API flags, Render Network flags, IPFS flags. | Keep all new features disabled by default except local dev-safe toggles. |
| `docker-compose.yml` | Add separate containers for script/image/video/voice/asset MCP services; add health checks and service dependencies. | Keep existing `app`, `mysql`, `redis`, and `minio` services. |
| `package.json` | Add service start scripts such as `start:mcp:script`, `start:mcp:image`, etc.; add verify scripts for new route/test subsets if needed. | Avoid new build systems; use existing `tsx`/Node flow. |
| `tsconfig.json` | Ensure new `src/lib/mcp/*` and `src/mcp/*` paths are included. | Do not weaken strictness. |
| `vitest.config.ts` | Only update if new test roots require it. Prefer keeping new tests in existing `tests/unit` and `tests/integration` folders. | |
| `src/lib/mcp/**` (new) | Create shared transport, contracts, client, and server bootstrap layers. | This is the main abstraction seam for the rest of the migration. |
| `src/lib/logging/*` | Reuse current structured logging in all MCP clients and servers. | Do not create a second logging format. |
| `src/lib/env.ts` or equivalent env helpers | Centralize parsing/validation for new MCP and Render environment variables. | All new config should validate on boot. |

### Why this phase comes first

The current repository already has strong domain logic but no clean transport boundary between workers and execution modules. Building the MCP transport and typed client layer first lets the team migrate worker-by-worker while preserving current behavior.

---

## Phase 1 — script/text processing extraction

### Files to keep as canonical domain logic

- `src/lib/ai-runtime/client.ts`
- `src/lib/ai-runtime/types.ts`
- `src/lib/workflows/story-to-script/graph.ts`
- `src/lib/novel-promotion/story-to-script/orchestrator.ts`
- `src/lib/workers/handlers/story-to-script.ts`
- `src/lib/workers/handlers/analyze-novel.ts`
- `src/lib/workers/handlers/episode-split.ts`
- `src/lib/workers/handlers/screenplay-convert.ts`
- `src/lib/run-runtime/*`

### Planned changes

| File / directory | Change needed |
| --- | --- |
| `src/mcp/script-server/index.ts` (new) | Register MCP tools for story analysis, episode splitting, story-to-script, screenplay conversion, and related run status queries. |
| `src/lib/mcp/clients/script-client.ts` (new) | Add typed wrappers for each script-processing tool, streaming support for long-running steps, and retryable error mapping. |
| `src/lib/workers/text.worker.ts` | Replace direct calls into text handlers with `script-client` calls while preserving task state updates, heartbeat logic, and SSE publishing. |
| `src/lib/workers/handlers/story-to-script.ts` | Convert from a worker entry handler into a domain service callable by both the worker and script MCP server. |
| `src/lib/workers/handlers/analyze-novel.ts` | Same extraction pattern; split request normalization from worker-side task bookkeeping. |
| `src/lib/workers/handlers/episode-split.ts` | Same extraction pattern. |
| `src/lib/workers/handlers/screenplay-convert.ts` | Same extraction pattern. |
| `src/lib/workers/handlers/resolve-analysis-model.ts` | Reuse from the service layer; do not duplicate model resolution logic in the MCP server. |
| `tests/unit/worker/story-to-script*.test.ts` | Update expectations to verify worker → SDK/client calls rather than worker → direct handler calls. |
| `tests/unit/run-runtime/*` | Preserve coverage for pipeline execution so orchestration correctness stays unchanged. |

### Type-safety rules for this phase

- Keep `TaskJobData` unchanged; add only service-specific payload schemas near the new client/server layer.
- Reuse `StoryToScriptGraphInput`, orchestrator result types, and pipeline graph state types instead of redefining them in the service.
- Use Zod only at the transport boundary; keep domain modules working with existing TypeScript types internally.

---

## Phase 2 — image generation and asset workflows

### Existing image/asset hotspots

- `src/lib/image-generation/*`
- `src/lib/generators/*`
- `src/lib/workers/image.worker.ts`
- `src/lib/workers/handlers/image-task-handlers.ts`
- `src/lib/workers/handlers/image-task-handlers-core.ts`
- `src/lib/workers/handlers/character-image-task-handler.ts`
- `src/lib/workers/handlers/location-image-task-handler.ts`
- `src/lib/workers/handlers/panel-image-task-handler.ts`
- `src/lib/workers/handlers/asset-hub-image-task-handler.ts`
- `src/lib/workers/handlers/asset-hub-ai-design.ts`
- `src/lib/workers/handlers/asset-hub-ai-modify.ts`
- `src/lib/workers/handlers/modify-asset-image-task-handler.ts`
- `src/lib/workers/handlers/reference-to-character.ts`
- `src/lib/storage/*`
- `src/lib/asset-utils/*`
- `src/app/api/asset-hub/**/route.ts`

### Planned changes

| File / directory | Change needed |
| --- | --- |
| `src/mcp/image-server/index.ts` (new) | Expose MCP tools for panel image generation, character generation, location generation, image modifications, and reference-to-character flows. |
| `src/mcp/asset-server/index.ts` (new) | Expose asset CRUD, uploads, selection, folder, appearance, and voice asset tools. |
| `src/lib/mcp/clients/image-client.ts` (new) | Add typed SDK for generation and image editing tools. |
| `src/lib/mcp/clients/asset-client.ts` (new) | Add typed SDK for asset CRUD, uploads, metadata, and media retrieval. |
| `src/lib/workers/image.worker.ts` | Route image tasks through `image-client` and asset-related tasks through `asset-client`. Preserve current concurrency behavior and failure mapping. |
| `src/lib/generators/factory.ts` | Keep provider selection local, but move service-facing request normalization behind the image MCP server so workers no longer instantiate providers directly. |
| `src/lib/generator-api.ts` | Refactor into reusable generation service methods that both internal APIs and MCP servers can call. |
| `src/app/api/asset-hub/appearances/route.ts` and sibling routes | Thin route handlers so they validate/authenticate locally, then call `asset-client` instead of manipulating storage/image logic inline. |
| `src/lib/storage/index.ts`, `factory.ts`, `providers/*` | Keep storage provider abstraction local to the asset service. Do not leak MinIO/S3 details across service boundaries. |
| `tests/unit/worker/image-worker.test.ts` | Verify worker calls the image/asset SDKs and keeps task-state semantics intact. |
| `tests/integration/api/specific/asset-hub-*.test.ts` | Use these as regression tests for thin-route behavior after the asset cutover. |
| `tests/unit/storage/*.test.ts` | Preserve provider behavior while storage responsibilities move behind the asset service boundary. |

### Clean-abstraction boundary

The image service should own provider orchestration and image generation concerns. The asset service should own persistence, metadata, uploads, and media retrieval. The current code mixes those two concerns in several handlers and asset-hub routes; Phase 2 should separate them without changing route contracts.

---

## Phase 3 — storyboard/video and voice/audio extraction

### Existing video/voice hotspots

- `src/lib/workflows/script-to-storyboard/graph.ts`
- `src/lib/novel-promotion/script-to-storyboard/*`
- `src/lib/workers/video.worker.ts`
- `src/lib/workers/handlers/script-to-storyboard.ts`
- `src/lib/workers/handlers/script-to-storyboard-helpers.ts`
- `src/lib/workers/handlers/script-to-storyboard-atomic-retry.ts`
- `src/lib/workers/handlers/clips-build.ts`
- `src/lib/voice/generate-voice-line.ts`
- `src/lib/voice/provider-voice-binding.ts`
- `src/lib/lipsync/*`
- `src/lib/workers/voice.worker.ts`
- `src/lib/workers/handlers/voice-analyze.ts`
- `src/lib/workers/handlers/voice-design.ts`

### Planned changes

| File / directory | Change needed |
| --- | --- |
| `src/mcp/video-server/index.ts` (new) | Expose storyboard generation, clip building, video rendering, and future Render-backed job submission tools. |
| `src/mcp/voice-server/index.ts` (new) | Expose voice design, voice-line synthesis, dubbing, and lipsync tools. |
| `src/lib/mcp/clients/video-client.ts` (new) | Provide typed access to storyboard/video tools, including async polling for long-running jobs. |
| `src/lib/mcp/clients/voice-client.ts` (new) | Provide typed access to voice/lipsync tools. |
| `src/lib/workers/video.worker.ts` | Replace direct storyboard/video execution imports with `video-client` calls; keep task retries and job resumption logic local. |
| `src/lib/workers/voice.worker.ts` | Replace direct voice/lipsync imports with `voice-client` calls; keep billing/task updates local. |
| `src/lib/workflows/script-to-storyboard/graph.ts` | Preserve as domain orchestration logic and call it from the video server instead of directly from the worker. |
| `src/lib/novel-promotion/script-to-storyboard/orchestrator.ts` | Keep as typed business logic; avoid duplicating prompt/parse rules in transport handlers. |
| `src/lib/lipsync/preprocess.ts` and `src/lib/lipsync/providers/*` | Move behind the voice service boundary; the worker should not know provider-specific details. |
| `tests/unit/worker/video-worker.test.ts` and `voice-worker.test.ts` | Update for SDK-backed execution while retaining current task semantics. |
| `tests/unit/worker/video-generation-resume.test.ts` | Use as a non-regression test for async external-job polling. |
| `tests/unit/voice/*` and `tests/unit/lipsync*.test.ts` | Preserve domain correctness while transport changes are introduced. |

---

## Phase 4 — OpenAI-compatible API expansion

The repository already has the right seed for this in `src/lib/model-gateway/openai-compat/*`. The migration should expand that layer instead of introducing a parallel API stack.

### Existing files to build on

- `src/lib/model-gateway/types.ts`
- `src/lib/model-gateway/router.ts`
- `src/lib/model-gateway/index.ts`
- `src/lib/model-gateway/openai-compat/chat.ts`
- `src/lib/model-gateway/openai-compat/image.ts`
- `src/lib/model-gateway/openai-compat/video.ts`
- `src/lib/model-gateway/openai-compat/responses.ts`
- `src/lib/model-gateway/openai-compat/template-image.ts`
- `src/lib/model-gateway/openai-compat/template-video.ts`
- `src/lib/llm/chat-completion.ts`
- `src/lib/llm/chat-stream.ts`
- `src/lib/api-config.ts`
- `src/lib/generator-api.ts`

### Planned changes

| File / directory | Change needed |
| --- | --- |
| `src/app/api/v1/chat/completions/route.ts` (new) | Implement OpenAI-compatible chat endpoint backed by model gateway + script/image/video clients as appropriate. |
| `src/app/api/v1/completions/route.ts` (new) | Add legacy text completion compatibility; keep implementation thin and reuse chat/request normalization where possible. |
| `src/app/api/v1/images/generations/route.ts` (new) | Call the image service through `image-client`; normalize output to OpenAI image response format. |
| `src/app/api/v1/audio/speech/route.ts` (new) | Route TTS to `voice-client`; align request/response shape with OpenAI audio semantics. |
| `src/app/api/v1/audio/transcriptions/route.ts` (new) | Add transcription entrypoint; if a real transcription provider is not yet present, gate behind a feature flag and return a structured unsupported error until implemented. |
| `src/app/api/v1/embeddings/route.ts` (new) | Add embeddings surface only if backed by a supported provider/model contract; otherwise defer behind config. |
| `src/app/api/v1/models/route.ts` (new) | Return model catalog data derived from existing provider/model configuration. |
| `src/app/api/v1/videos/generations/route.ts` (new) | Map waoowaoo video generation into OpenAI-style async job semantics via `video-client`. |
| `src/app/api/v1/videos/edits/route.ts` (new) | Add edit flow once video edit contract is stable. |
| `src/app/api/v1/storyboards/generations/route.ts` (new) | Expose storyboard generation using the video service. |
| `src/app/api/v1/scenes/generations/route.ts` (new) | Optional scene-level wrapper if the internal storyboard/video service exposes a suitable primitive. |
| `src/app/api/v1/projects/route.ts` and `src/app/api/v1/projects/[id]/route.ts` (new) | Expose a narrow external project API; do not mirror every internal project route immediately. |
| `src/lib/model-gateway/types.ts` | Expand request/response types so `/v1` handlers can reuse them instead of defining ad hoc route-level types. |
| `src/lib/model-gateway/openai-compat/common.ts` | Centralize auth headers, base URL normalization, id generation, error mapping, and streaming helpers. |
| `src/lib/model-gateway/openai-compat/responses.ts` | Keep response normalization logic shared between internal tests and public `/v1` routes. |
| `src/lib/api-auth.ts` | Extend to support API key auth for `/api/v1` without disturbing current session-based app auth. |
| `src/lib/rate-limit.ts` | Reuse for API key tier limits instead of creating a second limiter implementation. |
| `tests/unit/model-gateway/*` | Expand coverage for any new response formats and error mapping. |
| `tests/unit/llm/*openai-compatible*.test.ts` | Preserve protocol correctness for streaming and non-streaming chat behavior. |
| `tests/integration/api/contract/*` | Add route contract coverage for `/api/v1`. |

### Production-readiness guardrails

- Keep `/api/v1` behind `OPENAI_COMPAT_ENABLED` until the core endpoints are stable.
- Start with `chat`, `images`, `models`, and `videos/generations`; treat `audio/transcriptions`, `embeddings`, and scene-level endpoints as staged rollouts.
- Reuse existing observability and auth middleware patterns so the new surface matches the rest of the app.

---

## Phase 5 — API keys, usage tracking, and Prisma changes

### Planned changes

| File / directory | Change needed |
| --- | --- |
| `prisma/schema.prisma` | Add additive models for `ApiKey`, `ApiUsage`, and `RenderNetworkJob`. Avoid modifying existing project/media/task tables beyond optional foreign keys if absolutely required. |
| `src/lib/crypto-utils.ts` or `src/lib/api-auth.ts` | Add API key hashing/encryption helpers using existing secure utility patterns. |
| `src/app/api/user` or new internal admin routes | Add key-management endpoints for creating, revoking, and listing external API keys. |
| `src/lib/billing/*` | Extend usage accounting so `/api/v1` requests and Render Network costs can be metered without bypassing current billing modes. |
| `tests/integration/billing/*.test.ts` | Add focused coverage only where new billing/accounting paths are introduced. |

### Schema guidance

- Store only hashed API keys; return the raw `sk-...` value once at creation time.
- Track usage with additive records, not mutable counters, so rate limiting, billing, and audit all share the same source.
- Keep Render job metadata separate from `Task` rows so Render integration can evolve without destabilizing current task persistence.

---

## Phase 6 — Render Network integration

This should be the final cutover, after the video service boundary exists. Render integration is highest-risk because it introduces external execution, asynchronous reconciliation, cost accounting, and asset transfer concerns.

### Planned new modules

- `src/lib/render-network/client.ts`
- `src/lib/render-network/auth.ts`
- `src/lib/render-network/jobs.ts`
- `src/lib/render-network/router.ts`
- `src/lib/render-network/webhooks.ts`
- `src/lib/ipfs/client.ts`
- `src/lib/ipfs/pinning.ts`
- `src/lib/ipfs/types.ts`

### Planned changes

| File / directory | Change needed |
| --- | --- |
| `src/lib/render-network/*` (new) | Encapsulate RNDR auth, job submission, job polling, result retrieval, and cost estimation. |
| `src/lib/ipfs/*` (new) | Encapsulate optional IPFS upload/download/pinning logic for remote asset transfer. |
| `src/lib/mcp/clients/video-client.ts` | Add async job methods that can target either local execution or Render-backed execution. |
| `src/mcp/video-server/index.ts` | Implement hybrid routing between local rendering and Render Network based on workload and feature flags. |
| `src/lib/workers/video.worker.ts` | Preserve task ownership locally while delegating heavy jobs to the video service, which may further route to Render Network. |
| `src/lib/task/service.ts` and/or `src/lib/task/reconcile.ts` | Extend reconciliation for remote-job polling so lost Render jobs do not leave tasks stuck in processing. |
| `src/app/api/v1/videos/generations/route.ts` | Expose asynchronous video job creation/status semantics compatible with remote rendering. |
| `prisma/schema.prisma` | Add `RenderNetworkJob` metadata model and optional foreign keys to `Task`/project entities only if necessary. |
| `tests/unit/worker/video-generation-resume.test.ts` | Extend for remote job resume/reconcile paths. |
| `tests/integration/chain/video.chain.test.ts` | Use as end-to-end regression coverage for storyboard → video flow after Render routing is introduced. |

### Production-first rollout

1. Add Render support behind `RENDER_NETWORK_ENABLED=false` by default.
2. Start with a single workload class: heavy video renders only.
3. Keep local execution as the default path until queue-depth and recovery behavior are proven.
4. Treat image batching and other workloads as follow-up phases after video is stable.

---

## 5. What should explicitly stay unchanged during the migration

These areas should remain stable unless the refactor absolutely requires local, additive changes:

- `src/types/project.ts` — preserve current domain model shapes.
- `src/lib/task/types.ts` — preserve task lifecycle and queue contracts.
- `src/lib/task/queues.ts` — preserve queue names and routing behavior.
- `src/lib/run-runtime/*` — keep current graph execution semantics.
- Existing user-facing routes under `src/app/api/projects/*`, `src/app/api/tasks/*`, `src/app/api/runs/*`, and `src/app/api/sse/*` — convert them to thin clients only when needed, not all at once.
- Existing Prisma models for project/storyboard/media entities — only additive changes should be allowed.

Keeping these stable will let the team migrate domain execution without forcing simultaneous frontend, persistence, and queue rewrites.

---

## 6. Recommended migration order

### Milestone 1: Shared foundation
- Add `src/lib/mcp/*` contracts, clients, and server bootstrap.
- Add env/config parsing and docker service definitions.
- No domain cutover yet.

### Milestone 2: Script service cutover
- Stand up `script-server` around existing story/screenplay modules.
- Switch `text.worker.ts` to `script-client`.
- Validate task lifecycle and run-runtime behavior.

### Milestone 3: Image + asset cutover
- Extract image and asset responsibilities into separate service boundaries.
- Switch `image.worker.ts` and `asset-hub` routes to typed clients.
- Validate existing asset-hub integration tests.

### Milestone 4: Voice + video cutover
- Move voice/lipsync behind `voice-client`.
- Move storyboard/video execution behind `video-client`.
- Preserve local execution in the video service.

### Milestone 5: Public `/api/v1`
- Ship `chat`, `images`, `models`, and `videos/generations` first.
- Add API keys, usage metering, and rate limiting.
- Expand endpoint set only after compatibility tests are passing.

### Milestone 6: Render Network
- Add remote job abstraction, job reconciliation, and IPFS transfer.
- Roll out to heavy video jobs only.
- Measure recovery, cost, and queue behavior before broadening scope.

---

## 7. Testing and verification plan

### Unit tests to add or update

- `tests/unit/worker/*.test.ts` — verify workers now call SDK clients instead of domain modules directly.
- `tests/unit/model-gateway/*.test.ts` — cover new OpenAI request/response normalization and error mapping.
- `tests/unit/storage/*.test.ts` — ensure provider abstraction still behaves identically after asset-service extraction.
- `tests/unit/voice/*.test.ts` and `tests/unit/lipsync*.test.ts` — ensure voice/lipsync correctness survives service extraction.

### Integration tests to add or update

- `tests/integration/api/contract/*` — add `/api/v1` route coverage.
- `tests/integration/api/specific/asset-hub-*.test.ts` — keep thin-route behavior stable during the asset cutover.
- `tests/integration/chain/*.chain.test.ts` — confirm end-to-end workflow behavior remains intact.

### Operational verification

- Service boot health checks for all MCP servers.
- Worker start/shutdown behavior with remote service dependencies unavailable.
- Task reconciliation for both local and remote execution.
- OpenAI-compatible streaming behavior through SSE.
- Render Network retry, cancellation, and stale-job recovery.

---

## 8. Production-readiness checklist

Before any domain cutover is considered complete, confirm all of the following:

- Feature flag exists for the new path.
- Local fallback exists if the service or Render provider is unavailable.
- Transport input/output is validated with typed schemas.
- Worker task lifecycle events are unchanged.
- Billing and usage accounting still flow through the existing billing system.
- Logs use the current structured logging conventions.
- Health checks and graceful shutdown are implemented.
- Route contracts remain backward-compatible for the web app.
- New Prisma changes are additive and migration-safe.
- Existing regression tests for that domain still pass.

---

## 9. Summary

The current codebase is already well-positioned for this refactor because it has three strong foundations:

1. a stable task and queue model,
2. strong shared TypeScript domain types, and
3. an existing OpenAI-compatible gateway to extend.

The highest-value implementation plan is therefore:

- **extract transport and client abstractions first,**
- **cut workers over one domain at a time,**
- **ship `/api/v1` on top of the expanded gateway and new service clients,** and
- **introduce Render Network only after the video service boundary is stable.**

That approach keeps the system production-ready throughout the migration while still achieving the requested MCP architecture, OpenAI compatibility, and Render-backed scaling path.
