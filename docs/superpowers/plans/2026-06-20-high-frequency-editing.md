# High Frequency Editing Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add project-level undo/redo, visible save status, current-project search, and graph layout views for high-frequency editing in Fushenglu.

**Architecture:** Keep the current React + Zustand + React Flow structure. Add focused pure helpers for project history, search, and layout calculation, then wire them through the existing `commitProject`, `ProjectLayout`, and `GraphWorkbench` surfaces.

**Tech Stack:** React 19, React Router 7, React Flow 11, Zustand 5, TypeScript 6, Vite 8, Vitest 4, lucide-react, dagre.

---

## File Structure

- Create `src/store/projectHistory.ts`: pure history stack, merge, save-status, and sync-error classification helpers.
- Create `src/store/projectHistory.test.ts`: unit tests for history push, merge, cap, undo/redo stack movement, and save-status classification.
- Modify `src/store/useFushengluStore.ts`: add project history state, save status state, undo/redo actions, history options on `commitProject`, action labels, and merge keys.
- Modify `src/store/useFushengluStore.test.ts`: add store-level coverage for undo/redo, redo clearing, project isolation, save state, and skip-history behavior.
- Create `src/lib/projectSearch.ts`: pure current-project search across entities, events, relations, library items, and analysis notes.
- Create `src/lib/projectSearch.test.ts`: unit tests for grouped search results, empty query behavior, Chinese substring matching, case-insensitive matching, result caps, and navigation targets.
- Create `src/components/GlobalSearchDialog.tsx`: command-panel style search dialog for the current project.
- Create `src/components/SaveStatusBadge.tsx`: compact project save status indicator.
- Modify `src/layouts/ProjectLayout.tsx`: replace passive search input with search launcher, add undo/redo buttons, add save status badge, and register keyboard shortcuts.
- Create `src/lib/graphLayoutViews.ts`: pure graph layout-view calculations for free, relationship, timeline, and evidence views.
- Create `src/lib/graphLayoutViews.test.ts`: unit tests for deterministic layout positions and graceful empty graph output.
- Modify `src/components/GraphCanvas.tsx`: support preview position overrides without writing them to project data.
- Modify `src/components/GraphToolbar.tsx`: add layout-view selector and apply-layout control.
- Modify `src/components/GraphWorkbench.tsx`: compute layout previews, apply layout positions through existing batch update callbacks, and keep one undo record per applied layout.
- Modify `src/pages/RelationGraphPage.tsx` and `src/pages/EventGraphPage.tsx`: pass project-aware batch layout callbacks with history labels when needed.

## Task 1: Add Pure Project History Helpers

**Files:**
- Create: `src/store/projectHistory.ts`
- Create: `src/store/projectHistory.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `src/store/projectHistory.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createFictionSampleProject } from '../data/sampleData'
import { normalizeProjectForStorage } from '../shared/projectNormalization'
import {
  HISTORY_LIMIT,
  classifySaveError,
  makeHistoryEntry,
  moveRedoToUndo,
  moveUndoToRedo,
  pushHistoryEntry,
} from './projectHistory'

const makeProject = (id: string, title = id) =>
  normalizeProjectForStorage({
    ...createFictionSampleProject(id),
    title,
  })

describe('project history helpers', () => {
  it('pushes history entries and clears redo entries for the edited project', () => {
    const before = makeProject('project-history', 'Before')
    const after = makeProject('project-history', 'After')
    const entry = makeHistoryEntry(before, after, {
      label: 'Update project title',
      timestamp: 1000,
    })

    const result = pushHistoryEntry(
      {},
      { 'project-history': [entry] },
      entry,
    )

    expect(result.undoStacksByProjectId['project-history']).toEqual([entry])
    expect(result.redoStacksByProjectId['project-history']).toEqual([])
  })

  it('merges entries with the same merge key inside the merge window', () => {
    const first = makeHistoryEntry(makeProject('project-merge', 'A'), makeProject('project-merge', 'B'), {
      label: 'Move node',
      mergeKey: 'entity-position:e1',
      timestamp: 1000,
    })
    const second = makeHistoryEntry(makeProject('project-merge', 'B'), makeProject('project-merge', 'C'), {
      label: 'Move node',
      mergeKey: 'entity-position:e1',
      timestamp: 1800,
    })

    const result = pushHistoryEntry(
      { 'project-merge': [first] },
      {},
      second,
      1200,
    )

    expect(result.undoStacksByProjectId['project-merge']).toHaveLength(1)
    expect(result.undoStacksByProjectId['project-merge']?.[0]?.before.title).toBe('A')
    expect(result.undoStacksByProjectId['project-merge']?.[0]?.after.title).toBe('C')
  })

  it('caps each project undo stack to the most recent history limit', () => {
    const entries = Array.from({ length: HISTORY_LIMIT + 3 }, (_, index) =>
      makeHistoryEntry(makeProject('project-cap', `Before ${index}`), makeProject('project-cap', `After ${index}`), {
        label: `Edit ${index}`,
        timestamp: index,
      }),
    )

    const result = entries.reduce(
      (state, entry) =>
        pushHistoryEntry(state.undoStacksByProjectId, state.redoStacksByProjectId, entry),
      { undoStacksByProjectId: {}, redoStacksByProjectId: {} },
    )

    expect(result.undoStacksByProjectId['project-cap']).toHaveLength(HISTORY_LIMIT)
    expect(result.undoStacksByProjectId['project-cap']?.[0]?.label).toBe('Edit 3')
  })

  it('moves the latest undo entry to redo and the latest redo entry back to undo', () => {
    const first = makeHistoryEntry(makeProject('project-move', 'A'), makeProject('project-move', 'B'), {
      label: 'First edit',
      timestamp: 1000,
    })
    const second = makeHistoryEntry(makeProject('project-move', 'B'), makeProject('project-move', 'C'), {
      label: 'Second edit',
      timestamp: 2000,
    })

    const undone = moveUndoToRedo({ 'project-move': [first, second] }, {}, 'project-move')

    expect(undone.entry?.label).toBe('Second edit')
    expect(undone.undoStacksByProjectId['project-move']).toEqual([first])
    expect(undone.redoStacksByProjectId['project-move']).toEqual([second])

    const redone = moveRedoToUndo(
      undone.undoStacksByProjectId,
      undone.redoStacksByProjectId,
      'project-move',
    )

    expect(redone.entry?.label).toBe('Second edit')
    expect(redone.undoStacksByProjectId['project-move']).toEqual([first, second])
    expect(redone.redoStacksByProjectId['project-move']).toEqual([])
  })

  it('classifies network-like save errors as offline and other failures as error', () => {
    expect(classifySaveError(new TypeError('Failed to fetch'))).toBe('offline')
    expect(classifySaveError(new Error('HTTP 500 while saving project'))).toBe('error')
  })
})
```

- [ ] **Step 2: Run the helper tests and verify they fail**

Run:

```powershell
npm test -- src/store/projectHistory.test.ts
```

Expected: FAIL because `src/store/projectHistory.ts` does not exist.

- [ ] **Step 3: Implement the helper module**

Create `src/store/projectHistory.ts`:

```ts
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
```

- [ ] **Step 4: Run the helper tests and verify they pass**

Run:

```powershell
npm test -- src/store/projectHistory.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the helper module**

Run:

```powershell
git add src/store/projectHistory.ts src/store/projectHistory.test.ts
git commit -m "feat: add project history helpers"
```

## Task 2: Wire History And Save Status Into The Store

**Files:**
- Modify: `src/store/useFushengluStore.ts`
- Modify: `src/store/useFushengluStore.test.ts`

- [ ] **Step 1: Add failing store tests for undo, redo, merge, and save state**

Append these tests inside `src/store/useFushengluStore.test.ts`, after the existing `analysis note store actions` describe block:

```ts
describe('project history and save status', () => {
  it('undoes and redoes project edits through the store', async () => {
    const project = makeStoreProject('project-history-store')
    setStoreProject(project)

    useFushengluStore.getState().updateProjectMeta(project.id, {
      title: 'Updated title',
      subtitle: project.subtitle,
      category: project.category,
      templateId: project.templateId,
    })

    expect(useFushengluStore.getState().projects[0]?.title).toBe('Updated title')
    expect(useFushengluStore.getState().canUndoProject(project.id)).toBe(true)

    useFushengluStore.getState().undoProject(project.id)
    expect(useFushengluStore.getState().projects[0]?.title).toBe(project.title)
    expect(useFushengluStore.getState().canRedoProject(project.id)).toBe(true)

    useFushengluStore.getState().redoProject(project.id)
    expect(useFushengluStore.getState().projects[0]?.title).toBe('Updated title')

    await vi.waitFor(() =>
      expect(useFushengluStore.getState().saveStatusByProjectId[project.id]?.state).toBe('saved'),
    )
  })

  it('clears redo history when a new edit happens after undo', () => {
    const project = makeStoreProject('project-redo-clear')
    setStoreProject(project)

    useFushengluStore.getState().updateProjectMeta(project.id, {
      title: 'First edit',
      subtitle: project.subtitle,
      category: project.category,
      templateId: project.templateId,
    })
    useFushengluStore.getState().undoProject(project.id)
    useFushengluStore.getState().updateProjectMeta(project.id, {
      title: 'Second edit',
      subtitle: project.subtitle,
      category: project.category,
      templateId: project.templateId,
    })

    expect(useFushengluStore.getState().canRedoProject(project.id)).toBe(false)
  })

  it('keeps history isolated per project', () => {
    const first = makeStoreProject('project-history-first')
    const second = makeStoreProject('project-history-second')
    useFushengluStore.setState({
      projects: [first, second],
      theme: 'light',
      sidebarCollapsed: false,
      sidebarWidth: 288,
      backendStatus: 'offline',
      undoStacksByProjectId: {},
      redoStacksByProjectId: {},
      saveStatusByProjectId: {},
    })

    useFushengluStore.getState().updateProjectMeta(second.id, {
      title: 'Second changed',
      subtitle: second.subtitle,
      category: second.category,
      templateId: second.templateId,
    })

    expect(useFushengluStore.getState().canUndoProject(first.id)).toBe(false)
    expect(useFushengluStore.getState().canUndoProject(second.id)).toBe(true)
  })

  it('merges repeated node position updates into one undo entry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T00:00:00.000Z'))
    const project = makeStoreProject('project-position-merge')
    const entity = project.entities[0]
    if (!entity) throw new Error('Expected sample entity')
    setStoreProject(project)

    useFushengluStore.getState().updateEntityNodePosition(project.id, entity.id, { x: 10, y: 20 })
    vi.setSystemTime(new Date('2026-06-20T00:00:00.600Z'))
    useFushengluStore.getState().updateEntityNodePosition(project.id, entity.id, { x: 30, y: 40 })

    expect(useFushengluStore.getState().undoStacksByProjectId[project.id]).toHaveLength(1)

    useFushengluStore.getState().undoProject(project.id)
    expect(useFushengluStore.getState().projects[0]?.entityNodePositions[entity.id]).toBeUndefined()
  })

  it('classifies rejected saves as error while keeping history usable', async () => {
    vi.mocked(saveProjectToBackend).mockRejectedValueOnce(new Error('HTTP 500 while saving project'))
    const project = makeStoreProject('project-save-error')
    setStoreProject(project)

    useFushengluStore.getState().updateProjectMeta(project.id, {
      title: 'Will fail',
      subtitle: project.subtitle,
      category: project.category,
      templateId: project.templateId,
    })

    await vi.waitFor(() =>
      expect(useFushengluStore.getState().saveStatusByProjectId[project.id]?.state).toBe('error'),
    )
    expect(useFushengluStore.getState().canUndoProject(project.id)).toBe(true)
  })

  it('classifies network saves as offline', async () => {
    vi.mocked(saveProjectToBackend).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const project = makeStoreProject('project-save-offline')
    setStoreProject(project)

    useFushengluStore.getState().updateProjectMeta(project.id, {
      title: 'Offline edit',
      subtitle: project.subtitle,
      category: project.category,
      templateId: project.templateId,
    })

    await vi.waitFor(() =>
      expect(useFushengluStore.getState().saveStatusByProjectId[project.id]?.state).toBe('offline'),
    )
  })
})
```

Also update `setStoreProject` and `beforeEach` state setup in the same test file to include the new non-persisted fields:

```ts
undoStacksByProjectId: {},
redoStacksByProjectId: {},
saveStatusByProjectId: {},
```

- [ ] **Step 2: Run the store tests and verify they fail**

Run:

```powershell
npm test -- src/store/useFushengluStore.test.ts
```

Expected: FAIL because the store has no history state or undo/redo actions.

- [ ] **Step 3: Add imports and store types**

In `src/store/useFushengluStore.ts`, add these imports:

```ts
import {
  DEFAULT_MERGE_WINDOW_MS,
  cloneProjectSnapshot,
  failedSaveStatus,
  makeHistoryEntry,
  moveRedoToUndo,
  moveUndoToRedo,
  pushHistoryEntry,
  savedStatus,
  savingStatus,
  type ProjectHistoryStacks,
  type ProjectSaveStatus,
} from './projectHistory'
```

Replace `CommitProjectOptions` with:

```ts
type CommitProjectOptions = {
  backupReason?: string
  historyLabel?: string
  skipHistory?: boolean
  mergeKey?: string
  mergeWindowMs?: number
}
```

Add these fields and actions to `StoreState`:

```ts
  undoStacksByProjectId: ProjectHistoryStacks
  redoStacksByProjectId: ProjectHistoryStacks
  saveStatusByProjectId: Record<string, ProjectSaveStatus>
  undoProject: (projectId: string) => void
  redoProject: (projectId: string) => void
  canUndoProject: (projectId: string) => boolean
  canRedoProject: (projectId: string) => boolean
```

- [ ] **Step 4: Update sync and commit behavior**

Inside the store factory in `src/store/useFushengluStore.ts`, replace `syncProject` with:

```ts
      const syncProject = async (
        project: FushengProject,
        options?: CommitProjectOptions,
      ) => {
        set((state) => ({
          saveStatusByProjectId: {
            ...state.saveStatusByProjectId,
            [project.id]: savingStatus(),
          },
        }))

        try {
          await saveProjectToBackend(normalizeProjectForStorage(project), {
            backupReason: options?.backupReason,
          })
          logState('Backend sync succeeded', { projectId: project.id })
          set((state) => ({
            backendStatus: 'online',
            saveStatusByProjectId: {
              ...state.saveStatusByProjectId,
              [project.id]: savedStatus(),
            },
          }))
        } catch (error) {
          const saveStatus = failedSaveStatus(error)
          logState('Backend sync failed', {
            projectId: project.id,
            message: saveStatus.errorMessage,
          })
          set((state) => ({
            backendStatus: saveStatus.state === 'offline' ? 'offline' : state.backendStatus,
            saveStatusByProjectId: {
              ...state.saveStatusByProjectId,
              [project.id]: saveStatus,
            },
          }))
        }
      }
```

Replace `commitProject` with:

```ts
      const commitProject = (
        projectId: string,
        updater: (project: FushengProject) => FushengProject | undefined,
        options?: CommitProjectOptions,
      ) => {
        let changedProject: FushengProject | undefined

        set((state) => {
          let historyUpdate: {
            undoStacksByProjectId: ProjectHistoryStacks
            redoStacksByProjectId: ProjectHistoryStacks
          } | undefined

          const projects = state.projects.map((project) => {
            if (project.id !== projectId) return normalizeProjectForStorage(project)

            const normalizedProject = normalizeProjectForStorage(project)
            const before = cloneProjectSnapshot(normalizedProject)
            const updatedProject = updater(normalizedProject)
            if (!updatedProject) return normalizedProject

            changedProject = touchProject(normalizeProjectForStorage(updatedProject))

            if (!options?.skipHistory) {
              const entry = makeHistoryEntry(before, changedProject, {
                label: options?.historyLabel || 'Update project',
                mergeKey: options?.mergeKey,
                timestamp: Date.now(),
              })
              historyUpdate = pushHistoryEntry(
                state.undoStacksByProjectId,
                state.redoStacksByProjectId,
                entry,
                options?.mergeWindowMs ?? DEFAULT_MERGE_WINDOW_MS,
              )
            }

            return changedProject
          })

          if (!changedProject) return { projects }

          return {
            projects,
            ...(historyUpdate ?? {}),
            saveStatusByProjectId: {
              ...state.saveStatusByProjectId,
              [projectId]: savingStatus(),
            },
          }
        })

        if (changedProject) void syncProject(changedProject, options)
      }
```

- [ ] **Step 5: Add initial state and undo/redo actions**

In the returned initial state object, add:

```ts
        undoStacksByProjectId: {},
        redoStacksByProjectId: {},
        saveStatusByProjectId: {},
```

Add these actions near the sidebar actions:

```ts
        undoProject: (projectId) => {
          let restoredProject: FushengProject | undefined

          set((state) => {
            const result = moveUndoToRedo(
              state.undoStacksByProjectId,
              state.redoStacksByProjectId,
              projectId,
            )
            if (!result.entry) return state

            restoredProject = touchProject(normalizeProjectForStorage(result.entry.before))

            return {
              projects: state.projects.map((project) =>
                project.id === projectId ? restoredProject! : project,
              ),
              undoStacksByProjectId: result.undoStacksByProjectId,
              redoStacksByProjectId: result.redoStacksByProjectId,
              saveStatusByProjectId: {
                ...state.saveStatusByProjectId,
                [projectId]: savingStatus(),
              },
            }
          })

          if (restoredProject) void syncProject(restoredProject, { skipHistory: true })
        },

        redoProject: (projectId) => {
          let restoredProject: FushengProject | undefined

          set((state) => {
            const result = moveRedoToUndo(
              state.undoStacksByProjectId,
              state.redoStacksByProjectId,
              projectId,
            )
            if (!result.entry) return state

            restoredProject = touchProject(normalizeProjectForStorage(result.entry.after))

            return {
              projects: state.projects.map((project) =>
                project.id === projectId ? restoredProject! : project,
              ),
              undoStacksByProjectId: result.undoStacksByProjectId,
              redoStacksByProjectId: result.redoStacksByProjectId,
              saveStatusByProjectId: {
                ...state.saveStatusByProjectId,
                [projectId]: savingStatus(),
              },
            }
          })

          if (restoredProject) void syncProject(restoredProject, { skipHistory: true })
        },

        canUndoProject: (projectId) => Boolean(get().undoStacksByProjectId[projectId]?.length),
        canRedoProject: (projectId) => Boolean(get().redoStacksByProjectId[projectId]?.length),
```

- [ ] **Step 6: Keep history and save status out of persistence**

In `partialize`, do not add the new fields. In `migrate`, add non-persisted defaults:

```ts
          undoStacksByProjectId: {},
          redoStacksByProjectId: {},
          saveStatusByProjectId: {},
```

- [ ] **Step 7: Add history labels and merge keys to high-frequency actions**

Update these store actions so each `commitProject` call passes the shown options:

```ts
updateProjectMeta: { historyLabel: 'Update project metadata' }
addEntity: { historyLabel: 'Add entity' }
updateEntity: { historyLabel: 'Update entity' }
deleteEntity: { historyLabel: 'Delete entity' }
addEvent: { historyLabel: 'Add event' }
updateEvent: { historyLabel: 'Update event' }
deleteEvent: { historyLabel: 'Delete event' }
addEntityRelation: { historyLabel: 'Add entity relation' }
updateEntityRelationStyle: { historyLabel: 'Update entity relation style', mergeKey: `entity-relation-style:${relationId}` }
deleteEntityRelation: { historyLabel: 'Delete entity relation' }
addEventLink: { historyLabel: 'Add event link' }
updateEventLinkStyle: { historyLabel: 'Update event link style', mergeKey: `event-link-style:${linkId}` }
deleteEventLink: { historyLabel: 'Delete event link' }
updateEntityNodePosition: { historyLabel: 'Move entity node', mergeKey: `entity-position:${entityId}` }
updateEventNodePosition: { historyLabel: 'Move event node', mergeKey: `event-position:${eventId}` }
batchUpdateEntityNodePositions: { historyLabel: 'Apply entity graph layout', mergeKey: `entity-layout:${projectId}:${Date.now()}`, mergeWindowMs: 0 }
batchUpdateEventNodePositions: { historyLabel: 'Apply event graph layout', mergeKey: `event-layout:${projectId}:${Date.now()}`, mergeWindowMs: 0 }
addLibraryItem: { historyLabel: 'Add library item' }
deleteLibraryItem: { historyLabel: 'Delete library item' }
addAnalysisNote: { historyLabel: 'Add analysis note' }
updateAnalysisNote: { historyLabel: 'Update analysis note', mergeKey: `analysis-note:${noteId}` }
deleteAnalysisNote: { historyLabel: 'Delete analysis note' }
replaceProjectData: { historyLabel: 'Replace project data', backupReason: 'replace-project-data' }
restoreSampleData: { historyLabel: 'Restore sample data', backupReason: 'restore-sample-data' }
clearProjectData: { historyLabel: 'Clear project data', backupReason: 'clear-project-data' }
```

For example, `updateEntityNodePosition` becomes:

```ts
        updateEntityNodePosition: (projectId, entityId, position) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entityNodePositions: {
                ...project.entityNodePositions,
                [entityId]: position,
              },
            }),
            {
              historyLabel: 'Move entity node',
              mergeKey: `entity-position:${entityId}`,
            },
          )
        },
```

- [ ] **Step 8: Run affected tests**

Run:

```powershell
npm test -- src/store/projectHistory.test.ts src/store/useFushengluStore.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit the store integration**

Run:

```powershell
git add src/store/useFushengluStore.ts src/store/useFushengluStore.test.ts
git commit -m "feat: add project undo redo state"
```

## Task 3: Add Current-Project Search Service

**Files:**
- Create: `src/lib/projectSearch.ts`
- Create: `src/lib/projectSearch.test.ts`

- [ ] **Step 1: Write failing search tests**

Create `src/lib/projectSearch.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createFictionSampleProject } from '../data/sampleData'
import { normalizeProjectForStorage } from '../shared/projectNormalization'
import { searchProject } from './projectSearch'

const makeProject = () => {
  const base = normalizeProjectForStorage(createFictionSampleProject('project-search'))
  const firstEntity = base.entities[0]
  const firstEvent = base.events[0]
  const firstRelation = base.entityRelations[0]

  if (!firstEntity || !firstEvent || !firstRelation) throw new Error('Expected sample data')

  return normalizeProjectForStorage({
    ...base,
    entities: [{ ...firstEntity, name: '秦始皇' }, ...base.entities.slice(1)],
    events: [{ ...firstEvent, title: '统一六国', description: 'QIN campaign milestone' }, ...base.events.slice(1)],
    entityRelations: [{ ...firstRelation, type: '盟友', description: 'Political ALLY' }, ...base.entityRelations.slice(1)],
    libraryItems: [
      {
        id: 'library-search-source',
        title: '史记摘录',
        kind: 'source',
        content: '关于秦始皇的资料笔记',
        tags: ['史料'],
        createdAt: '2026-06-20T00:00:00.000Z',
      },
    ],
    analysisNotes: [
      {
        id: 'analysis-search-note',
        title: '统一路径',
        graphMode: 'entities',
        startId: firstEntity.id,
        nodeIds: [firstEntity.id],
        edgeIds: [firstRelation.id],
        summary: '秦始皇与盟友关系的推理笔记',
        createdAt: '2026-06-20T00:00:00.000Z',
        updatedAt: '2026-06-20T00:00:00.000Z',
      },
    ],
  })
}

describe('searchProject', () => {
  it('returns empty grouped results for blank queries', () => {
    const result = searchProject(makeProject(), '   ')

    expect(result.total).toBe(0)
    expect(result.groups.every((group) => group.results.length === 0)).toBe(true)
  })

  it('finds Chinese substrings across project records', () => {
    const result = searchProject(makeProject(), '秦始皇')

    expect(result.total).toBeGreaterThan(0)
    expect(result.groups.find((group) => group.kind === 'entities')?.results[0]).toMatchObject({
      title: '秦始皇',
      path: expect.stringContaining('/projects/project-search/relation-graph?focusNodeId='),
    })
    expect(result.groups.find((group) => group.kind === 'library')?.results[0]?.title).toBe('史记摘录')
  })

  it('matches case-insensitive Latin text', () => {
    const result = searchProject(makeProject(), 'ally')

    expect(result.groups.find((group) => group.kind === 'relations')?.results[0]?.title).toContain('盟友')
  })

  it('limits each group to eight results', () => {
    const project = makeProject()
    const expanded = normalizeProjectForStorage({
      ...project,
      entities: Array.from({ length: 12 }, (_, index) => ({
        ...project.entities[0]!,
        id: `entity-match-${index}`,
        name: `Match Entity ${index}`,
      })),
    })

    const result = searchProject(expanded, 'Match Entity')

    expect(result.groups.find((group) => group.kind === 'entities')?.results).toHaveLength(8)
  })
})
```

- [ ] **Step 2: Run search tests and verify they fail**

Run:

```powershell
npm test -- src/lib/projectSearch.test.ts
```

Expected: FAIL because `src/lib/projectSearch.ts` does not exist.

- [ ] **Step 3: Implement the search module**

Create `src/lib/projectSearch.ts`:

```ts
import type { FushengProject } from '../types'

export type ProjectSearchKind = 'entities' | 'events' | 'relations' | 'library' | 'notes'

export type ProjectSearchResult = {
  id: string
  kind: ProjectSearchKind
  title: string
  context: string
  path: string
  focusNodeId?: string
}

export type ProjectSearchGroup = {
  kind: ProjectSearchKind
  label: string
  results: ProjectSearchResult[]
}

export type ProjectSearchResponse = {
  query: string
  total: number
  groups: ProjectSearchGroup[]
}

const GROUPS: Array<{ kind: ProjectSearchKind; label: string }> = [
  { kind: 'entities', label: '实体' },
  { kind: 'events', label: '事件' },
  { kind: 'relations', label: '关系' },
  { kind: 'library', label: '资料' },
  { kind: 'notes', label: '笔记' },
]

const normalize = (value: string) => value.trim().toLocaleLowerCase('zh-CN')

const compact = (values: Array<string | number | undefined>) =>
  values
    .filter((value) => value != null && String(value).trim())
    .map((value) => String(value).trim())

const includesQuery = (values: Array<string | number | undefined>, query: string) =>
  compact(values).join(' ').toLocaleLowerCase('zh-CN').includes(query)

const clipContext = (values: Array<string | number | undefined>) =>
  compact(values).join(' · ').slice(0, 120)

const cap = (results: ProjectSearchResult[]) => results.slice(0, 8)

export function searchProject(project: FushengProject, rawQuery: string): ProjectSearchResponse {
  const query = normalize(rawQuery)
  const emptyGroups = GROUPS.map((group) => ({ ...group, results: [] }))

  if (!query) {
    return { query: rawQuery, total: 0, groups: emptyGroups }
  }

  const entityById = new Map(project.entities.map((entity) => [entity.id, entity]))
  const eventById = new Map(project.events.map((event) => [event.id, event]))

  const entityResults = cap(
    project.entities
      .filter((entity) =>
        includesQuery(
          [
            entity.name,
            entity.type,
            entity.identity,
            entity.faction,
            entity.motivation,
            entity.birth,
            entity.death,
            entity.dynasty,
            entity.roleArc,
            entity.description,
            ...entity.tags,
            entity.startYear,
            entity.endYear,
          ],
          query,
        ),
      )
      .map((entity) => ({
        id: entity.id,
        kind: 'entities' as const,
        title: entity.name,
        context: clipContext([entity.identity, entity.faction, entity.description, ...entity.tags]),
        path: `/projects/${project.id}/relation-graph?focusNodeId=${encodeURIComponent(entity.id)}`,
        focusNodeId: entity.id,
      })),
  )

  const eventResults = cap(
    project.events
      .filter((event) =>
        includesQuery(
          [
            event.title,
            event.timeLabel,
            event.order,
            event.chapter,
            event.eventType,
            event.location,
            event.description,
            ...event.tags,
            ...event.relatedEntityIds.map((id) => entityById.get(id)?.name),
            event.startYear,
            event.endYear,
          ],
          query,
        ),
      )
      .map((event) => ({
        id: event.id,
        kind: 'events' as const,
        title: event.title,
        context: clipContext([event.timeLabel, event.location, event.description, ...event.tags]),
        path: `/projects/${project.id}/event-graph?focusNodeId=${encodeURIComponent(event.id)}`,
        focusNodeId: event.id,
      })),
  )

  const relationResults = cap(
    project.entityRelations
      .filter((relation) =>
        includesQuery(
          [
            relation.type,
            relation.description,
            entityById.get(relation.sourceId)?.name,
            entityById.get(relation.targetId)?.name,
            relation.startYear,
            relation.endYear,
          ],
          query,
        ),
      )
      .map((relation) => {
        const source = entityById.get(relation.sourceId)
        const target = entityById.get(relation.targetId)
        return {
          id: relation.id,
          kind: 'relations' as const,
          title: `${source?.name || relation.sourceId} - ${relation.type} - ${target?.name || relation.targetId}`,
          context: clipContext([relation.description, relation.startYear, relation.endYear]),
          path: `/projects/${project.id}/relation-graph?focusNodeId=${encodeURIComponent(relation.sourceId)}`,
          focusNodeId: relation.sourceId,
        }
      }),
  )

  const eventLinkResults = project.eventLinks
    .filter((link) =>
      includesQuery(
        [
          link.type,
          link.description,
          eventById.get(link.sourceEventId)?.title,
          eventById.get(link.targetEventId)?.title,
          link.startYear,
          link.endYear,
        ],
        query,
      ),
    )
    .map((link) => {
      const source = eventById.get(link.sourceEventId)
      const target = eventById.get(link.targetEventId)
      return {
        id: link.id,
        kind: 'relations' as const,
        title: `${source?.title || link.sourceEventId} - ${link.type} - ${target?.title || link.targetEventId}`,
        context: clipContext([link.description, link.startYear, link.endYear]),
        path: `/projects/${project.id}/event-graph?focusNodeId=${encodeURIComponent(link.sourceEventId)}`,
        focusNodeId: link.sourceEventId,
      }
    })

  const libraryResults = cap(
    project.libraryItems
      .filter((item) =>
        includesQuery([item.title, item.kind, item.content, ...item.tags, item.createdAt], query),
      )
      .map((item) => ({
        id: item.id,
        kind: 'library' as const,
        title: item.title,
        context: clipContext([item.kind, item.content, ...item.tags]),
        path: `/projects/${project.id}/library?itemId=${encodeURIComponent(item.id)}`,
      })),
  )

  const noteResults = cap(
    project.analysisNotes
      .filter((note) =>
        includesQuery([note.title, note.summary, note.graphMode, note.startId, note.targetId], query),
      )
      .map((note) => ({
        id: note.id,
        kind: 'notes' as const,
        title: note.title,
        context: clipContext([note.summary]),
        path: `/projects/${project.id}/${note.graphMode === 'entities' ? 'relation-graph' : 'event-graph'}?focusNodeId=${encodeURIComponent(note.startId || note.nodeIds[0] || '')}`,
        focusNodeId: note.startId || note.nodeIds[0],
      })),
  )

  const relationGroup = cap([...relationResults, ...eventLinkResults])
  const groups: ProjectSearchGroup[] = [
    { kind: 'entities', label: '实体', results: entityResults },
    { kind: 'events', label: '事件', results: eventResults },
    { kind: 'relations', label: '关系', results: relationGroup },
    { kind: 'library', label: '资料', results: libraryResults },
    { kind: 'notes', label: '笔记', results: noteResults },
  ]

  return {
    query: rawQuery,
    total: groups.reduce((sum, group) => sum + group.results.length, 0),
    groups,
  }
}
```

- [ ] **Step 4: Run search tests and verify they pass**

Run:

```powershell
npm test -- src/lib/projectSearch.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the search service**

Run:

```powershell
git add src/lib/projectSearch.ts src/lib/projectSearch.test.ts
git commit -m "feat: search current project records"
```

## Task 4: Add Header Controls, Save Status, And Search Dialog

**Files:**
- Create: `src/components/GlobalSearchDialog.tsx`
- Create: `src/components/SaveStatusBadge.tsx`
- Modify: `src/layouts/ProjectLayout.tsx`

- [ ] **Step 1: Create the save status badge**

Create `src/components/SaveStatusBadge.tsx`:

```tsx
import clsx from 'clsx'
import { AlertCircle, CheckCircle2, CloudOff, Database, Loader2 } from 'lucide-react'
import type { ProjectSaveStatus } from '../store/projectHistory'

type Props = {
  status?: ProjectSaveStatus
}

export default function SaveStatusBadge({ status }: Props) {
  const state = status?.state ?? 'idle'
  const label =
    state === 'saving'
      ? '保存中'
      : state === 'saved'
        ? '已保存'
        : state === 'offline'
          ? '离线保存'
          : state === 'error'
            ? '保存失败'
            : '本地就绪'
  const Icon =
    state === 'saving'
      ? Loader2
      : state === 'saved'
        ? CheckCircle2
        : state === 'offline'
          ? CloudOff
          : state === 'error'
            ? AlertCircle
            : Database

  return (
    <span
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs shadow-sm',
        state === 'saved' || state === 'idle'
          ? 'border-jade/25 bg-jade/10 text-jade'
          : state === 'saving'
            ? 'border-goldline/25 bg-goldline/10 text-ink-600'
            : 'border-cinnabar/20 bg-cinnabar/10 text-cinnabar',
      )}
      title={status?.errorMessage}
    >
      <Icon size={15} className={state === 'saving' ? 'animate-spin' : undefined} />
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Create the search dialog**

Create `src/components/GlobalSearchDialog.tsx`:

```tsx
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchProject } from '../lib/projectSearch'
import type { FushengProject } from '../types'

type Props = {
  project: FushengProject
  open: boolean
  onClose: () => void
}

function highlightText(text: string, query: string): ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return text

  const index = text.toLocaleLowerCase('zh-CN').indexOf(trimmed.toLocaleLowerCase('zh-CN'))
  if (index < 0) return text

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-goldline/25 px-0.5 text-ink-900">{text.slice(index, index + trimmed.length)}</mark>
      {text.slice(index + trimmed.length)}
    </>
  )
}

export default function GlobalSearchDialog({ project, open, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const result = useMemo(() => searchProject(project, query), [project, query])

  if (!open) return null

  const openResult = (path: string) => {
    navigate(path)
    onClose()
    setQuery('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/25 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="全局搜索"
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-lg border border-goldline/25 bg-paper-50 shadow-archive">
        <div className="flex min-h-14 items-center gap-3 border-b border-goldline/15 px-4">
          <Search size={18} className="text-ink-500" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-12 flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-500"
            placeholder="搜索当前项目"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
            aria-label="关闭搜索"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[62dvh] overflow-y-auto p-3">
          {!query.trim() ? (
            <p className="px-2 py-8 text-center text-sm text-ink-500">输入关键词搜索实体、事件、关系、资料和笔记。</p>
          ) : result.total === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-ink-500">没有匹配结果。</p>
          ) : (
            <div className="space-y-4">
              {result.groups
                .filter((group) => group.results.length)
                .map((group) => (
                  <section key={group.kind}>
                    <h3 className="px-2 text-xs font-semibold text-ink-500">{group.label}</h3>
                    <div className="mt-1 space-y-1">
                      {group.results.map((item) => (
                        <button
                          key={`${group.kind}-${item.id}`}
                          type="button"
                          onClick={() => openResult(item.path)}
                          className="block w-full rounded-lg px-3 py-2 text-left transition hover:bg-goldline/10"
                        >
                          <span className="block text-sm font-semibold text-ink-900">
                            {highlightText(item.title, query)}
                          </span>
                          {item.context ? (
                            <span className="mt-0.5 line-clamp-1 block text-xs text-ink-500">
                              {highlightText(item.context, query)}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire controls into the project header**

In `src/layouts/ProjectLayout.tsx`, replace the imports with versions that include these symbols:

```tsx
import { useEffect, useState } from 'react'
import { BookOpen, Redo2, Search, Undo2 } from 'lucide-react'
import GlobalSearchDialog from '../components/GlobalSearchDialog'
import SaveStatusBadge from '../components/SaveStatusBadge'
```

Remove unused `clsx`, `CircleCheck`, and `Database` imports from this file.

Inside `ProjectLayout`, select these store values:

```tsx
  const saveStatus = useFushengluStore((state) =>
    projectId ? state.saveStatusByProjectId[projectId] : undefined,
  )
  const undoProject = useFushengluStore((state) => state.undoProject)
  const redoProject = useFushengluStore((state) => state.redoProject)
  const canUndo = useFushengluStore((state) =>
    projectId ? state.canUndoProject(projectId) : false,
  )
  const canRedo = useFushengluStore((state) =>
    projectId ? state.canRedoProject(projectId) : false,
  )
  const [searchOpen, setSearchOpen] = useState(false)
```

Register shortcuts after the `template` variable:

```tsx
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return

      if (key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (key === 'z' && projectId) {
        event.preventDefault()
        if (event.shiftKey) {
          redoProject(projectId)
        } else {
          undoProject(projectId)
        }
      }

      if (key === 'y' && projectId) {
        event.preventDefault()
        redoProject(projectId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [projectId, redoProject, undoProject])
```

Replace the passive search label and backend status span with:

```tsx
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3 text-left text-sm text-ink-500 shadow-sm transition hover:border-goldline/45 hover:bg-paper-50"
                >
                  <Search size={17} />
                  <span className="min-w-0 flex-1 truncate">{template.searchPlaceholder}</span>
                  <kbd className="hidden rounded border border-ink-900/10 bg-paper-100 px-1.5 py-0.5 text-[10px] text-ink-500 sm:inline">
                    Ctrl K
                  </kbd>
                </button>
                <div className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-goldline/25 bg-paper-50/70 px-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => undoProject(project.id)}
                    disabled={!canUndo}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-600 transition hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="撤销"
                  >
                    <Undo2 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => redoProject(project.id)}
                    disabled={!canRedo}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-600 transition hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="重做"
                  >
                    <Redo2 size={17} />
                  </button>
                </div>
                <SaveStatusBadge status={saveStatus} />
```

Render the dialog before `</div>` of the top-level shell:

```tsx
      <GlobalSearchDialog project={project} open={searchOpen} onClose={() => setSearchOpen(false)} />
```

- [ ] **Step 4: Build to catch type and JSX issues**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit header UI integration**

Run:

```powershell
git add src/components/GlobalSearchDialog.tsx src/components/SaveStatusBadge.tsx src/layouts/ProjectLayout.tsx
git commit -m "feat: add editing controls to project header"
```

## Task 5: Add Graph Layout View Calculations

**Files:**
- Create: `src/lib/graphLayoutViews.ts`
- Create: `src/lib/graphLayoutViews.test.ts`

- [ ] **Step 1: Write failing layout view tests**

Create `src/lib/graphLayoutViews.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createFictionSampleProject } from '../data/sampleData'
import { normalizeProjectForStorage } from '../shared/projectNormalization'
import { computeGraphLayoutView } from './graphLayoutViews'

const project = normalizeProjectForStorage(createFictionSampleProject('project-layout-view'))

describe('computeGraphLayoutView', () => {
  it('returns existing positions for free entity layout', () => {
    const entity = project.entities[0]
    if (!entity) throw new Error('Expected sample entity')
    const withPosition = {
      ...project,
      entityNodePositions: { [entity.id]: { x: 12, y: 34 } },
    }

    expect(computeGraphLayoutView(withPosition, 'entities', 'free')[entity.id]).toEqual({ x: 12, y: 34 })
  })

  it('computes stable relationship positions for entity graphs', () => {
    const first = computeGraphLayoutView(project, 'entities', 'relationship')
    const second = computeGraphLayoutView(project, 'entities', 'relationship')

    expect(first).toEqual(second)
    expect(Object.keys(first).sort()).toEqual(project.entities.map((entity) => entity.id).sort())
  })

  it('orders event layout by year and order for timeline view', () => {
    const positions = computeGraphLayoutView(project, 'events', 'timeline')
    const sortedEvents = [...project.events].sort(
      (a, b) => (a.startYear ?? a.order) - (b.startYear ?? b.order) || a.order - b.order,
    )

    expect(positions[sortedEvents[0]!.id]!.x).toBeLessThanOrEqual(positions[sortedEvents[sortedEvents.length - 1]!.id]!.x)
  })

  it('returns an empty map for empty graphs', () => {
    expect(
      computeGraphLayoutView(
        { ...project, entities: [], entityRelations: [], entityNodePositions: {} },
        'entities',
        'relationship',
      ),
    ).toEqual({})
  })
})
```

- [ ] **Step 2: Run layout tests and verify they fail**

Run:

```powershell
npm test -- src/lib/graphLayoutViews.test.ts
```

Expected: FAIL because `src/lib/graphLayoutViews.ts` does not exist.

- [ ] **Step 3: Implement layout view calculations**

Create `src/lib/graphLayoutViews.ts`:

```ts
import { computeEntityLayout, computeEventLayout, type LayoutPositionMap } from './dagreLayout'
import type { FushengProject, GraphMode, GraphNodePosition } from '../types'

export type GraphLayoutView = 'free' | 'relationship' | 'timeline' | 'evidence'

const GRID_X = 280
const GRID_Y = 190

function sortedByLabel<T extends { id: string }>(items: T[], label: (item: T) => string) {
  return [...items].sort((a, b) => label(a).localeCompare(label(b), 'zh-CN') || a.id.localeCompare(b.id))
}

function gridPositions<T extends { id: string }>(items: T[], columns = 4): LayoutPositionMap {
  return Object.fromEntries(
    items.map((item, index) => [
      item.id,
      {
        x: (index % columns) * GRID_X,
        y: Math.floor(index / columns) * GRID_Y,
      },
    ]),
  )
}

function groupEntityPositions(project: FushengProject): LayoutPositionMap {
  const grouped = sortedByLabel(project.entities, (entity) =>
    [entity.type, entity.faction || '', entity.name].join('|'),
  )
  return gridPositions(grouped, 4)
}

function timelineEventPositions(project: FushengProject): LayoutPositionMap {
  const sorted = [...project.events].sort(
    (a, b) =>
      (a.startYear ?? a.order) - (b.startYear ?? b.order) ||
      a.order - b.order ||
      a.title.localeCompare(b.title, 'zh-CN') ||
      a.id.localeCompare(b.id),
  )

  return Object.fromEntries(
    sorted.map((event, index) => [
      event.id,
      {
        x: index * GRID_X,
        y: index % 2 === 0 ? 80 : 300,
      },
    ]),
  )
}

function evidenceEntityPositions(project: FushengProject): LayoutPositionMap {
  const degree = new Map(project.entities.map((entity) => [entity.id, 0]))
  for (const relation of project.entityRelations) {
    degree.set(relation.sourceId, (degree.get(relation.sourceId) ?? 0) + 1)
    degree.set(relation.targetId, (degree.get(relation.targetId) ?? 0) + 1)
  }
  for (const note of project.analysisNotes.filter((item) => item.graphMode === 'entities')) {
    for (const nodeId of note.nodeIds) {
      degree.set(nodeId, (degree.get(nodeId) ?? 0) + 2)
    }
  }

  const sorted = [...project.entities].sort(
    (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.name.localeCompare(b.name, 'zh-CN'),
  )
  return gridPositions(sorted, 3)
}

function evidenceEventPositions(project: FushengProject): LayoutPositionMap {
  const degree = new Map(project.events.map((event) => [event.id, 0]))
  for (const link of project.eventLinks) {
    degree.set(link.sourceEventId, (degree.get(link.sourceEventId) ?? 0) + 1)
    degree.set(link.targetEventId, (degree.get(link.targetEventId) ?? 0) + 1)
  }
  for (const note of project.analysisNotes.filter((item) => item.graphMode === 'events')) {
    for (const nodeId of note.nodeIds) {
      degree.set(nodeId, (degree.get(nodeId) ?? 0) + 2)
    }
  }

  const sorted = [...project.events].sort(
    (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.order - b.order,
  )
  return gridPositions(sorted, 3)
}

function coercePositions(positions: LayoutPositionMap): Record<string, GraphNodePosition> {
  return Object.fromEntries(
    Object.entries(positions).map(([id, position]) => [
      id,
      { x: Math.round(position.x), y: Math.round(position.y) },
    ]),
  )
}

export function computeGraphLayoutView(
  project: FushengProject,
  mode: GraphMode,
  view: GraphLayoutView,
): Record<string, GraphNodePosition> {
  if (mode === 'entities' && !project.entities.length) return {}
  if (mode === 'events' && !project.events.length) return {}

  if (view === 'free') {
    return mode === 'entities'
      ? { ...project.entityNodePositions }
      : { ...project.eventNodePositions }
  }

  if (mode === 'entities') {
    if (view === 'relationship') {
      return coercePositions(
        computeEntityLayout(project.entities, project.entityRelations, {
          rankdir: 'LR',
          nodesep: 90,
          ranksep: 140,
        }),
      )
    }
    if (view === 'timeline') return coercePositions(groupEntityPositions(project))
    return coercePositions(evidenceEntityPositions(project))
  }

  if (view === 'timeline') return coercePositions(timelineEventPositions(project))
  if (view === 'relationship') {
    return coercePositions(
      computeEventLayout(project.events, project.eventLinks, {
        rankdir: 'LR',
        nodesep: 80,
        ranksep: 130,
      }),
    )
  }
  return coercePositions(evidenceEventPositions(project))
}
```

- [ ] **Step 4: Run layout tests and verify they pass**

Run:

```powershell
npm test -- src/lib/graphLayoutViews.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit layout service**

Run:

```powershell
git add src/lib/graphLayoutViews.ts src/lib/graphLayoutViews.test.ts
git commit -m "feat: add graph layout view calculations"
```

## Task 6: Wire Layout Views Into The Graph Workbench

**Files:**
- Modify: `src/components/GraphCanvas.tsx`
- Modify: `src/components/GraphToolbar.tsx`
- Modify: `src/components/GraphWorkbench.tsx`

- [ ] **Step 1: Add preview position support to GraphCanvas**

In `src/components/GraphCanvas.tsx`, add this prop:

```ts
  positionOverrides?: Record<string, GraphNodePosition>
```

Update `buildGraph` signature:

```ts
function buildGraph(
  project: FushengProject,
  mode: Props['mode'],
  compact?: boolean,
  currentYear?: number | null,
  positionOverrides?: Record<string, GraphNodePosition>,
) {
```

Use overrides when creating entity and event nodes:

```ts
position: positionOverrides?.[entity.id] || project.entityNodePositions?.[entity.id] || entityPositions[index % entityPositions.length],
```

```ts
position: positionOverrides?.[event.id] || project.eventNodePositions?.[event.id] || eventPositions[index % eventPositions.length],
```

Pass the prop into the memo:

```ts
  const graph = useMemo(
    () => buildGraph(project, mode, compact, currentYear, positionOverrides),
    [compact, currentYear, mode, positionOverrides, project],
  )
```

- [ ] **Step 2: Add layout controls to GraphToolbar**

In `src/components/GraphToolbar.tsx`, import `Check` and `Network`, plus the layout type:

```ts
import { Check, Focus, Fullscreen, LayoutGrid, Maximize2, Network, Plus, RotateCcw, SearchX } from 'lucide-react'
import type { GraphLayoutView } from '../lib/graphLayoutViews'
```

Add props:

```ts
  layoutView: GraphLayoutView
  hasLayoutPreview: boolean
  onLayoutViewChange: (view: GraphLayoutView) => void
  onApplyLayoutView: () => void
```

Add this constant:

```ts
const layoutOptions: Array<{ value: GraphLayoutView; label: string }> = [
  { value: 'free', label: '自由布局' },
  { value: 'relationship', label: '人物关系' },
  { value: 'timeline', label: '时间事件' },
  { value: 'evidence', label: '证据资料' },
]
```

Render the selector after the mode segmented control:

```tsx
      <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-goldline/30 bg-paper-50/90 px-2 text-xs text-ink-600 shadow-soft backdrop-blur">
        <Network size={15} />
        <select
          value={layoutView}
          onChange={(event) => onLayoutViewChange(event.target.value as GraphLayoutView)}
          className="bg-transparent text-xs text-ink-700 outline-none"
          aria-label="布局视图"
        >
          {layoutOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {hasLayoutPreview ? (
        <button type="button" onClick={onApplyLayoutView} className="graph-tool-button">
          <Check size={16} />
          应用布局
        </button>
      ) : null}
```

- [ ] **Step 3: Compute and apply layout previews in GraphWorkbench**

In `src/components/GraphWorkbench.tsx`, replace the dagre import with:

```ts
import { computeGraphLayoutView, type GraphLayoutView } from '../lib/graphLayoutViews'
```

Add state next to the existing layout state:

```ts
  const [layoutView, setLayoutView] = useState<GraphLayoutView>('free')
  const [layoutPreviewPositions, setLayoutPreviewPositions] = useState<Record<string, GraphNodePosition> | undefined>()
```

Replace `runAutoLayout` with:

```ts
  const previewLayoutView = (view: GraphLayoutView) => {
    setLayoutView(view)
    if (view === 'free') {
      setLayoutPreviewPositions(undefined)
      return
    }

    try {
      const positions = computeGraphLayoutView(project, graphMode, view)
      setLayoutPreviewPositions(positions)
      window.setTimeout(() => fitView({ duration: 280, padding: 0.25 }), 80)
    } catch {
      setLayoutStatus('failed')
      window.setTimeout(() => setLayoutStatus('idle'), 1800)
    }
  }

  const applyLayoutView = () => {
    if (!layoutPreviewPositions) return

    try {
      setLayoutStatus('saving')
      onBatchLayout(layoutPreviewPositions)
      setLayoutPreviewPositions(undefined)
      setLayoutView('free')
      setLayoutStatus('saved')
      window.setTimeout(() => setLayoutStatus('idle'), 1400)
      window.setTimeout(() => fitView({ duration: 280, padding: 0.25 }), 80)
    } catch {
      setLayoutStatus('failed')
      window.setTimeout(() => setLayoutStatus('idle'), 1800)
    }
  }

  const runAutoLayout = () => {
    previewLayoutView(graphMode === 'entities' ? 'relationship' : 'timeline')
  }
```

Pass `positionOverrides` into `GraphCanvas`:

```tsx
            positionOverrides={layoutPreviewPositions}
```

Pass the new toolbar props:

```tsx
                layoutView={layoutView}
                hasLayoutPreview={Boolean(layoutPreviewPositions)}
                onLayoutViewChange={previewLayoutView}
                onApplyLayoutView={applyLayoutView}
```

- [ ] **Step 4: Run graph-related tests and build**

Run:

```powershell
npm test -- src/lib/graphLayoutViews.test.ts src/lib/graphWorkbench.test.ts src/components/GraphFilterPanel.test.tsx src/components/GraphEvidencePanel.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit graph layout UI**

Run:

```powershell
git add src/components/GraphCanvas.tsx src/components/GraphToolbar.tsx src/components/GraphWorkbench.tsx
git commit -m "feat: preview and apply graph layout views"
```

## Task 7: Final Validation And Release Check Decision

**Files:**
- No file changes expected in this task unless validation exposes a defect.

- [ ] **Step 1: Run the focused test suite**

Run:

```powershell
npm test -- src/store/projectHistory.test.ts src/store/useFushengluStore.test.ts src/lib/projectSearch.test.ts src/lib/graphLayoutViews.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Decide whether desktop release check is required**

If Tasks 1-6 did not change `electron/`, `server/`, packaging scripts, release scripts, or desktop-only routing, skip `npm run release:check`.

If a validation fix touched any of those areas, run:

```powershell
npm run release:check
```

Expected: PASS.

- [ ] **Step 5: Capture final Git state**

Run:

```powershell
git status --short --branch
git log --oneline -6
```

Expected: working tree clean and the latest commits are the task commits from this plan.

## Self-Review Checklist

- Spec coverage: Task 1 and Task 2 cover project history, undo/redo, merge, stack cap, skip-history, and save status. Task 3 covers current-project search. Task 4 covers header search, undo/redo controls, save status, and keyboard shortcuts. Task 5 and Task 6 cover graph layout views, preview, apply, and single-history layout writes. Task 7 covers validation.
- Placeholder scan: this plan contains exact file paths, concrete test cases, code snippets, commands, and expected results.
- Type consistency: `ProjectSaveStatus`, `ProjectHistoryStacks`, `GraphLayoutView`, `searchProject`, `computeGraphLayoutView`, `positionOverrides`, `undoProject`, `redoProject`, `canUndoProject`, and `canRedoProject` are introduced before use.
