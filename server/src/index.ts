import type { Server } from 'node:http'
import { pathToFileURL } from 'node:url'
import { createFushengluApp } from './app.ts'

export type FushengluApiOptions = {
  host?: string
  port?: number
}

export type StartedFushengluApi = {
  host: string
  port: number
  url: string
  server: Server
  close: () => Promise<void>
}

function resolvePort(port?: number) {
  return port ?? Number(process.env.FUSHENGLU_API_PORT || 4177)
}

function resolveHost(host?: string) {
  return host ?? (process.env.FUSHENGLU_API_HOST || '127.0.0.1')
}

export async function startFushengluApi(
  options: FushengluApiOptions = {},
): Promise<StartedFushengluApi> {
  const host = resolveHost(options.host)
  const requestedPort = resolvePort(options.port)
  const app = createFushengluApp()

  const server = await new Promise<Server>((resolve, reject) => {
    const startedServer = app.listen(requestedPort, host)
    startedServer.once('listening', () => resolve(startedServer))
    startedServer.once('error', reject)
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : requestedPort

  return {
    host,
    port,
    url: `http://${host}:${port}`,
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      }),
  }
}

function isDirectRun() {
  const entry = process.argv[1]
  return Boolean(entry && import.meta.url === pathToFileURL(entry).href)
}

if (isDirectRun()) {
  startFushengluApi()
    .then((api) => {
      console.log(`Fushenglu API ready at ${api.url}`)
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exitCode = 1
    })
}
