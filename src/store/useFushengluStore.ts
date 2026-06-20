import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createProjectFromTemplate, createSampleProject, sampleProjects } from '../data/sampleData'
import {
  deleteProjectFromBackend,
  fetchProjectsFromBackend,
  saveProjectToBackend,
} from '../lib/fushengluApi'
import { devLogger } from '../lib/devLogger'
import { getProjectIdFromLocation } from '../routes/currentProjectRoute'
import {
  FUSHENGLU_SCHEMA_VERSION,
  inferNormalizedTemplateId,
  isLegacyBrokenProject,
  normalizeProjectForStorage,
} from '../shared/projectNormalization'
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
import type {
  AnalysisNoteDraft,
  BackendStatus,
  EdgeVisualStyle,
  EntityDraft,
  EntityRelationDraft,
  EventLinkDraft,
  FushengProject,
  GraphNodePosition,
  LibraryItem,
  ProjectCategory,
  ProjectTemplateId,
  StoryEventDraft,
  ThemeMode,
} from '../types'

type ProjectDraft = {
  title: string
  subtitle: string
  category: ProjectCategory
  templateId: ProjectTemplateId
}

type CommitProjectOptions = {
  backupReason?: string
  historyLabel?: string
  skipHistory?: boolean
  mergeKey?: string
  mergeWindowMs?: number
}

type StoreState = {
  projects: FushengProject[]
  theme: ThemeMode
  sidebarCollapsed: boolean
  sidebarWidth: number
  backendStatus: BackendStatus
  undoStacksByProjectId: ProjectHistoryStacks
  redoStacksByProjectId: ProjectHistoryStacks
  saveStatusByProjectId: Record<string, ProjectSaveStatus>
  hydrateFromBackend: () => Promise<void>
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  undoProject: (projectId: string) => void
  redoProject: (projectId: string) => void
  canUndoProject: (projectId: string) => boolean
  canRedoProject: (projectId: string) => boolean
  addProject: (draft: ProjectDraft) => string
  updateProjectMeta: (projectId: string, draft: ProjectDraft) => void
  deleteProject: (projectId: string) => void
  addEntity: (projectId: string, draft: EntityDraft) => string
  updateEntity: (projectId: string, entityId: string, draft: EntityDraft) => void
  deleteEntity: (projectId: string, entityId: string) => void
  addEvent: (projectId: string, draft: StoryEventDraft) => string
  updateEvent: (projectId: string, eventId: string, draft: StoryEventDraft) => void
  deleteEvent: (projectId: string, eventId: string) => void
  addEntityRelation: (projectId: string, draft: EntityRelationDraft) => string
  updateEntityRelationStyle: (
    projectId: string,
    relationId: string,
    style: EdgeVisualStyle,
  ) => void
  deleteEntityRelation: (projectId: string, relationId: string) => void
  addEventLink: (projectId: string, draft: EventLinkDraft) => string
  updateEventLinkStyle: (projectId: string, linkId: string, style: EdgeVisualStyle) => void
  deleteEventLink: (projectId: string, linkId: string) => void
  updateEntityNodePosition: (
    projectId: string,
    entityId: string,
    position: GraphNodePosition,
  ) => void
  updateEventNodePosition: (projectId: string, eventId: string, position: GraphNodePosition) => void
  batchUpdateEntityNodePositions: (
    projectId: string,
    positions: Record<string, GraphNodePosition>,
  ) => void
  batchUpdateEventNodePositions: (
    projectId: string,
    positions: Record<string, GraphNodePosition>,
  ) => void
  addLibraryItem: (
    projectId: string,
    draft: Omit<LibraryItem, 'id' | 'createdAt'>,
  ) => string
  deleteLibraryItem: (projectId: string, itemId: string) => void
  addAnalysisNote: (note: AnalysisNoteDraft) => string
  updateAnalysisNote: (id: string, note: Partial<AnalysisNoteDraft>) => void
  deleteAnalysisNote: (id: string) => void
  replaceProjectData: (projectId: string, importedProject: Partial<FushengProject>) => void
  restoreSampleData: (projectId: string) => void
  clearProjectData: (projectId: string) => void
}

export const CLIENT_SCHEMA_VERSION = FUSHENGLU_SCHEMA_VERSION

const now = () => new Date().toISOString()

const makeId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

const touchProject = (project: FushengProject): FushengProject => ({
  ...project,
  updatedAt: now(),
})

const normalizeProjects = (projects?: FushengProject[]) =>
  Array.isArray(projects) && projects.length
    ? projects.map(normalizeProjectForStorage).filter((project) => !isLegacyBrokenProject(project))
    : sampleProjects.map(normalizeProjectForStorage)

const mergeProjects = (localProjects: FushengProject[], remoteProjects: FushengProject[]) => {
  const merged = new Map<string, FushengProject>()

  remoteProjects
    .map(normalizeProjectForStorage)
    .filter((project) => !isLegacyBrokenProject(project))
    .forEach((project) => merged.set(project.id, project))
  localProjects.map(normalizeProjectForStorage).forEach((project) => {
    if (isLegacyBrokenProject(project)) return
    const remoteProject = merged.get(project.id)
    if (!remoteProject || new Date(project.updatedAt).getTime() >= new Date(remoteProject.updatedAt).getTime()) {
      merged.set(project.id, project)
    }
  })

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

const cleanImportedProject = (
  current: FushengProject,
  importedProject: Partial<FushengProject>,
): FushengProject =>
  normalizeProjectForStorage({
    ...current,
    title: importedProject.title || current.title,
    subtitle: importedProject.subtitle || current.subtitle,
    category: importedProject.category || current.category,
    templateId: inferNormalizedTemplateId(
      importedProject.templateId,
      importedProject.category || current.category,
    ),
    entities: Array.isArray(importedProject.entities) ? importedProject.entities : [],
    events: Array.isArray(importedProject.events) ? importedProject.events : [],
    entityRelations: Array.isArray(importedProject.entityRelations)
      ? importedProject.entityRelations
      : [],
    eventLinks: Array.isArray(importedProject.eventLinks) ? importedProject.eventLinks : [],
    libraryItems: Array.isArray(importedProject.libraryItems) ? importedProject.libraryItems : [],
    analysisNotes: Array.isArray(importedProject.analysisNotes)
      ? importedProject.analysisNotes
      : [],
    entityNodePositions: importedProject.entityNodePositions || {},
    eventNodePositions: importedProject.eventNodePositions || {},
  })

const withoutKey = <T>(record: Record<string, T>, key: string) =>
  Object.fromEntries(Object.entries(record).filter(([id]) => id !== key))

const cloneAnalysisNoteDraft = <T extends Partial<AnalysisNoteDraft>>(draft: T): T =>
  ({
    ...draft,
    ...(draft.nodeIds ? { nodeIds: [...draft.nodeIds] } : {}),
    ...(draft.edgeIds ? { edgeIds: [...draft.edgeIds] } : {}),
  }) as T

export const useFushengluStore = create<StoreState>()(
  persist(
    (set, get) => {
      const logState = (message: string, details?: Record<string, unknown>) => {
        devLogger.state('useFushengluStore', message, details)
      }

      const logEvent = (message: string, details?: Record<string, unknown>) => {
        devLogger.event('useFushengluStore', message, details)
      }

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

      const commitProject = (
        projectId: string,
        updater: (project: FushengProject) => FushengProject | undefined,
        options?: CommitProjectOptions,
      ) => {
        let changedProject: FushengProject | undefined

        set((state) => {
          let historyUpdate:
            | {
                undoStacksByProjectId: ProjectHistoryStacks
                redoStacksByProjectId: ProjectHistoryStacks
              }
            | undefined

          const projects = state.projects.map((project) => {
            if (project.id !== projectId) return normalizeProjectForStorage(project)

            const normalizedProject = normalizeProjectForStorage(project)
            const before = cloneProjectSnapshot(normalizedProject)
            const updatedProject = updater(normalizedProject)
            if (!updatedProject) return normalizedProject

            changedProject = touchProject(
              normalizeProjectForStorage(updatedProject),
            )

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

      const getCurrentProjectId = () => {
        const projects = get().projects
        const routeProjectId =
          typeof window === 'undefined'
            ? undefined
            : getProjectIdFromLocation(window.location)

        return projects.some((project) => project.id === routeProjectId)
          ? routeProjectId
          : projects[0]?.id
      }

      return {
        projects: sampleProjects.map(normalizeProjectForStorage),
        theme: 'light',
        sidebarCollapsed: false,
        sidebarWidth: 288,
        backendStatus: 'checking',
        undoStacksByProjectId: {},
        redoStacksByProjectId: {},
        saveStatusByProjectId: {},

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
            for (const project of projects) {
              await syncProject(project)
            }
          } catch (error) {
            logState('Backend hydration failed', {
              message: error instanceof Error ? error.message : String(error),
            })
            set({ backendStatus: 'offline' })
          }
        },

        setTheme: (theme) => set({ theme }),

        toggleTheme: () =>
          set((state) => ({
            theme: state.theme === 'dark' ? 'light' : 'dark',
          })),

        toggleSidebar: () =>
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed,
          })),

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        setSidebarWidth: (width) => set({ sidebarWidth: width }),

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

        addProject: (draft) => {
          const id = makeId('project')
          const project: FushengProject = normalizeProjectForStorage({
            ...createProjectFromTemplate(
              draft.templateId,
              id,
              draft.title || '未命名图谱',
              draft.subtitle || '一份新的叙事案卷。',
            ),
            templateId: draft.templateId,
            category: draft.category,
          })

          set((state) => ({ projects: [project, ...state.projects.map(normalizeProjectForStorage)] }))
          logEvent('Project created', {
            projectId: id,
            templateId: draft.templateId,
            category: draft.category,
          })
          void syncProject(project)
          return id
        },

        updateProjectMeta: (projectId, draft) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              ...draft,
            }),
            { historyLabel: 'Update project metadata' },
          )
          logEvent('Project metadata updated', {
            projectId,
            templateId: draft.templateId,
            category: draft.category,
          })
        },

        deleteProject: (projectId) => {
          set((state) => ({
            projects: state.projects.filter((project) => project.id !== projectId),
          }))
          logEvent('Project deleted', { projectId })
          void deleteProjectFromBackend(projectId, { backupReason: 'delete-project' })
            .then(() => {
              logState('Backend delete succeeded', { projectId })
              set({ backendStatus: 'online' })
            })
            .catch((error) => {
              logState('Backend delete failed', {
                projectId,
                message: error instanceof Error ? error.message : String(error),
              })
              set({ backendStatus: 'offline' })
            })
        },

        addEntity: (projectId, draft) => {
          const id = makeId('entity')
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entities: [...project.entities, { id, ...draft }],
            }),
            { historyLabel: 'Add entity' },
          )
          logEvent('Entity created', { projectId, entityId: id, type: draft.type })
          return id
        },

        updateEntity: (projectId, entityId, draft) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entities: project.entities.map((entity) =>
                entity.id === entityId ? { id: entityId, ...draft } : entity,
              ),
            }),
            { historyLabel: 'Update entity' },
          )
          logEvent('Entity updated', { projectId, entityId, type: draft.type })
        },

        deleteEntity: (projectId, entityId) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entities: project.entities.filter((entity) => entity.id !== entityId),
              entityRelations: project.entityRelations.filter(
                (relation) => relation.sourceId !== entityId && relation.targetId !== entityId,
              ),
              events: project.events.map((event) => ({
                ...event,
                relatedEntityIds: event.relatedEntityIds.filter((id) => id !== entityId),
              })),
              entityNodePositions: withoutKey(project.entityNodePositions, entityId),
            }),
            { historyLabel: 'Delete entity' },
          )
          logEvent('Entity deleted', { projectId, entityId })
        },

        addEvent: (projectId, draft) => {
          const id = makeId('event')
          commitProject(
            projectId,
            (project) => ({
              ...project,
              events: [...project.events, { id, ...draft }],
            }),
            { historyLabel: 'Add event' },
          )
          logEvent('Event created', { projectId, eventId: id, eventType: draft.eventType })
          return id
        },

        updateEvent: (projectId, eventId, draft) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              events: project.events.map((event) =>
                event.id === eventId ? { id: eventId, ...draft } : event,
              ),
            }),
            { historyLabel: 'Update event' },
          )
          logEvent('Event updated', { projectId, eventId, eventType: draft.eventType })
        },

        deleteEvent: (projectId, eventId) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              events: project.events.filter((event) => event.id !== eventId),
              eventLinks: project.eventLinks.filter(
                (link) => link.sourceEventId !== eventId && link.targetEventId !== eventId,
              ),
              eventNodePositions: withoutKey(project.eventNodePositions, eventId),
            }),
            { historyLabel: 'Delete event' },
          )
          logEvent('Event deleted', { projectId, eventId })
        },

        addEntityRelation: (projectId, draft) => {
          const id = makeId('relation')
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entityRelations: [...project.entityRelations, { id, ...draft }],
            }),
            { historyLabel: 'Add entity relation' },
          )
          logEvent('Entity relation created', {
            projectId,
            relationId: id,
            relationType: draft.type,
          })
          return id
        },

        updateEntityRelationStyle: (projectId, relationId, style) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entityRelations: project.entityRelations.map((relation) =>
                relation.id === relationId ? { ...relation, style } : relation,
              ),
            }),
            {
              historyLabel: 'Update entity relation style',
              mergeKey: `entity-relation-style:${relationId}`,
            },
          )
          logEvent('Entity relation style updated', { projectId, relationId })
        },

        deleteEntityRelation: (projectId, relationId) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entityRelations: project.entityRelations.filter((relation) => relation.id !== relationId),
            }),
            { historyLabel: 'Delete entity relation' },
          )
          logEvent('Entity relation deleted', { projectId, relationId })
        },

        addEventLink: (projectId, draft) => {
          const id = makeId('eventlink')
          commitProject(
            projectId,
            (project) => ({
              ...project,
              eventLinks: [...project.eventLinks, { id, ...draft }],
            }),
            { historyLabel: 'Add event link' },
          )
          logEvent('Event link created', {
            projectId,
            linkId: id,
            linkType: draft.type,
          })
          return id
        },

        updateEventLinkStyle: (projectId, linkId, style) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              eventLinks: project.eventLinks.map((link) =>
                link.id === linkId ? { ...link, style } : link,
              ),
            }),
            {
              historyLabel: 'Update event link style',
              mergeKey: `event-link-style:${linkId}`,
            },
          )
          logEvent('Event link style updated', { projectId, linkId })
        },

        deleteEventLink: (projectId, linkId) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              eventLinks: project.eventLinks.filter((link) => link.id !== linkId),
            }),
            { historyLabel: 'Delete event link' },
          )
          logEvent('Event link deleted', { projectId, linkId })
        },

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

        updateEventNodePosition: (projectId, eventId, position) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              eventNodePositions: {
                ...project.eventNodePositions,
                [eventId]: position,
              },
            }),
            {
              historyLabel: 'Move event node',
              mergeKey: `event-position:${eventId}`,
            },
          )
        },

        batchUpdateEntityNodePositions: (projectId, positions) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entityNodePositions: {
                ...project.entityNodePositions,
                ...positions,
              },
            }),
            {
              historyLabel: 'Apply entity graph layout',
              mergeKey: `entity-layout:${projectId}:${Date.now()}`,
              mergeWindowMs: 0,
            },
          )
        },

        batchUpdateEventNodePositions: (projectId, positions) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              eventNodePositions: {
                ...project.eventNodePositions,
                ...positions,
              },
            }),
            {
              historyLabel: 'Apply event graph layout',
              mergeKey: `event-layout:${projectId}:${Date.now()}`,
              mergeWindowMs: 0,
            },
          )
        },

        addLibraryItem: (projectId, draft) => {
          const id = makeId('library')
          commitProject(
            projectId,
            (project) => ({
              ...project,
              libraryItems: [{ id, createdAt: now(), ...draft }, ...project.libraryItems],
            }),
            { historyLabel: 'Add library item' },
          )
          logEvent('Library item created', { projectId, itemId: id, kind: draft.kind })
          return id
        },

        deleteLibraryItem: (projectId, itemId) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              libraryItems: project.libraryItems.filter((item) => item.id !== itemId),
            }),
            { historyLabel: 'Delete library item' },
          )
          logEvent('Library item deleted', { projectId, itemId })
        },

        addAnalysisNote: (draft) => {
          const id = makeId('analysis')
          const timestamp = now()
          const projectId = getCurrentProjectId()
          if (!projectId) return id

          commitProject(
            projectId,
            (project) => ({
              ...project,
              analysisNotes: [
                ...project.analysisNotes,
                {
                  ...cloneAnalysisNoteDraft(draft),
                  id,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                },
              ],
            }),
            { historyLabel: 'Add analysis note' },
          )
          logEvent('Analysis note created', {
            projectId,
            noteId: id,
            graphMode: draft.graphMode,
          })
          return id
        },

        updateAnalysisNote: (noteId, draft) => {
          const projectId = getCurrentProjectId()
          if (!projectId) return

          const updates = cloneAnalysisNoteDraft(draft)
          const timestamp = now()
          let updated = false

          commitProject(
            projectId,
            (project) => {
              if (!project.analysisNotes.some((note) => note.id === noteId)) return undefined

              updated = true
              return {
                ...project,
                analysisNotes: project.analysisNotes.map((note) =>
                  note.id === noteId
                    ? {
                        ...note,
                        ...updates,
                        createdAt: note.createdAt,
                        updatedAt: timestamp,
                      }
                    : note,
                ),
              }
            },
            {
              historyLabel: 'Update analysis note',
              mergeKey: `analysis-note:${noteId}`,
            },
          )

          if (updated) logEvent('Analysis note updated', { projectId, noteId })
        },

        deleteAnalysisNote: (noteId) => {
          const projectId = getCurrentProjectId()
          if (!projectId) return

          let deleted = false

          commitProject(
            projectId,
            (project) => {
              if (!project.analysisNotes.some((note) => note.id === noteId)) return undefined

              deleted = true
              return {
                ...project,
                analysisNotes: project.analysisNotes.filter((note) => note.id !== noteId),
              }
            },
            { historyLabel: 'Delete analysis note' },
          )

          if (deleted) logEvent('Analysis note deleted', { projectId, noteId })
        },

        replaceProjectData: (projectId, importedProject) => {
          commitProject(
            projectId,
            (project) => cleanImportedProject(project, importedProject),
            {
              backupReason: 'replace-project-data',
              historyLabel: 'Replace project data',
            },
          )
          logEvent('Project data replaced', {
            projectId,
            entityCount: importedProject.entities?.length || 0,
            eventCount: importedProject.events?.length || 0,
            libraryItemCount: importedProject.libraryItems?.length || 0,
          })
        },

        restoreSampleData: (projectId) => {
          commitProject(
            projectId,
            (project) => ({
              ...createSampleProject(
                project.id,
                project.title,
                project.category,
                project.subtitle,
                project.templateId,
              ),
              updatedAt: now(),
            }),
            {
              backupReason: 'restore-sample-data',
              historyLabel: 'Restore sample data',
            },
          )
          logEvent('Sample data restored', { projectId })
        },

        clearProjectData: (projectId) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entities: [],
              events: [],
              entityRelations: [],
              eventLinks: [],
              libraryItems: [],
              analysisNotes: [],
              entityNodePositions: {},
              eventNodePositions: {},
            }),
            {
              backupReason: 'clear-project-data',
              historyLabel: 'Clear project data',
            },
          )
          logEvent('Project data cleared', { projectId })
        },
      }
    },
    {
      name: 'fushenglu-storage',
      version: 4,
      partialize: (state) => ({
        projects: state.projects.map(normalizeProjectForStorage),
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<StoreState>
        return {
          ...state,
          projects: normalizeProjects(state.projects),
          theme: state.theme || 'light',
          sidebarCollapsed: Boolean(state.sidebarCollapsed),
          sidebarWidth: state.sidebarWidth || 288,
          backendStatus: 'checking',
          undoStacksByProjectId: {},
          redoStacksByProjectId: {},
          saveStatusByProjectId: {},
        }
      },
    },
  ),
)
