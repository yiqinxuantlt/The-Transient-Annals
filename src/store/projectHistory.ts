import type { FushengProject } from '../types'

export const HISTORY_LIMIT = 50
export const DEFAULT_MERGE_WINDOW_MS = 1200

export type ProjectSaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

export type ProjectSaveStatus = {
  state: ProjectSaveState
  lastSavedAt?: string
  errorMessage?: string
}

export type ProjectHistoryEntry = {
  projectId: string
  label: string
  before: FushengProject
  after: FushengProject
  mergeKey?: string
  timestamp: number
}

export type ProjectHistoryStacks = Record<string, ProjectHistoryEntry[]>

export type ProjectHistoryPushResult = {
  undoStacksByProjectId: ProjectHistoryStacks
  redoStacksByProjectId: ProjectHistoryStacks
}

export type ProjectHistoryMoveResult = ProjectHistoryPushResult & {
  entry?: ProjectHistoryEntry
}

export function cloneProjectSnapshot(project: FushengProject): FushengProject {
  return JSON.parse(JSON.stringify(project)) as FushengProject
}

export function makeHistoryEntry(
  before: FushengProject,
  after: FushengProject,
  options: { label: string; mergeKey?: string; timestamp?: number },
): ProjectHistoryEntry {
  return {
    projectId: after.id,
    label: options.label,
    before: cloneProjectSnapshot(before),
    after: cloneProjectSnapshot(after),
    mergeKey: options.mergeKey,
    timestamp: options.timestamp ?? Date.now(),
  }
}

export function pushHistoryEntry(
  undoStacksByProjectId: ProjectHistoryStacks,
  redoStacksByProjectId: ProjectHistoryStacks,
  entry: ProjectHistoryEntry,
  mergeWindowMs = DEFAULT_MERGE_WINDOW_MS,
): ProjectHistoryPushResult {
  const currentStack = undoStacksByProjectId[entry.projectId] ?? []
  const previous = currentStack[currentStack.length - 1]
  const shouldMerge =
    Boolean(entry.mergeKey) &&
    previous?.mergeKey === entry.mergeKey &&
    entry.timestamp - previous.timestamp <= mergeWindowMs
  const mergedEntry =
    shouldMerge && previous
      ? {
          ...previous,
          label: entry.label,
          after: cloneProjectSnapshot(entry.after),
          timestamp: entry.timestamp,
        }
      : entry
  const nextStack = shouldMerge
    ? [...currentStack.slice(0, -1), mergedEntry]
    : [...currentStack, mergedEntry]
  const cappedStack = nextStack.slice(-HISTORY_LIMIT)

  return {
    undoStacksByProjectId: {
      ...undoStacksByProjectId,
      [entry.projectId]: cappedStack,
    },
    redoStacksByProjectId: {
      ...redoStacksByProjectId,
      [entry.projectId]: [],
    },
  }
}

export function moveUndoToRedo(
  undoStacksByProjectId: ProjectHistoryStacks,
  redoStacksByProjectId: ProjectHistoryStacks,
  projectId: string,
): ProjectHistoryMoveResult {
  const undoStack = undoStacksByProjectId[projectId] ?? []
  const entry = undoStack[undoStack.length - 1]
  if (!entry) {
    return { undoStacksByProjectId, redoStacksByProjectId }
  }

  return {
    entry,
    undoStacksByProjectId: {
      ...undoStacksByProjectId,
      [projectId]: undoStack.slice(0, -1),
    },
    redoStacksByProjectId: {
      ...redoStacksByProjectId,
      [projectId]: [...(redoStacksByProjectId[projectId] ?? []), entry],
    },
  }
}

export function moveRedoToUndo(
  undoStacksByProjectId: ProjectHistoryStacks,
  redoStacksByProjectId: ProjectHistoryStacks,
  projectId: string,
): ProjectHistoryMoveResult {
  const redoStack = redoStacksByProjectId[projectId] ?? []
  const entry = redoStack[redoStack.length - 1]
  if (!entry) {
    return { undoStacksByProjectId, redoStacksByProjectId }
  }

  return {
    entry,
    undoStacksByProjectId: {
      ...undoStacksByProjectId,
      [projectId]: [...(undoStacksByProjectId[projectId] ?? []), entry].slice(-HISTORY_LIMIT),
    },
    redoStacksByProjectId: {
      ...redoStacksByProjectId,
      [projectId]: redoStack.slice(0, -1),
    },
  }
}

export function classifySaveError(error: unknown): Exclude<ProjectSaveState, 'idle' | 'saving' | 'saved'> {
  const message = error instanceof Error ? error.message : String(error)
  return /failed to fetch|network|load failed|connection|offline/i.test(message) ? 'offline' : 'error'
}

export function savingStatus(): ProjectSaveStatus {
  return { state: 'saving' }
}

export function savedStatus(timestamp = new Date().toISOString()): ProjectSaveStatus {
  return { state: 'saved', lastSavedAt: timestamp }
}

export function failedSaveStatus(error: unknown): ProjectSaveStatus {
  const message = error instanceof Error ? error.message : String(error)
  return {
    state: classifySaveError(error),
    errorMessage: message,
  }
}
