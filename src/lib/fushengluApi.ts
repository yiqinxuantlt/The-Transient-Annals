import type { FushengProject } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4177/api'
const REQUEST_TIMEOUT = 2200

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API ${response.status}`)
    }

    return (await response.json()) as T
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function fetchProjectsFromBackend() {
  const payload = await requestJson<{ projects: FushengProject[] }>('/projects')
  return payload.projects
}

export async function saveProjectToBackend(project: FushengProject) {
  const payload = await requestJson<{ project: FushengProject }>(
    `/projects/${encodeURIComponent(project.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(project),
    },
  )

  return payload.project
}

export async function deleteProjectFromBackend(projectId: string) {
  await requestJson<{ ok: true }>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  })
}
