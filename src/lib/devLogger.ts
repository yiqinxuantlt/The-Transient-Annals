export type DevLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type DevLogCategory = 'runtime' | 'console' | 'api' | 'state' | 'event' | 'ui'

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
  details?: unknown
  stack?: string
}

export type DevLogMeta = {
  droppedCount: number
  maxEntries: number
}

export type DevLogSnapshot = {
  entries: DevLogEntry[]
  meta: DevLogMeta
}

type DevLogListener = () => void
type DevLogTransport = (entry: DevLogEntry) => void

const MAX_ENTRIES = 500
const listeners = new Set<DevLogListener>()
const transports = new Set<DevLogTransport>()
const entries: DevLogEntry[] = []

let droppedCount = 0
let initialized = false
let snapshot: DevLogSnapshot = {
  entries: [],
  meta: {
    droppedCount: 0,
    maxEntries: MAX_ENTRIES,
  },
}

const originalConsole = {
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

const isDev = () => Boolean(import.meta.env.DEV)

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.round(Math.random() * 100000)}`
}

const getRoute = () => {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

const getUrl = () => {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return { value: String(error) }
}

const getStack = (value: unknown) => (value instanceof Error ? value.stack : undefined)

const safeSerialize = (value: unknown) => {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object') return value

  try {
    return JSON.parse(
      JSON.stringify(value, (_key, nestedValue: unknown) => {
        if (nestedValue instanceof Error) return normalizeError(nestedValue)
        if (typeof nestedValue === 'function') return `[Function ${nestedValue.name || 'anonymous'}]`
        return nestedValue
      }),
    ) as unknown
  } catch {
    return String(value)
  }
}

const rebuildSnapshot = () => {
  snapshot = {
    entries: [...entries],
    meta: {
      droppedCount,
      maxEntries: MAX_ENTRIES,
    },
  }
}

const notify = () => {
  rebuildSnapshot()
  listeners.forEach((listener) => listener())
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
      id: createId(),
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

  debug(source: string, message: string, details?: unknown) {
    this.log({ level: 'debug', category: 'event', source, message, details })
  },

  info(source: string, message: string, details?: unknown) {
    this.log({ level: 'info', category: 'event', source, message, details })
  },

  warn(source: string, message: string, details?: unknown) {
    this.log({ level: 'warn', category: 'event', source, message, details })
  },

  error(source: string, message: string, details?: unknown, stack?: string) {
    this.log({ level: 'error', category: 'runtime', source, message, details, stack })
  },

  api(level: DevLogLevel, source: string, message: string, details?: unknown) {
    this.log({ level, category: 'api', source, message, details })
  },

  state(source: string, message: string, details?: unknown) {
    this.log({ level: 'info', category: 'state', source, message, details })
  },

  event(source: string, message: string, details?: unknown) {
    this.log({ level: 'info', category: 'event', source, message, details })
  },

  subscribe(listener: DevLogListener) {
    listeners.add(listener)
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
    return snapshot
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
        error: normalizeError(event.error),
      },
      getStack(event.error),
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    devLogger.error(
      'window.unhandledrejection',
      'Unhandled promise rejection',
      normalizeError(event.reason),
      getStack(event.reason),
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
      stack: getStack(firstError),
    })
  }
}
