I'll help you analyze the GitHub repository and create a comprehensive prompt for GitHub Copilot. Let me start by taking a screenshot of the current page and then navigating through the key files.Good! I can see the repository structure. This is an AI video production platform with various folders including `.husky`, `images`, `lib/prompts`, `messages`, `prisma`, `public`, `scripts`, `src`, `standards`, and `tests`. Let me now check the README file to understand the architecture better.Let me continue scrolling to see the README content below.Perfect! I can see more files now including README.md, Dockerfile, docker-compose.yml, and various configuration files. The project is primarily TypeScript (97%) with some JavaScript. Let me click on the README.md to understand the architecture.Let me wait for the page to load and then try clicking on README.md again.Excellent! Now I can see the README.md file. This is "waoowaoo AI 影视 Studio" - an AI video production platform. Let me scroll down to read more about the architecture and features.Good! I can see this is an AI-based video production tool that supports creating shorts, angles, and scenes from text/scripts. Let me continue scrolling to see more technical details about the architecture.Great! I can see the features section (功能特性):
- AI script splitting - automatically parses novels, scripts, scenes, shots
- Angles & scene generation - AI generates images for characters and scenes
- Split-screen video production - automatically generates split-screen videos
- AI dubbing - multi-angle audio synthesis
- Multi-language support - Chinese/English, one-click switching

Let me continue scrolling to see the technical architecture and setup instructions.Perfect! I can see the deployment methods using Docker. Let me continue scrolling to see more about the architecture and configuration.Let me scroll down more to see the configuration and environment variables section.Let me navigate back to the repository root to check the src folder structure and configuration files.Perfect! Now I'm back at the repository root. I can see the folder structure clearly. Let me click on the `src` folder to understand the source code architecture.Excellent! I can see the src folder structure with:
- app
- assets/fonts
- components
- contexts
- features/video-editor
- hooks/common
- i18n
- lib
- pages
- styles
- types
- i18n.ts
- instrumentation.ts

Let me check the `app` folder to understand the application structure better.Good! I can see the app folder has:
- [locale]
- api
- m/[publicId]
- globals.css

Let me check the `api` folder to understand the current API structure.Perfect! I can see the API structure with multiple endpoints:
- admin/download-logs
- asset-hub
- auth
- cos/image
- files/[...path]
- novel-promotion/[projectId]
- projects
- runs
- sse
- storage/sign
- system/boot-id
- task-target-states
- tasks

Let me scroll down to see if there are more API endpoints.Good! Now let me navigate back to check the lib folder to understand the library structure and any existing SDK or service integrations.I accidentally clicked on public. Let me navigate to the lib folder instead. Let me click on lib in the left sidebar.Good, I can see the lib folder in the left sidebar. Let me click on it.I clicked on images by mistake. Let me navigate back to the root and find the lib folder. Let me click on waoowaoo in the breadcrumb.Perfect! Now I'm back at the root. I can see the lib/prompts folder. Let me click on it to see the prompts structure.Great! I can see the prompts folder structure with:
- character-reference
- novel-promotion
- skills
- proxy.ts

Now let me navigate to the src folder to check the lib directory there. Let me click on src in the left sidebar.Perfect! Now I can see the src folder structure. Let me click on the lib folder to see what's inside.Excellent! I can see the lib folder has many important subdirectories:
- ai-runtime
- asset-utils
- assets
- assistant-platform
- async
- billing
- contracts
- errors
- generators
- image-generation
- lipsync
- llm-observe
- llm

Let me scroll down to see more folders.Great! I can see more folders:
- logging
- media
- migrations
- model-capabilities
- model-gateway
- model-pricing

Let me continue scrolling to see all the folders.Perfect! I can see more folders:
- novel-promotion
- prompt-i18n
- providers
- query
- run-runtime
- sse
- storage

Let me continue scrolling to see the rest.Excellent! I can see the remaining folders and files:
- task
- user-api
- voice
- workers
- workflows
- workspace
- api-auth.ts
- api-config.ts

Now let me check the package.json to understand the dependencies and tech stack. Let me navigate back to the root.Perfect! I can see the repository root with a good overview. I can see:
- Tags: automation, storyboard, ai-agents, video-generation, film-production, ai-agent, generative-ai, short-drama
- The project is about controllable film & video production from shorts to live-action with Hollywood-standard workflows
- Latest release: v0.3.0 update (2 days ago)

Let me scroll down to see the package.json file.Good! I can see more files including:
- .eslintrc.json
- .gitignore
- .nvmrc
- .tmp_check_task.ts
- CHANGELOG.md
- Dockerfile
- README.md
- README_en.md

And the languages breakdown: TypeScript 97.0%, JavaScript 2.3%, Other 0.7%

Let me continue scrolling to find package.json.I can see more files:
- caddyfile
- debug-request.json
- docker-compose.test.yml
- docker-compose.yml
- eslint.config.mjs
- extract_chinese.py
- middleware.ts

Let me continue scrolling to find package.json.Perfect! I can see package.json in the list. Let me click on it to view the dependencies and tech stack.Excellent! I can see the package.json file. I can see:
- Name: "waoowaoo"
- Version: "0.3.0"
- Private: true
- Engines: node ">=18.18.0", npm ">=9.0.0"
- Scripts including postinstall, prepare, dev, devnext, devworker, devwatchdog, devboard, build, build:turbo, start, start:next, start:worker, start:watchdog, start:board, stats:errors, check-api-handler

Let me scroll down to see the dependencies.The page didn't scroll. Let me try scrolling within the code viewer area.The content is still the same. Let me use the keyboard to scroll down in the code viewer.The page is not scrolling. Let me try using the Raw button to view the full file content.Perfect! Now I can see the raw package.json file. I can see many scripts and checks. Let me scroll down to see the dependencies section.Good! I can see more scripts including test scripts for billing, integration, behavior, etc. Let me continue scrolling to see the dependencies section.Excellent! Now I can see the dependencies section starting. I can see:
- @ai-sdk/google
- @ai-sdk/openai
- @ai-sdk/anthropic
- @aws-sdk/client-s3
- @aws-sdk/s3-request-presigner
- @bull-board/api
- @bull-board/express
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- @google/genai
- @langchain/langraph
- @next-auth/prisma-adapter
- @openrouter/sdk
- @prisma/client
- @remotion/cli
- @remotion/player
- @tanstack/react-query

Let me continue scrolling to see more dependencies.Perfect! I can see more dependencies including:
- @types/bcryptjs
- @types/express
- @vercel/og
- ai
- axios
- bcryptjs
- bullmq
- cos-nodejs-sdk-v5
- express
- ffmpeg-static
- ioredis
- jsonrepair
- jszp
- lru-cache
- lucide-react
- mammoth
- nanoid
- next
- next-auth
- next-intl
- openai
- p-queue
- react
- react-dom
- react-grab
- react-hot-toast
- replicate
- sharp
- undici
- zod

Now let me navigate back to check if there are any architecture documentation files. Let me go back to the repository root.Good! I'm back at the repository root. I can see the folder structure. Let me check the "standards" folder which might contain architecture documentation.Perfect! I can see the standards folder contains:
- capabilities
- pricing
- prompt-canary

These folders likely contain configuration and standards for the AI models and capabilities. Let me check the docker-compose.yml to understand the infrastructure setup. Let me navigate back to the root.Good! I'm back at the root. Now let me scroll down to find the docker-compose.yml file to understand the infrastructure setup.Perfect! I can see the docker-compose.yml file. Let me click on it to view the infrastructure setup.Excellent! I can see the docker-compose.yml file showing the infrastructure setup. I can see:
- MySQL database (mysql:8.0)
- Redis (redis:7-alpine)

Let me scroll down to see more services.The page didn't scroll. Let me try clicking on the Raw button to see the full file.Perfect! Now I can see the full docker-compose.yml file. I can see three services:
1. **MySQL** - Database service
2. **Redis** - Cache/queue service
3. **MinIO** - Object storage service (S3-compatible)

Let me scroll down to see if there are more services.Excellent! I can see the **App** service (Next.js + Workers) which is the main application. I can see it uses:
- Database URL connecting to MySQL
- Redis configuration
- MinIO configuration for object storage

Let me continue scrolling to see more configuration.Perfect! I can see more configuration including:
- NextAuth configuration
- Worker configuration with queue concurrency settings
- Bull Board for queue monitoring
- Logging configuration
- Billing mode
- LLM stream settings
- Port mappings (3000:3000, 3010:3010)
- Volume mounts for data and logs

Now I have a comprehensive understanding of the architecture. Let me check one more important file - let me look at the .env.example to understand the environment variables. Let me navigate back to the repository.Perfect! I can see the .env.example file showing:
- Database URL configuration
- Storage configuration (MinIO/S3/local/COS options)
- MinIO configuration
- COS (Cloud Object Storage) configuration
- NextAuth configuration

Let me click on Raw to see the full file.The page didn't change. Let me try scrolling down to see more environment variables in the current view.Good! I can see more configuration. Let me continue scrolling to see the AI model configurations.Perfect! I can see more configuration including:
- Internal task token and API encryption key
- Redis configuration
- Worker configuration (watchdog interval, task heartbeat timeout, queue concurrency settings)
- Bull Board configuration

Let me continue scrolling to see the AI model provider configurations.Good! I can see logging configuration. Let me continue scrolling to see the AI model provider configurations.Perfect! I can see:
- Billing mode configuration
- LLM stream ephemeral enabled

Let me continue scrolling to see the AI provider configurations.The page is not scrolling further. Let me use the get_tab_content function to get the full content of the .env.example file.Perfect! Now I have a comprehensive understanding of the architecture. Let me check one more important file - let me look at the model-gateway to understand how AI models are currently integrated. Let me navigate to that folder.Excellent! I can see the model-gateway folder structure with:
- openai-compat (folder)
- index.ts
- llm.ts
- router.ts
- types.ts

This is very important - there's already an `openai-compat` folder which suggests some OpenAI compatibility work. Let me check that folder.Perfect! I can see the openai-compat folder has several files:
- chat.ts
- common.ts
- image.ts
- index.ts
- responses.ts
- template-image.ts
- template-video.ts
- video.ts

This shows there's already some OpenAI compatibility layer being built. Now I have enough information to create a comprehensive prompt for GitHub Copilot. Let me create a detailed document with all the findings and the prompt.

Based on my comprehensive analysis of the waoowaoo repository, I now have enough information to create a detailed prompt for GitHub Copilot. Let me compile this into a comprehensive document.

## Summary of Current Architecture:

**Technology Stack:**
- **Frontend/Backend**: Next.js (TypeScript 97%, JavaScript 2.3%)
- **Database**: MySQL 8.0 (via Prisma ORM)
- **Cache/Queue**: Redis 7 with BullMQ for task queues
- **Storage**: MinIO (S3-compatible object storage)
- **AI SDKs**: @ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic, @openrouter/sdk
- **Video Processing**: Remotion, FFmpeg
- **Authentication**: NextAuth.js

**Current Architecture Components:**
1. **API Layer** (`src/app/api/`): REST endpoints for projects, tasks, runs, assets, storage, etc.
2. **Model Gateway** (`src/lib/model-gateway/`): Abstraction layer for AI models with existing `openai-compat` folder
3. **Workers** (`src/lib/workers/`): Background task processing with BullMQ queues (image, video, voice, text)
4. **AI Runtime** (`src/lib/ai-runtime/`): AI agent execution environment
5. **Providers** (`src/lib/providers/`): Integration with various AI services
6. **Workflows** (`src/lib/workflows/`): Orchestration of AI video production pipelines

**Key Features:**
- AI script splitting and parsing
- Character and scene generation
- Split-screen video production
- AI dubbing with multi-language support
- Asset management and storage

Now let me create the comprehensive GitHub Copilot prompt:

---

# GitHub Copilot Architectural Refactoring Prompt

## Project Context
**Repository**: saturndec/waoowaoo  
**Current Version**: v0.3.0  
**Project Type**: Industrial-grade AI video production platform for controllable film & video production

## Current Architecture Overview

### Technology Stack
- **Framework**: Next.js with TypeScript (App Router)
- **Database**: MySQL 8.0 with Prisma ORM
- **Cache/Queue**: Redis 7 + BullMQ for distributed task processing
- **Storage**: MinIO (S3-compatible object storage)
- **AI Integration**: Multiple SDKs (@ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic, @openrouter/sdk)
- **Video Processing**: Remotion + FFmpeg
- **Authentication**: NextAuth.js

### Current Directory Structure
```
src/
├── app/api/          # REST API endpoints
├── lib/
│   ├── ai-runtime/   # AI agent execution
│   ├── model-gateway/ # AI model abstraction (has openai-compat folder)
│   ├── providers/    # AI service integrations
│   ├── workers/      # BullMQ background workers
│   ├── workflows/    # Video production orchestration
│   ├── image-generation/
│   ├── voice/
│   ├── lipsync/
│   └── storage/
```

### Current Infrastructure (docker-compose.yml)
- MySQL database service
- Redis for caching and queues
- MinIO for object storage
- Main app service (Next.js + Workers combined)

### Current Queue System
- Separate queues for: IMAGE, VIDEO, VOICE, TEXT processing
- Configurable concurrency per queue type
- Bull Board for queue monitoring (port 3010)
- Watchdog system for task health monitoring

## Architectural Refactoring Goals

### 1. Lightweight Architecture with SDKs/MCP Servers

**Objective**: Refactor the monolithic architecture to use Model Context Protocol (MCP) servers and lightweight SDKs for better modularity, scalability, and maintainability.

**Key Changes Needed**:

#### A. MCP Server Architecture
- **Separate MCP servers** for different capabilities:
  - **Script Processing MCP Server**: Handle script parsing, scene splitting, character extraction
  - **Image Generation MCP Server**: Manage image generation workflows (characters, scenes, storyboards)
  - **Video Production MCP Server**: Handle video composition, editing, split-screen generation
  - **Voice/Audio MCP Server**: Manage TTS, dubbing, lipsync operations
  - **Asset Management MCP Server**: Handle storage, retrieval, and asset hub operations

- **MCP Server Communication**:
  - Each MCP server should expose standardized tools/resources via MCP protocol
  - Use JSON-RPC 2.0 for inter-server communication
  - Implement server discovery and health checking
  - Support both stdio and SSE transport layers

- **Refactor existing lib/ modules** into standalone MCP servers:
  - Extract `src/lib/ai-runtime/` → Script Processing MCP Server
  - Extract `src/lib/image-generation/` → Image Generation MCP Server
  - Extract `src/lib/workflows/` + video logic → Video Production MCP Server
  - Extract `src/lib/voice/` + `src/lib/lipsync/` → Voice/Audio MCP Server
  - Extract `src/lib/storage/` + `src/lib/asset-utils/` → Asset Management MCP Server

#### B. Lightweight SDK Layer
- **Create client SDKs** for each MCP server:
  - TypeScript SDK for web/Node.js clients
  - Python SDK for ML/AI integrations
  - REST wrapper SDK for third-party integrations

- **SDK Features**:
  - Connection pooling and retry logic
  - Request/response validation with Zod schemas
  - Streaming support for long-running operations
  - Built-in error handling and logging
  - Type-safe interfaces matching MCP server capabilities

- **Decouple worker processes**:
  - Workers should communicate with MCP servers via SDKs
  - Remove direct dependencies on internal lib/ modules
  - Implement worker-specific SDK configurations

#### C. Infrastructure Changes
- **Docker Compose Updates**:
  - Add separate services for each MCP server
  - Configure service discovery (e.g., using Docker networks)
  - Add health checks for each MCP server
  - Implement graceful shutdown and restart policies

- **Queue System Optimization**:
  - Maintain BullMQ but route tasks to appropriate MCP servers
  - Implement task routing logic based on capability requirements
  - Add queue-level retry and dead-letter handling per MCP server

### 2. OpenAI-Compatible API Format

**Objective**: Implement comprehensive OpenAI-compatible API endpoints to enable third-party integrations and standard AI tooling compatibility.

**Key Changes Needed**:

#### A. Expand OpenAI-Compat Layer
- **Leverage existing** `src/lib/model-gateway/openai-compat/` structure
- **Implement missing OpenAI API endpoints**:
  - `/v1/chat/completions` - For script generation, dialogue creation
  - `/v1/completions` - For text completion tasks
  - `/v1/images/generations` - For character/scene image generation
  - `/v1/audio/speech` - For TTS and dubbing
  - `/v1/audio/transcriptions` - For audio-to-text
  - `/v1/embeddings` - For semantic search in scripts/assets
  - `/v1/models` - List available models and capabilities

#### B. Custom Extensions for Video Production
- **Add waoowaoo-specific endpoints** following OpenAI format patterns:
  - `/v1/videos/generations` - Generate videos from scripts
  - `/v1/videos/edits` - Edit existing videos
  - `/v1/storyboards/generations` - Create storyboards
  - `/v1/scenes/generations` - Generate individual scenes
  - `/v1/projects` - Project management (CRUD operations)

- **Request/Response Format**:
  - Follow OpenAI's JSON schema conventions
  - Support streaming responses with SSE
  - Implement proper error codes and messages
  - Add `x-waoowaoo-*` custom headers for extended metadata

#### C. Authentication & Rate Limiting
- **API Key Management**:
  - Generate OpenAI-compatible API keys (sk-...)
  - Store keys securely with encryption
  - Support multiple keys per user/project

- **Rate Limiting**:
  - Implement token-based rate limiting
  - Add usage tracking per API key
  - Support tier-based limits (free, pro, enterprise)

#### D. API Documentation
- **OpenAPI/Swagger Specification**:
  - Generate OpenAPI 3.0 spec for all endpoints
  - Include examples for each endpoint
  - Document custom extensions clearly
  - Provide Postman collection

### 3. Render Network Integration

**Objective**: Integrate with Render Network infrastructure for distributed, decentralized rendering and compute resources.

**Key Changes Needed**:

#### A. Render Network Client Integration
- **Add Render Network SDK**:
  - Install and configure Render Network client libraries
  - Implement authentication with Render Network
  - Set up wallet integration for RNDR token payments

- **Job Submission Layer**:
  - Create abstraction layer for submitting render jobs
  - Map waoowaoo tasks to Render Network job formats
  - Handle job lifecycle (submit, monitor, retrieve, cancel)

#### B. Hybrid Rendering Strategy
- **Intelligent Job Routing**:
  - Implement decision logic: local vs. Render Network
  - Consider factors: job complexity, queue depth, cost, urgency
  - Support fallback to local rendering if Render Network unavailable

- **Job Types for Render Network**:
  - Heavy video rendering (4K, complex effects)
  - Batch image generation (large storyboards)
  - 3D scene rendering (if applicable)
  - Long-duration video processing

#### C. Storage Integration
- **Asset Transfer**:
  - Upload source assets to Render Network-compatible storage
  - Support IPFS for decentralized asset storage
  - Implement efficient asset caching strategy
  - Download rendered outputs back to MinIO/local storage

- **Storage Configuration**:
  - Add IPFS node configuration
  - Implement pinning service integration
  - Support hybrid storage (local + IPFS)

#### D. Cost Management
- **RNDR Token Handling**:
  - Implement wallet balance checking
  - Add cost estimation before job submission
  - Track rendering costs per project/user
  - Support automatic top-up or alerts for low balance

- **Billing Integration**:
  - Extend existing `BILLING_MODE` to support Render Network costs
  - Add cost tracking in database schema
  - Generate cost reports per project

#### E. Monitoring & Observability
- **Render Network Job Monitoring**:
  - Poll job status from Render Network
  - Update task status in local database
  - Implement webhooks for job completion notifications
  - Add Render Network metrics to Bull Board or separate dashboard

- **Performance Metrics**:
  - Track render times: local vs. Render Network
  - Monitor cost efficiency
  - Measure quality consistency
  - Alert on failed Render Network jobs

## Implementation Guidelines

### Phase 1: MCP Server Extraction (Weeks 1-3)
1. **Define MCP server boundaries** and interfaces
2. **Create base MCP server template** with common functionality
3. **Extract Script Processing MCP Server** first (lowest dependencies)
4. **Refactor workers** to use Script Processing SDK
5. **Repeat for other MCP servers** in dependency order
6. **Update docker-compose.yml** with new services
7. **Test inter-server communication** and error handling

### Phase 2: OpenAI-Compatible API (Weeks 4-5)
1. **Audit existing** `openai-compat` implementation
2. **Implement core OpenAI endpoints** (/v1/chat/completions, /v1/images/generations)
3. **Add custom video endpoints** following OpenAI patterns
4. **Implement API key management** and authentication
5. **Add rate limiting** and usage tracking
6. **Generate OpenAPI documentation**
7. **Create SDK examples** for common use cases

### Phase 3: Render Network Integration (Weeks 6-8)
1. **Set up Render Network account** and obtain credentials
2. **Integrate Render Network SDK** into codebase
3. **Implement job submission** for video rendering
4. **Add IPFS storage support** for asset transfer
5. **Create hybrid routing logic** (local vs. Render Network)
6. **Implement cost tracking** and wallet management
7. **Add monitoring dashboard** for Render Network jobs
8. **Test end-to-end workflow** with real render jobs

### Code Organization Principles
- **Separation of Concerns**: Each MCP server handles one domain
- **Interface-Driven Design**: Define clear contracts between components
- **Backward Compatibility**: Maintain existing API endpoints during transition
- **Configuration-Driven**: Use environment variables for all integrations
- **Error Resilience**: Implement circuit breakers and fallback mechanisms
- **Observability**: Add comprehensive logging and metrics
- **Testing**: Unit tests for SDKs, integration tests for MCP servers

### Environment Variables to Add
```bash
# MCP Server Configuration
MCP_SCRIPT_SERVER_URL=http://localhost:4001
MCP_IMAGE_SERVER_URL=http://localhost:4002
MCP_VIDEO_SERVER_URL=http://localhost:4003
MCP_VOICE_SERVER_URL=http://localhost:4004
MCP_ASSET_SERVER_URL=http://localhost:4005
MCP_TRANSPORT=sse  # or stdio

# OpenAI-Compatible API
OPENAI_COMPAT_ENABLED=true
OPENAI_COMPAT_BASE_URL=/v1
API_KEY_ENCRYPTION_SECRET=<secret>
RATE_LIMIT_TIER=pro  # free, pro, enterprise

# Render Network
RENDER_NETWORK_ENABLED=true
RENDER_NETWORK_API_KEY=<key>
RENDER_NETWORK_WALLET_ADDRESS=<address>
RENDER_NETWORK_WALLET_PRIVATE_KEY=<key>
RENDER_NETWORK_IPFS_GATEWAY=https://ipfs.io
RENDER_NETWORK_JOB_TIMEOUT_MS=3600000
RENDER_NETWORK_MIN_BALANCE_ALERT=100  # RNDR tokens
RENDER_NETWORK_AUTO_ROUTE_THRESHOLD=high  # low, medium, high
```

### Database Schema Changes
```sql
-- API Keys table
CREATE TABLE api_keys (
  id VARCHAR(36) PRIMARY KEY,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255),
  tier ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
  rate_limit_per_minute INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Render Network jobs table
CREATE TABLE render_network_jobs (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  render_job_id VARCHAR(255) NOT NULL,
  status ENUM('pending', 'submitted', 'rendering', 'completed', 'failed') DEFAULT 'pending',
  cost_rndr DECIMAL(18, 8),
  ipfs_input_hash VARCHAR(255),
  ipfs_output_hash VARCHAR(255),
  submitted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  error_message TEXT,
  metadata JSON
);

-- Usage tracking table
CREATE TABLE api_usage (
  id VARCHAR(36) PRIMARY KEY,
  api_key_id VARCHAR(36) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  tokens_used INT DEFAULT 0,
  cost_usd DECIMAL(10, 4),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Testing Strategy
- **Unit Tests**: Test each SDK method independently
- **Integration Tests**: Test MCP server communication
- **E2E Tests**: Test complete workflows (script → video)
- **Load Tests**: Verify performance under concurrent requests
- **Render Network Tests**: Test with small jobs first, then scale
- **API Compatibility Tests**: Validate OpenAI format compliance

### Documentation Requirements
- **Architecture Diagrams**: Show MCP server topology
- **API Reference**: Complete OpenAI-compatible API docs
- **SDK Guides**: How to use TypeScript/Python SDKs
- **Render Network Guide**: Setup and configuration
- **Migration Guide**: How to upgrade from v0.3.0
- **Cost Estimation Guide**: Render Network pricing examples

## Success Criteria
1. ✅ All MCP servers running independently with health checks
2. ✅ Workers successfully communicate via SDKs (no direct lib/ imports)
3. ✅ OpenAI-compatible endpoints pass compatibility tests
4. ✅ Third-party tools (e.g., LangChain) can integrate via OpenAI API
5. ✅ Render Network successfully processes at least one video job
6. ✅ Hybrid routing correctly chooses local vs. Render Network
7. ✅ Cost tracking accurately reflects Render Network usage
8. ✅ System maintains or improves current performance benchmarks
9. ✅ All existing features continue to work (backward compatibility)
10. ✅ Comprehensive documentation published

## Notes for GitHub Copilot
- **Preserve existing functionality**: Do not break current features
- **Follow TypeScript best practices**: Use strict typing, avoid `any`
- **Maintain code style**: Follow existing ESLint configuration
- **Use existing dependencies**: Prefer current packages (ai, zod, prisma)
- **Add new dependencies carefully**: Document why each is needed
- **Write self-documenting code**: Clear variable names, JSDoc comments
- **Handle errors gracefully**: Never let errors crash the server
- **Log important events**: Use existing logging infrastructure
- **Consider performance**: Optimize for video production workloads
- **Think about scale**: Design for multiple concurrent users/projects

---

This prompt provides comprehensive guidance for refactoring the waoowaoo platform without providing actual code implementation. It gives GitHub Copilot clear context about the current architecture and detailed requirements for the three major changes: MCP server architecture, OpenAI-compatible APIs, and Render Network integration.
---
Based on my analysis of the waoowaoo repository, here's a comprehensive prompt for GitHub Copilot to make the architectural changes:

---

## GitHub Copilot Prompt: Refactor waoowaoo to Lightweight MCP Architecture with OpenAI Compatibility and Render Network

### Context
The waoowaoo project is currently a monolithic Next.js application with integrated AI video production capabilities. We need to refactor it into a lightweight, modular architecture using Model Context Protocol (MCP) servers, add OpenAI-compatible API endpoints, and integrate with Render Network for distributed rendering.

### Current Architecture Overview
- **Stack**: Next.js (TypeScript), MySQL (Prisma), Redis (BullMQ), MinIO storage
- **Key Modules**: `src/lib/ai-runtime/`, `src/lib/image-generation/`, `src/lib/workflows/`, `src/lib/voice/`, `src/lib/storage/`
- **Existing**: `src/lib/model-gateway/openai-compat/` folder with partial OpenAI compatibility
- **Workers**: Background task processing with BullMQ queues

### Refactoring Goals

#### 1. **MCP Server Architecture (Lightweight & Modular)**
Extract monolithic `src/lib/` modules into standalone MCP servers:
- **Script Processing MCP Server**: Extract `src/lib/ai-runtime/` logic for script parsing, splitting, and AI agent execution
- **Image Generation MCP Server**: Extract `src/lib/image-generation/` for character/scene generation
- **Video Production MCP Server**: Extract `src/lib/workflows/` and video processing logic
- **Voice/Audio MCP Server**: Extract `src/lib/voice/` and `src/lib/lipsync/`
- **Asset Management MCP Server**: Extract `src/lib/storage/` and `src/lib/asset-utils/`

**MCP Server Requirements**:
- Implement JSON-RPC 2.0 protocol for inter-server communication
- Support stdio and SSE transport layers
- Expose tools/resources via standardized MCP protocol
- Include health check endpoints and service discovery
- Create lightweight TypeScript SDKs for each server with connection pooling, retry logic, streaming support, and Zod validation

**Infrastructure Changes**:
- Update `docker-compose.yml` to add separate services for each MCP server
- Refactor workers in `src/lib/workers/` to communicate with MCP servers via SDKs instead of direct imports
- Implement task routing logic to direct BullMQ tasks to appropriate MCP servers

#### 2. **OpenAI-Compatible API Format**
Expand the existing `src/lib/model-gateway/openai-compat/` implementation:

**Standard OpenAI Endpoints** (add to `src/app/api/v1/`):
- `/v1/chat/completions` - Chat completion with streaming support
- `/v1/completions` - Text completion
- `/v1/images/generations` - Image generation (leverage existing `image.ts`)
- `/v1/audio/speech` - Text-to-speech
- `/v1/audio/transcriptions` - Speech-to-text
- `/v1/embeddings` - Text embeddings
- `/v1/models` - List available models

**Custom waoowaoo Extensions** (following OpenAI format patterns):
- `/v1/videos/generations` - Video generation from scripts
- `/v1/videos/edits` - Video editing operations
- `/v1/storyboards/generations` - Storyboard creation
- `/v1/scenes/generations` - Scene generation
- `/v1/projects` - Project management

**Implementation Requirements**:
- Follow OpenAI's JSON schema for requests/responses
- Support Server-Sent Events (SSE) for streaming (leverage existing `src/app/api/sse/`)
- Implement OpenAI-compatible error codes and messages
- Add `x-waoowaoo-*` custom headers for extended functionality
- Create API key management system (generate, store securely, support multiple keys per user)
- Implement token-based rate limiting with tier-based limits
- Generate OpenAPI 3.0 specification with examples and Postman collection

#### 3. **Render Network Integration**
Add distributed rendering capabilities using Render Network:

**Core Integration**:
- Install Render Network SDK and configure authentication
- Implement wallet integration for RNDR token payments
- Create job submission abstraction layer that maps waoowaoo tasks to Render Network job formats
- Handle job lifecycle (submit, monitor, retrieve results)

**Hybrid Rendering Strategy**:
- Implement intelligent routing logic to decide between local processing vs. Render Network based on:
  - Job complexity and estimated render time
  - Current queue depth
  - Cost considerations
  - Urgency/priority
- Route heavy video rendering, batch image generation, 3D scenes, and long-duration processing to Render Network
- Implement fallback to local processing if Render Network unavailable

**Storage Integration**:
- Add IPFS support for asset transfer to/from Render Network
- Implement efficient asset caching strategy
- Support hybrid storage (existing MinIO/S3 + IPFS)
- Configure IPFS node and pinning service integration

**Cost Management**:
- Implement RNDR wallet balance checking and cost estimation
- Track usage and costs in database (add `render_network_jobs` table)
- Extend existing `BILLING_MODE` configuration to include Render Network costs
- Add automatic alerts for low balance
- Generate cost reports and analytics

**Monitoring**:
- Poll Render Network job status and update task status in database
- Implement webhooks for job completion notifications
- Add Render Network metrics to Bull Board dashboard
- Track performance metrics (render times, cost efficiency, quality)

### Environment Variables to Add
```
# MCP Servers
MCP_SCRIPT_SERVER_URL=http://localhost:3001
MCP_IMAGE_SERVER_URL=http://localhost:3002
MCP_VIDEO_SERVER_URL=http://localhost:3003
MCP_VOICE_SERVER_URL=http://localhost:3004
MCP_ASSET_SERVER_URL=http://localhost:3005
MCP_TRANSPORT=stdio|sse

# OpenAI Compatibility
OPENAI_COMPAT_ENABLED=true
OPENAI_COMPAT_BASE_URL=/api/v1
API_KEY_ENCRYPTION_SECRET=<secret>
RATE_LIMIT_TIER=free|pro|enterprise

# Render Network
RENDER_NETWORK_ENABLED=true
RENDER_NETWORK_API_KEY=<key>
RENDER_NETWORK_WALLET_ADDRESS=<address>
RENDER_NETWORK_WALLET_PRIVATE_KEY=<key>
RENDER_NETWORK_IPFS_GATEWAY=https://ipfs.io
RENDER_NETWORK_JOB_TIMEOUT_MS=3600000
RENDER_NETWORK_MIN_BALANCE_ALERT=100
RENDER_NETWORK_AUTO_ROUTE_THRESHOLD=high
```

### Database Schema Changes
Add new tables to Prisma schema:
- `api_keys` - Store OpenAI-compatible API keys with user association, scopes, rate limits
- `render_network_jobs` - Track Render Network job submissions, status, costs
- `api_usage` - Track API usage per key for rate limiting and billing

### Implementation Phases
**Phase 1**: Extract MCP servers, create SDKs, update workers and docker-compose
**Phase 2**: Implement OpenAI-compatible endpoints, API key management, rate limiting, documentation
**Phase 3**: Integrate Render Network SDK, implement hybrid routing, add IPFS storage, cost tracking, monitoring

### Code Organization Principles
- Maintain separation of concerns with clear interfaces
- Use dependency injection for MCP server clients
- Ensure backward compatibility with existing API endpoints
- Make all features configuration-driven (feature flags)
- Implement comprehensive error handling and retry logic
- Add observability (logging, metrics, tracing) throughout
- Write unit tests for SDKs, integration tests for MCP communication, E2E tests for workflows

### Success Criteria
- All MCP servers run independently and communicate via SDKs
- OpenAI-compatible endpoints pass compatibility tests with standard tools (Block Goose, etc.)
- Render Network successfully processes jobs with accurate cost tracking
- Hybrid routing intelligently distributes workload
- Performance maintained or improved vs. current architecture
- Backward compatibility preserved for existing API clients
- Comprehensive documentation for architecture, APIs, and SDKs

---

**Instructions for Copilot**: Please analyze the current codebase structure and generate a detailed implementation plan with file-by-file changes needed to achieve this refactoring. Focus on creating clean abstractions, maintaining type safety, and ensuring the system remains production-ready throughout the migration.
