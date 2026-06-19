import { afterEach, describe, expect, it } from 'vitest'
import { startFushengluApi, type StartedFushengluApi } from './index.ts'

let startedApi: StartedFushengluApi | null = null

afterEach(async () => {
  if (!startedApi) return
  await startedApi.close()
  startedApi = null
})

describe('startFushengluApi', () => {
  it('starts the API on a requested host and closes cleanly', async () => {
    startedApi = await startFushengluApi({ host: '127.0.0.1', port: 0 })

    expect(startedApi.host).toBe('127.0.0.1')
    expect(startedApi.port).toBeGreaterThan(0)
    expect(startedApi.url).toBe(`http://127.0.0.1:${startedApi.port}`)

    const response = await fetch(`${startedApi.url}/api/health`)
    const payload = (await response.json()) as { ok: boolean; name: string }

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      ok: true,
      name: 'fushenglu-api',
    })
  })
})
