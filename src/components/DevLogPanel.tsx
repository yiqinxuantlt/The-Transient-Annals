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
  debug:
    'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const snapshot = useSyncExternalStore(devLogger.subscribe, getSnapshot, getServerSnapshot)

  const newestEntries = useMemo(() => [...snapshot.entries].reverse(), [snapshot.entries])
  const filteredEntries = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()

    return newestEntries.filter((entry) => {
      const matchesFilter =
        filter === 'all' || entry.level === filter || entry.category === filter

      if (!matchesFilter) return false
      if (!trimmedQuery) return true

      return [entry.message, entry.source, entry.category, entry.route, entry.url].some((value) =>
        value.toLowerCase().includes(trimmedQuery),
      )
    })
  }, [filter, newestEntries, query])

  const selectedEntries = useMemo(
    () => snapshot.entries.filter((entry) => selectedIds.has(entry.id)),
    [selectedIds, snapshot.entries],
  )
  const warningCount = snapshot.entries.filter((entry) => entry.level === 'warn').length
  const errorCount = snapshot.entries.filter((entry) => entry.level === 'error').length

  const copyEntries = async (entries: DevLogEntry[], label: string) => {
    if (entries.length === 0) return

    try {
      await navigator.clipboard.writeText(stringifyLogs(entries))
      devLogger.event('DevLogPanel', `Copied ${label}`, {
        count: entries.length,
      })
    } catch (error) {
      devLogger.warn('DevLogPanel', `Failed to copy ${label}`, {
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const copyLogs = async () => {
    await copyEntries(snapshot.entries, 'all logs')
  }

  const toggleSelected = (entryId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }

      return next
    })
  }

  const downloadLogs = () => {
    try {
      const blob = new Blob([stringifyLogs(snapshot.entries)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `fushenglu-dev-logs-${new Date().toISOString()}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      devLogger.event('DevLogPanel', 'Downloaded logs', { count: snapshot.entries.length })
    } catch (error) {
      devLogger.warn('DevLogPanel', 'Failed to download logs', {
        message: error instanceof Error ? error.message : String(error),
      })
    }
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
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Bug className="h-4 w-4 shrink-0" />
              <span className="truncate">Development Logs</span>
              <span className="shrink-0 text-xs font-normal text-slate-500">
                {snapshot.entries.length}/{snapshot.meta.maxEntries}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={copyLogs}
                className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Copy all logs"
              >
                <Clipboard className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={downloadLogs}
                className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Download logs"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds(new Set())
                  devLogger.clear()
                }}
                className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Clear logs"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Close logs"
              >
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
            {selectedEntries.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <span className="font-medium">Selected {selectedEntries.length}</span>
                <button
                  type="button"
                  onClick={() => void copyEntries(selectedEntries, 'selected logs')}
                  className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  Copy selected
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="inline-flex items-center gap-1 rounded border border-transparent px-2 py-1 font-medium text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-950 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear selection
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <Search className="h-4 w-4 shrink-0" />
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
              <AlertTriangle className="h-4 w-4 shrink-0" />
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
                  const selected = selectedIds.has(entry.id)

                  return (
                    <article
                      key={entry.id}
                      className={clsx(
                        'rounded-md border p-3 text-sm',
                        levelClass[entry.level],
                        selected && 'ring-2 ring-slate-900/20 dark:ring-white/30',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelected(entry.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-400 text-slate-900 focus:ring-slate-500"
                          aria-label={`Select log ${entry.message}`}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : entry.id)}
                          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left"
                        >
                          <span className="min-w-0">
                            <span className="mr-2 font-mono text-xs uppercase">{entry.level}</span>
                            <span className="font-semibold">{entry.message}</span>
                            <span className="mt-1 block truncate text-xs opacity-75">
                              {formatTime(entry.timestamp)} / {entry.category} / {entry.source}
                            </span>
                          </span>
                          {expanded ? (
                            <ChevronUp className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyEntries([entry], 'single log')}
                          className="rounded p-1.5 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                          aria-label={`Copy log ${entry.message}`}
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                      </div>
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
