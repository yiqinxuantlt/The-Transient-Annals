# Development Logging and Bug Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a development-only structured logging and bug detection system with runtime capture, API diagnostics, Zustand action logs, and an in-browser debug panel.

**Architecture:** Add a focused `devLogger` module as the only diagnostics state holder and event bus. Initialize global capture once from `main.tsx`, instrument the existing API wrapper and selected store actions, and render a compact development-only panel from `App.tsx`.

**Tech Stack:** Vite, React 19, TypeScript, Zustand, Tailwind CSS, lucide-react.

---

## File Structure

- Create `src/lib/devLogger.ts`: structured log types, ring buffer, subscriptions, global capture, console capture, copy/download helpers, and future transport hook.
- Create `src/components/DevLogPanel.tsx`: development-only debug panel UI with filters, search, row details, clear, copy, and download actions.
- Modify `src/main.tsx`: initialize development diagnostics before rendering React.
- Modify `src/App.tsx`: render `DevLogPanel` only when `import.meta.env.DEV` is true.
- Modify `src/lib/fushengluApi.ts`: record API start, success, and failure logs inside `requestJson`.
- Modify `src/store/useFushengluStore.ts`: record selected state and domain events with ids and counts.

## Task 1: Logging Core

**Files:**
- Create: `src/lib/devLogger.ts`

- [ ] **Step 1: Create the logger module**

Add `src/lib/devLogger.ts` with bounded storage, subscriptions, typed methods, safe serialization, and global capture helpers.

```ts
export type DevLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type DevLogCategory = 'runtime' | 'console' | 'api' | 'state' | 'event' | 'ui'

export type DevLogDetails = Record<string, unknown> | string | number | boolean | null | undefined

export type DevLogEntry = {
  id: string
  timestamp: string
  level: DevLogLevel
  category: DevLogCategory
  source: string
  message: string
  details?: unknown
  stack?: string
  url: string
  route: string
}

export type DevLogInput = {
  level?: DevLogLevel
  category?: DevLogCategory
  source: string
  message: string
  details?: DevLogDetails
  stack?: string
}

type DevLogListener = (entries: DevLogEntry[], meta: DevLogMeta) => void
type DevLogTransport = (entry: DevLogEntry) => void

type DevLogMeta = {
  droppedCount: number
  maxEntries: number
}

const MAX_ENTRIES = 500
const listeners = new Set<DevLogListener>()
const transports = new Set<DevLogTransport>()
const entries: DevLogEntry[] = []
let droppedCount = 0
let initialized = false

const originalConsole = {
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

const isDev = () => Boolean(import.meta.env.DEV)

const getRoute = () => {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

const getUrl = () => {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

const safeSerialize = (value: DevLogDetails) => {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object') return value

  try {
    return JSON.parse(
      JSON.stringify(value, (_key, nestedValue: unknown) => {
        if (nestedValue instanceof Error) {
          return {
            name: nestedValue.name,
            message: nestedValue.message,
            stack: nestedValue.stack,
          }
        }
        return nestedValue
      }),
    ) as unknown
  } catch {
    return String(value)
  }
}

const errorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  return { value: String(error) }
}

const errorStack = (error: unknown) => (error instanceof Error ? error.stack : undefined)

const notify = () => {
  const snapshot = [...entries]
  const meta = { droppedCount, maxEntries: MAX_ENTRIES }
  listeners.forEach((listener) => listener(snapshot, meta))
}

const pushEntry = (entry: DevLogEntry) => {
  entries.push(entry)

  if (entries.length > MAX_ENTRIES) {
    entries.shift()
    droppedCount += 1
  }

  transports.forEach((transport) => {
    try {
      transport(entry)
    } catch (error) {
      originalConsole.warn('[devLogger] transport failed', error)
    }
  })

  notify()
}

export const devLogger = {
  log(input: DevLogInput) {
    if (!isDev()) return

    pushEntry({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.round(Math.random() * 100000)}`,
      timestamp: new Date().toISOString(),
      level: input.level || 'info',
      category: input.category || 'event',
      source: input.source,
      message: input.message,
      details: safeSerialize(input.details),
      stack: input.stack,
      url: getUrl(),
      route: getRoute(),
    })
  },
  debug(source: string, message: string, details?: DevLogDetails) {
    this.log({ level: 'debug', category: 'event', source, message, details })
  },
  info(source: string, message: string, details?: DevLogDetails) {
    this.log({ level: 'info', category: 'event', source, message, details })
  },
  warn(source: string, message: string, details?: DevLogDetails) {
    this.log({ level: 'warn', category: 'event', source, message, details })
  },
  error(source: string, message: string, details?: DevLogDetails, stack?: string) {
    this.log({ level: 'error', category: 'runtime', source, message, details, stack })
  },
  api(level: DevLogLevel, source: string, message: string, details?: DevLogDetails) {
    this.log({ level, category: 'api', source, message, details })
  },
  state(source: string, message: string, details?: DevLogDetails) {
    this.log({ level: 'info', category: 'state', source, message, details })
  },
  event(source: string, message: string, details?: DevLogDetails) {
    this.log({ level: 'info', category: 'event', source, message, details })
  },
  subscribe(listener: DevLogListener) {
    listeners.add(listener)
    listener([...entries], { droppedCount, maxEntries: MAX_ENTRIES })
    return () => listeners.delete(listener)
  },
  addTransport(transport: DevLogTransport) {
    transports.add(transport)
    return () => transports.delete(transport)
  },
  clear() {
    entries.splice(0, entries.length)
    droppedCount = 0
    notify()
  },
  getSnapshot() {
    return {
      entries: [...entries],
      meta: { droppedCount, maxEntries: MAX_ENTRIES },
    }
  },
}

export function initializeDevLogging() {
  if (!isDev() || initialized || typeof window === 'undefined') return
  initialized = true

  window.addEventListener('error', (event) => {
    devLogger.error(
      'window.error',
      event.message || 'Unhandled window error',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: errorDetails(event.error),
      },
      event.error instanceof Error ? event.error.stack : undefined,
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    devLogger.error(
      'window.unhandledrejection',
      'Unhandled promise rejection',
      errorDetails(event.reason),
      errorStack(event.reason),
    )
  })

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args)
    devLogger.log({
      level: 'warn',
      category: 'console',
      source: 'console.warn',
      message: args.map(String).join(' '),
      details: { args },
    })
  }

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args)
    const firstError = args.find((arg) => arg instanceof Error)
    devLogger.log({
      level: 'error',
      category: 'console',
      source: 'console.error',
      message: args.map(String).join(' '),
      details: { args },
      stack: errorStack(firstError),
    })
  }
}
```

- [ ] **Step 2: Run type checking through build**

Run: `npm run build`

Expected: if this is the only change, the build may still fail because the module is not wired in yet; TypeScript syntax errors in `src/lib/devLogger.ts` must be fixed before continuing.

- [ ] **Step 3: Commit logging core**

```bash
git add src/lib/devLogger.ts
git commit -m "Add development logger core"
```

## Task 2: Runtime and API Instrumentation

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/lib/fushengluApi.ts`

- [ ] **Step 1: Initialize logging in `src/main.tsx`**

Add the import and initialization before React renders:

```ts
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'reactflow/dist/style.css'
import './index.css'
import App from './App.tsx'
import { initializeDevLogging } from './lib/devLogger'

initializeDevLogging()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Add API diagnostics to `src/lib/fushengluApi.ts`**

Import `devLogger`, derive method and body size, and log request lifecycle inside `requestJson`.

```ts
import type { FushengProject } from '../types'
import { devLogger } from './devLogger'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4177/api'
const REQUEST_TIMEOUT = 2200

const getBodySize = (body?: BodyInit | null) => {
  if (!body) return 0
  if (typeof body === 'string') return body.length
  return undefined
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
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit runtime and API instrumentation**

```bash
git add src/main.tsx src/lib/fushengluApi.ts
git commit -m "Instrument runtime and API diagnostics"
```

## Task 3: Store Event Instrumentation

**Files:**
- Modify: `src/store/useFushengluStore.ts`

- [ ] **Step 1: Import logger and add small helpers**

Add the logger import near existing imports:

```ts
import { devLogger } from '../lib/devLogger'
```

Inside the `persist((set, get) => { ... })` callback, add helpers before `syncProject`:

```ts
      const logState = (message: string, details?: Record<string, unknown>) => {
        devLogger.state('useFushengluStore', message, details)
      }

      const logEvent = (message: string, details?: Record<string, unknown>) => {
        devLogger.event('useFushengluStore', message, details)
      }
```

- [ ] **Step 2: Instrument backend sync and hydration**

Update `syncProject` and `hydrateFromBackend` to log backend transitions:

```ts
      const syncProject = (project: FushengProject) => {
        void saveProjectToBackend(normalizeProject(project))
          .then(() => {
            logState('Backend sync succeeded', { projectId: project.id })
            set({ backendStatus: 'online' })
          })
          .catch((error) => {
            logState('Backend sync failed', {
              projectId: project.id,
              message: error instanceof Error ? error.message : String(error),
            })
            set({ backendStatus: 'offline' })
          })
      }
```

```ts
        hydrateFromBackend: async () => {
          logState('Backend hydration started')
          set({ backendStatus: 'checking' })
          try {
            const remoteProjects = await fetchProjectsFromBackend()
            const projects = mergeProjects(get().projects, remoteProjects)
            set({ projects, backendStatus: 'online' })
            logState('Backend hydration succeeded', {
              remoteProjectCount: remoteProjects.length,
              mergedProjectCount: projects.length,
            })
            projects.forEach(syncProject)
          } catch (error) {
            logState('Backend hydration failed', {
              message: error instanceof Error ? error.message : String(error),
            })
            set({ backendStatus: 'offline' })
          }
        },
```

- [ ] **Step 3: Instrument selected domain actions**

Add `logEvent` calls to create, update, delete, import, restore, and clear actions. Keep each details object small.

```ts
          logEvent('Project created', {
            projectId: id,
            templateId: draft.templateId,
            category: draft.category,
          })
```

```ts
          logEvent('Project metadata updated', { projectId, templateId: draft.templateId })
```

```ts
          logEvent('Project deleted', { projectId })
```

```ts
          logEvent('Entity created', { projectId, entityId: id })
```

```ts
          logEvent('Entity deleted', { projectId, entityId })
```

```ts
          logEvent('Event created', { projectId, eventId: id })
```

```ts
          logEvent('Event deleted', { projectId, eventId })
```

```ts
          logEvent('Entity relation created', { projectId, relationId: id })
```

```ts
          logEvent('Entity relation deleted', { projectId, relationId })
```

```ts
          logEvent('Event link created', { projectId, linkId: id })
```

```ts
          logEvent('Event link deleted', { projectId, linkId })
```

```ts
          logEvent('Library item created', { projectId, itemId: id, kind: draft.kind })
```

```ts
          logEvent('Library item deleted', { projectId, itemId })
```

```ts
          logEvent('Project data replaced', {
            projectId,
            entityCount: importedProject.entities?.length || 0,
            eventCount: importedProject.events?.length || 0,
          })
```

```ts
          logEvent('Sample data restored', { projectId })
```

```ts
          logEvent('Project data cleared', { projectId })
```

Do not log node position updates in this task because dragging can flood the log buffer.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit store instrumentation**

```bash
git add src/store/useFushengluStore.ts
git commit -m "Log development store events"
```

## Task 4: Debug Panel UI

**Files:**
- Create: `src/components/DevLogPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `DevLogPanel`**

Create a compact fixed panel that subscribes to `devLogger`, filters logs, supports search, expands rows, clears logs, copies JSON, and downloads JSON.

```tsx
import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { devLogger, type DevLogCategory, type DevLogEntry } from '../lib/devLogger'

type FilterKey = 'all' | 'error' | 'warn' | DevLogCategory

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'error', label: 'Errors' },
  { key: 'warn', label: 'Warnings' },
  { key: 'api', label: 'API' },
  { key: 'state', label: 'State' },
  { key: 'event', label: 'Events' },
]

const levelClass: Record<DevLogEntry['level'], string> = {
  debug: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  info: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
  warn: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100',
  error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100',
}

const getSnapshot = () => devLogger.getSnapshot()
const getServerSnapshot = () => devLogger.getSnapshot()

const formatTime = (timestamp: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))

const stringifyLogs = (entries: DevLogEntry[]) => JSON.stringify(entries, null, 2)

export function DevLogPanel() {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const snapshot = useSyncExternalStore(devLogger.subscribe, getSnapshot, getServerSnapshot)

  const newestEntries = useMemo(() => [...snapshot.entries].reverse(), [snapshot.entries])
  const filteredEntries = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()

    return newestEntries.filter((entry) => {
      const matchesFilter =
        filter === 'all' ||
        entry.level === filter ||
        entry.category === filter

      if (!matchesFilter) return false
      if (!trimmedQuery) return true

      return [
        entry.message,
        entry.source,
        entry.category,
        entry.route,
        entry.url,
      ].some((value) => value.toLowerCase().includes(trimmedQuery))
    })
  }, [filter, newestEntries, query])

  const warningCount = snapshot.entries.filter((entry) => entry.level === 'warn').length
  const errorCount = snapshot.entries.filter((entry) => entry.level === 'error').length

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(stringifyLogs(snapshot.entries))
      devLogger.event('DevLogPanel', 'Copied logs to clipboard', {
        count: snapshot.entries.length,
      })
    } catch (error) {
      devLogger.warn('DevLogPanel', 'Failed to copy logs', {
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const downloadLogs = () => {
    const blob = new Blob([stringifyLogs(snapshot.entries)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `fushenglu-dev-logs-${new Date().toISOString()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-4 right-4 z-[1000] max-w-[calc(100vw-2rem)] font-sans">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-lg transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          aria-label="Open development log panel"
        >
          <Bug className="h-4 w-4" />
          <span>Dev Logs</span>
          {(warningCount > 0 || errorCount > 0) && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
              {errorCount} / {warningCount}
            </span>
          )}
        </button>
      ) : (
        <section className="flex h-[min(34rem,calc(100vh-2rem))] w-[min(44rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Bug className="h-4 w-4" />
              <span>Development Logs</span>
              <span className="text-xs font-normal text-slate-500">
                {snapshot.entries.length}/{snapshot.meta.maxEntries}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={copyLogs} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Copy logs">
                <Clipboard className="h-4 w-4" />
              </button>
              <button type="button" onClick={downloadLogs} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Download logs">
                <Download className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => devLogger.clear()} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Clear logs">
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Close logs">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="border-b border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-2 flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={clsx(
                    'rounded-md border px-2.5 py-1 text-xs font-medium',
                    filter === item.key
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
                aria-label="Search logs"
              />
            </label>
          </div>
          {snapshot.meta.droppedCount > 0 && (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              <span>{snapshot.meta.droppedCount} older logs were dropped.</span>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {filteredEntries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No matching logs.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => {
                  const expanded = expandedId === entry.id
                  return (
                    <article key={entry.id} className={clsx('rounded-md border p-3 text-sm', levelClass[entry.level])}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : entry.id)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="mr-2 font-mono text-xs uppercase">{entry.level}</span>
                          <span className="font-semibold">{entry.message}</span>
                          <span className="mt-1 block truncate text-xs opacity-75">
                            {formatTime(entry.timestamp)} / {entry.category} / {entry.source}
                          </span>
                        </span>
                        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </button>
                      {expanded && (
                        <pre className="mt-3 max-h-64 overflow-auto rounded bg-black/5 p-3 text-xs leading-relaxed dark:bg-white/10">
                          {JSON.stringify(entry, null, 2)}
                        </pre>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Render the panel from `src/App.tsx`**

Import and render the panel beside the router provider.

```tsx
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { DevLogPanel } from './components/DevLogPanel'
import { router } from './routes/router'
import { useFushengluStore } from './store/useFushengluStore'

function App() {
  const theme = useFushengluStore((state) => state.theme)
  const hydrateFromBackend = useFushengluStore((state) => state.hydrateFromBackend)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    void hydrateFromBackend()
  }, [hydrateFromBackend])

  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV ? <DevLogPanel /> : null}
    </>
  )
}

export default App
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit debug panel**

```bash
git add src/components/DevLogPanel.tsx src/App.tsx
git commit -m "Add development log panel"
```

## Task 5: Verification and Cleanup

**Files:**
- Review: `src/lib/devLogger.ts`
- Review: `src/components/DevLogPanel.tsx`
- Review: `src/lib/fushengluApi.ts`
- Review: `src/store/useFushengluStore.ts`

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Run development server**

Run: `npm run dev`

Expected: Vite frontend and Express API both start. The frontend URL is printed in the terminal.

- [ ] **Step 4: Manually verify the panel**

Open the frontend URL and verify:

- The collapsed `Dev Logs` button appears in development.
- Creating a project adds event/state logs.
- API calls show start and success logs.
- Stopping the API and refreshing shows failed API logs.
- Running `console.error(new Error('test'))` in browser devtools shows the error in the browser console and in the panel.
- Clear, copy, and download buttons work.

- [ ] **Step 5: Final commit if verification fixes were needed**

If verification required changes, commit those exact files:

```bash
git add src/lib/devLogger.ts src/components/DevLogPanel.tsx src/main.tsx src/App.tsx src/lib/fushengluApi.ts src/store/useFushengluStore.ts
git commit -m "Polish development diagnostics"
```

If no verification fixes were needed, do not create an empty commit.
