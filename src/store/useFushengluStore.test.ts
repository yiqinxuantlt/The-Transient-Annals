import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFictionSampleProject } from '../data/sampleData'
import {
  FUSHENGLU_SCHEMA_VERSION,
  normalizeProjectForStorage,
} from '../shared/projectNormalization'
import type { FushengProject } from '../types'
import {
  deleteProjectFromBackend,
  saveProjectToBackend,
} from '../lib/fushengluApi'
import { useFushengluStore } from './useFushengluStore'

vi.mock('../lib/fushengluApi', () => ({
  deleteProjectFromBackend: vi.fn(async () => undefined),
  fetchProjectsFromBackend: vi.fn(async () => []),
  saveProjectToBackend: vi.fn(async (project: FushengProject) => project),
}))

const makeStoreProject = (id: string) =>
  normalizeProjectForStorage(createFictionSampleProject(id))

const setStoreProject = (project: FushengProject) => {
  useFushengluStore.setState({
    projects: [project],
    theme: 'light',
    sidebarCollapsed: false,
    sidebarWidth: 288,
    backendStatus: 'offline',
    undoStacksByProjectId: {},
    redoStacksByProjectId: {},
    saveStatusByProjectId: {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  window.history.pushState({}, '', '/')
  window.localStorage.clear()
  useFushengluStore.setState({
    projects: [],
    theme: 'light',
    sidebarCollapsed: false,
    sidebarWidth: 288,
    backendStatus: 'offline',
    undoStacksByProjectId: {},
    redoStacksByProjectId: {},
    saveStatusByProjectId: {},
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('normalizeProjectForStorage', () => {
  it('preserves full edge visual styles for local persistence', () => {
    const project = createFictionSampleProject('project-style-test')
    const relation = project.entityRelations[0]

    if (!relation) throw new Error('Expected sample relation')

    const normalized = normalizeProjectForStorage({
      ...project,
      schemaVersion: 1,
      entityRelations: [
        {
          ...relation,
          style: {
            lineStyle: 'custom',
            tone: 'ink',
            edgeType: 'step',
            lineWidth: 4.5,
            animated: true,
            customColor: '#3366aa',
            opacity: 0.65,
            dashLength: 14,
            dashGap: 5,
            arrow: 'both',
            lineCap: 'square',
            labelVisible: false,
            shadow: false,
          },
        },
      ],
    })

    expect(normalized.schemaVersion).toBe(FUSHENGLU_SCHEMA_VERSION)
    expect(normalized.entityRelations[0]?.style).toEqual({
      lineStyle: 'custom',
      tone: 'ink',
      edgeType: 'step',
      lineWidth: 4.5,
      animated: true,
      customColor: '#3366aa',
      opacity: 0.65,
      dashLength: 14,
      dashGap: 5,
      arrow: 'both',
      lineCap: 'square',
      labelVisible: false,
      shadow: false,
    })
  })

  it('removes orphan graph references before persistence', () => {
    const project = createFictionSampleProject('project-integrity-test')
    const entity = project.entities[0]
    const event = project.events[0]

    if (!entity || !event) throw new Error('Expected sample graph data')

    const normalized = normalizeProjectForStorage({
      ...project,
      events: [
        {
          ...event,
          id: 'event-valid',
          relatedEntityIds: [entity.id, 'missing-entity'],
        },
      ],
      entityRelations: [
        {
          id: 'relation-orphan',
          sourceId: entity.id,
          targetId: 'missing-entity',
          type: 'invalid-relation',
        },
      ],
      eventLinks: [
        {
          id: 'link-orphan',
          sourceEventId: 'event-valid',
          targetEventId: 'missing-event',
          type: 'invalid-cause',
        },
      ],
      entityNodePositions: {
        [entity.id]: { x: 1, y: 2 },
        'missing-entity': { x: 3, y: 4 },
      },
      eventNodePositions: {
        'event-valid': { x: 5, y: 6 },
        'missing-event': { x: 7, y: 8 },
      },
    })

    expect(normalized.events[0]?.relatedEntityIds).toEqual([entity.id])
    expect(normalized.entityRelations).toEqual([])
    expect(normalized.eventLinks).toEqual([])
    expect(normalized.entityNodePositions).toEqual({
      [entity.id]: { x: 1, y: 2 },
    })
    expect(normalized.eventNodePositions).toEqual({ 'event-valid': { x: 5, y: 6 } })
  })

  it('normalizes missing and invalid analysis notes for local persistence', () => {
    const project = createFictionSampleProject('project-analysis-normalization')
    const entity = project.entities[0]
    const relation = project.entityRelations[0]

    if (!entity || !relation) throw new Error('Expected sample graph data')

    const normalized = normalizeProjectForStorage({
      ...project,
      analysisNotes: [
        {
          id: 'note-valid',
          title: 'Valid reasoning chain',
          graphMode: 'entities',
          startId: entity.id,
          targetId: 'missing-node',
          nodeIds: [entity.id, 'missing-node'],
          edgeIds: [relation.id, 'missing-edge'],
          summary: 'Keep valid graph references and remove missing ones.',
          createdAt: '2026-06-18T00:00:00.000Z',
          updatedAt: '2026-06-18T00:00:00.000Z',
        },
      ],
    })

    expect(normalized.analysisNotes).toEqual([
      {
        id: 'note-valid',
        title: 'Valid reasoning chain',
        graphMode: 'entities',
        startId: entity.id,
        targetId: undefined,
        nodeIds: [entity.id],
        edgeIds: [relation.id],
        summary: 'Keep valid graph references and remove missing ones.',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-18T00:00:00.000Z',
      },
    ])

    const legacyProject = { ...project, analysisNotes: undefined } as unknown as typeof project
    expect(normalizeProjectForStorage(legacyProject).analysisNotes).toEqual([])
  })
})

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
    const entityNodePositions = { ...project.entityNodePositions }
    delete entityNodePositions[entity.id]
    setStoreProject({ ...project, entityNodePositions })

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

describe('analysis note store actions', () => {
  it('adds updates and deletes analysis notes on the current project', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T00:00:00.000Z'))

    const project = makeStoreProject('project-note-actions')
    const firstEvent = project.events[0]
    const secondEvent = project.events[1]
    const firstLink = project.eventLinks[0]

    if (!firstEvent || !secondEvent || !firstLink) throw new Error('Expected sample event graph')

    setStoreProject(project)

    const nodeIds = [firstEvent.id, secondEvent.id]
    const edgeIds = [firstLink.id]
    const noteId = useFushengluStore.getState().addAnalysisNote({
      title: 'Opening chain',
      graphMode: 'events',
      startId: firstEvent.id,
      targetId: secondEvent.id,
      nodeIds,
      edgeIds,
      summary: 'The first event drives the second event.',
    })

    nodeIds.push('mutated-event')
    edgeIds.push('mutated-link')

    const added = useFushengluStore
      .getState()
      .projects[0]?.analysisNotes.find((note) => note.id === noteId)

    expect(added).toMatchObject({
      id: noteId,
      title: 'Opening chain',
      graphMode: 'events',
      startId: firstEvent.id,
      targetId: secondEvent.id,
      nodeIds: [firstEvent.id, secondEvent.id],
      edgeIds: [firstLink.id],
      summary: 'The first event drives the second event.',
      createdAt: '2026-06-19T00:00:00.000Z',
      updatedAt: '2026-06-19T00:00:00.000Z',
    })

    vi.setSystemTime(new Date('2026-06-19T01:00:00.000Z'))

    const updatedNodeIds = [secondEvent.id]
    const updatedEdgeIds: string[] = []
    useFushengluStore.getState().updateAnalysisNote(noteId, {
      title: 'Updated chain',
      startId: secondEvent.id,
      targetId: firstEvent.id,
      nodeIds: updatedNodeIds,
      edgeIds: updatedEdgeIds,
      summary: 'Updated reasoning summary.',
    })

    updatedNodeIds.push('mutated-after-update')
    updatedEdgeIds.push('mutated-edge-after-update')

    const updated = useFushengluStore.getState().projects[0]?.analysisNotes[0]

    expect(updated).toMatchObject({
      id: noteId,
      title: 'Updated chain',
      graphMode: 'events',
      startId: secondEvent.id,
      targetId: firstEvent.id,
      nodeIds: [secondEvent.id],
      edgeIds: [],
      summary: 'Updated reasoning summary.',
      createdAt: '2026-06-19T00:00:00.000Z',
      updatedAt: '2026-06-19T01:00:00.000Z',
    })

    useFushengluStore.getState().deleteAnalysisNote(noteId)

    expect(useFushengluStore.getState().projects[0]?.analysisNotes).toEqual([])
  })

  it('does not touch project data when updating or deleting a missing analysis note', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T02:00:00.000Z'))

    const project = makeStoreProject('project-missing-note-actions')
    setStoreProject(project)

    const originalUpdatedAt = useFushengluStore.getState().projects[0]?.updatedAt

    useFushengluStore.getState().updateAnalysisNote('missing-note', {
      title: 'Should not be written',
    })
    useFushengluStore.getState().deleteAnalysisNote('missing-note')

    const currentProject = useFushengluStore.getState().projects[0]

    expect(currentProject?.analysisNotes).toEqual([])
    expect(currentProject?.updatedAt).toBe(originalUpdatedAt)
  })

  it('targets the project from the current route before falling back to the first project', () => {
    const firstProject = makeStoreProject('project-first-note-route')
    const routedProject = makeStoreProject('project-routed-note-route')
    const routedEvent = routedProject.events[0]

    if (!routedEvent) throw new Error('Expected sample event')

    useFushengluStore.setState({
      projects: [firstProject, routedProject],
      theme: 'light',
      sidebarCollapsed: false,
      backendStatus: 'offline',
    })
    window.history.pushState({}, '', `/projects/${routedProject.id}/relations`)

    const noteId = useFushengluStore.getState().addAnalysisNote({
      title: 'Route scoped note',
      graphMode: 'events',
      startId: routedEvent.id,
      nodeIds: [routedEvent.id],
      edgeIds: [],
      summary: 'This note belongs to the routed project.',
    })

    const projects = useFushengluStore.getState().projects

    expect(projects.find((project) => project.id === firstProject.id)?.analysisNotes).toEqual([])
    expect(projects.find((project) => project.id === routedProject.id)?.analysisNotes[0]?.id).toBe(
      noteId,
    )
  })

  it('targets the project from a desktop hash route', () => {
    const firstProject = makeStoreProject('project-first-hash-route')
    const routedProject = makeStoreProject('project-routed-hash-route')
    const routedEvent = routedProject.events[0]

    if (!routedEvent) throw new Error('Expected sample event')

    useFushengluStore.setState({
      projects: [firstProject, routedProject],
      theme: 'light',
      sidebarCollapsed: false,
      backendStatus: 'offline',
    })
    window.history.pushState({}, '', '/index.html#/projects/project-routed-hash-route/events')

    const noteId = useFushengluStore.getState().addAnalysisNote({
      title: 'Hash route scoped note',
      graphMode: 'events',
      startId: routedEvent.id,
      nodeIds: [routedEvent.id],
      edgeIds: [],
      summary: 'This note belongs to the hash-routed project.',
    })

    const projects = useFushengluStore.getState().projects

    expect(projects.find((project) => project.id === firstProject.id)?.analysisNotes).toEqual([])
    expect(projects.find((project) => project.id === routedProject.id)?.analysisNotes[0]?.id).toBe(
      noteId,
    )
  })

  it('keeps imported analysis notes and clears them with project data', () => {
    const project = makeStoreProject('project-imported-note-actions')
    const firstEntity = project.entities[0]
    const secondEntity = project.entities[1]
    const firstRelation = project.entityRelations[0]

    if (!firstEntity || !secondEntity || !firstRelation) {
      throw new Error('Expected sample entity graph')
    }

    setStoreProject({ ...project, analysisNotes: [] })

    const importedNote = {
      id: 'note-imported',
      title: 'Imported note',
      graphMode: 'entities' as const,
      startId: firstEntity.id,
      targetId: secondEntity.id,
      nodeIds: [firstEntity.id, secondEntity.id],
      edgeIds: [firstRelation.id],
      summary: 'Imported reasoning should survive replace.',
      createdAt: '2026-06-18T00:00:00.000Z',
      updatedAt: '2026-06-18T00:00:00.000Z',
    }

    useFushengluStore.getState().replaceProjectData(project.id, {
      ...project,
      analysisNotes: [importedNote],
    })

    expect(useFushengluStore.getState().projects[0]?.analysisNotes).toEqual([importedNote])

    useFushengluStore.getState().clearProjectData(project.id)

    expect(useFushengluStore.getState().projects[0]?.analysisNotes).toEqual([])
  })

  it('passes backup reasons for high-risk project writes', () => {
    const project = makeStoreProject('project-risky-write-reasons')
    setStoreProject(project)

    useFushengluStore.getState().replaceProjectData(project.id, {
      ...project,
      title: 'Imported project',
    })
    useFushengluStore.getState().restoreSampleData(project.id)
    useFushengluStore.getState().clearProjectData(project.id)
    useFushengluStore.getState().deleteProject(project.id)

    expect(saveProjectToBackend).toHaveBeenCalledWith(
      expect.objectContaining({ id: project.id, title: 'Imported project' }),
      { backupReason: 'replace-project-data' },
    )
    expect(saveProjectToBackend).toHaveBeenCalledWith(
      expect.objectContaining({ id: project.id }),
      { backupReason: 'restore-sample-data' },
    )
    expect(saveProjectToBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        id: project.id,
        entities: [],
        events: [],
        entityRelations: [],
        eventLinks: [],
        libraryItems: [],
        analysisNotes: [],
      }),
      { backupReason: 'clear-project-data' },
    )
    expect(deleteProjectFromBackend).toHaveBeenCalledWith(project.id, {
      backupReason: 'delete-project',
    })
  })
})
