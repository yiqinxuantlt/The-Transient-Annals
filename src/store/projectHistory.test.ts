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
