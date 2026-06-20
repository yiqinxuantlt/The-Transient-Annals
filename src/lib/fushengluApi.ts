import type { FushengProject } from '../types'
import { devLogger } from './devLogger'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4177/api'
const REQUEST_TIMEOUT = 2200

type BackendWriteOptions = {
  backupReason?: string
}

const getBodySize = (body?: BodyInit | null) => {
  if (!body) return 0
  if (typeof body === 'string') return body.length
  return undefined
}

function backupHeaders(options?: BackendWriteOptions): Record<string, string> {
  return options?.backupReason
    ? { 'X-Fushenglu-Backup-Reason': options.backupReason }
    : {}
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  const method = init?.method || 'GET'
  const startedAt = performance.now()

  devLogger.api('debug', 'fushengluApi', 'API request started', {
    method,
    path,
    timeout: REQUEST_TIMEOUT,
    bodySize: getBodySize(init?.body),
  })

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
    const durationMs = Math.round(performance.now() - startedAt)

    if (!response.ok) {
      devLogger.api('error', 'fushengluApi', 'API request failed', {
        method,
        path,
        status: response.status,
        durationMs,
      })
      throw new Error(`API ${response.status}`)
    }

    devLogger.api('info', 'fushengluApi', 'API request succeeded', {
      method,
      path,
      status: response.status,
      durationMs,
    })

    return (await response.json()) as T
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt)
    devLogger.api('error', 'fushengluApi', 'API request threw', {
      method,
      path,
      durationMs,
      aborted: controller.signal.aborted,
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function fetchProjectsFromBackend() {
  const payload = await requestJson<{ projects: FushengProject[] }>('/projects')
  return payload.projects
}

export async function saveProjectToBackend(
  project: FushengProject,
  options?: BackendWriteOptions,
) {
  const payload = await requestJson<{ project: FushengProject }>(
    `/projects/${encodeURIComponent(project.id)}`,
    {
      method: 'PUT',
      headers: backupHeaders(options),
      body: JSON.stringify(project),
    },
  )

  return payload.project
}

export async function deleteProjectFromBackend(
  projectId: string,
  options?: BackendWriteOptions,
) {
  await requestJson<{ ok: true }>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    headers: backupHeaders(options),
  })
}
