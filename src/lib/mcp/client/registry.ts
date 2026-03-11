/**
 * Service URL registry: resolves MCP service base URLs from environment
 * variables and exposes per-service health-check helpers.
 *
 * New MCP services should register their env-var key here so that the entire
 * codebase uses a single source-of-truth for service discovery.
 */

export type McpServiceName = 'script' | 'image' | 'video' | 'voice' | 'asset'

/** Mapping from service name to the environment variable that holds its URL. */
const SERVICE_URL_ENV: Record<McpServiceName, string> = {
  script: 'SCRIPT_MCP_URL',
  image: 'IMAGE_MCP_URL',
  video: 'VIDEO_MCP_URL',
  voice: 'VOICE_MCP_URL',
  asset: 'ASSET_MCP_URL',
}

/** Feature-flag env vars that must be `'true'` for HTTP mode to be active per service. */
const ENABLED_ENV: Record<McpServiceName, string> = {
  script: 'SCRIPT_MCP_ENABLED',
  image: 'IMAGE_MCP_ENABLED',
  video: 'VIDEO_MCP_ENABLED',
  voice: 'VOICE_MCP_ENABLED',
  asset: 'ASSET_MCP_ENABLED',
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

/**
 * Returns the base URL for the given MCP service, or `null` when the service
 * is not configured (env var absent or empty).
 */
export function resolveMcpServiceUrl(service: McpServiceName): string | null {
  const envKey = SERVICE_URL_ENV[service]
  const raw = process.env[envKey]
  if (!raw || !raw.trim()) return null
  return raw.trim().replace(/\/$/, '')
}

/**
 * Returns `true` when script MCP HTTP mode is enabled via feature flag AND the
 * script service URL is configured.  Workers should call this before deciding
 * whether to go through the HTTP client or fall back to in-process execution.
 */
export function isScriptMcpEnabled(): boolean {
  return process.env[ENABLED_ENV.script] === 'true' && resolveMcpServiceUrl('script') !== null
}

/**
 * Returns `true` when image MCP HTTP mode is enabled via feature flag AND the
 * image service URL is configured.
 */
export function isImageMcpEnabled(): boolean {
  return process.env[ENABLED_ENV.image] === 'true' && resolveMcpServiceUrl('image') !== null
}

/**
 * Returns `true` when asset MCP HTTP mode is enabled via feature flag AND the
 * asset service URL is configured.
 */
export function isAssetMcpEnabled(): boolean {
  return process.env[ENABLED_ENV.asset] === 'true' && resolveMcpServiceUrl('asset') !== null
}

// ---------------------------------------------------------------------------
// Health checks
// ---------------------------------------------------------------------------

export type McpHealthCheckResult = {
  service: McpServiceName
  url: string
  healthy: boolean
  status?: string
  error?: string
}

/** Ping a running MCP service's /health endpoint. */
export async function checkMcpServiceHealth(service: McpServiceName): Promise<McpHealthCheckResult> {
  const url = resolveMcpServiceUrl(service)
  if (!url) {
    return { service, url: '(not configured)', healthy: false, error: 'Service URL not configured' }
  }
  const healthUrl = `${url}/health`
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) })
    const body = await res.json() as { status?: string }
    return { service, url: healthUrl, healthy: res.ok && body.status === 'ok', status: body.status }
  } catch (error) {
    return {
      service,
      url: healthUrl,
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
