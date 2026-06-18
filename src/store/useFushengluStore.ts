import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createProjectFromTemplate, createSampleProject, sampleProjects } from '../data/sampleData'
import { inferTemplateId } from '../templates/projectTemplates'
import {
  deleteProjectFromBackend,
  fetchProjectsFromBackend,
  saveProjectToBackend,
} from '../lib/fushengluApi'
import { devLogger } from '../lib/devLogger'
import type {
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

type StoreState = {
  projects: FushengProject[]
  theme: ThemeMode
  sidebarCollapsed: boolean
  backendStatus: BackendStatus
  hydrateFromBackend: () => Promise<void>
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
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
  replaceProjectData: (projectId: string, importedProject: Partial<FushengProject>) => void
  restoreSampleData: (projectId: string) => void
  clearProjectData: (projectId: string) => void
}

const SCHEMA_VERSION = 4
const LEGACY_BROKEN_PROJECT_ID = 'project-zizhi-tongjian'

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

const normalizePositionMap = (
  positions: FushengProject['entityNodePositions'] | FushengProject['eventNodePositions'] | undefined,
) => {
  if (!positions || typeof positions !== 'object') return {}

  return Object.fromEntries(
    Object.entries(positions)
      .filter(([, position]) => Number.isFinite(position?.x) && Number.isFinite(position?.y))
      .map(([id, position]) => [id, { x: position.x, y: position.y }]),
  )
}

const normalizeStyle = (style?: EdgeVisualStyle): EdgeVisualStyle | undefined => {
  if (!style) return undefined

  return {
    lineStyle: style.lineStyle,
    tone: style.tone,
    animated: style.animated,
  }
}

const normalizeProject = (project: FushengProject): FushengProject => ({
  ...project,
  schemaVersion: project.schemaVersion || SCHEMA_VERSION,
  templateId: inferTemplateId(project.templateId, project.category),
  entities: Array.isArray(project.entities)
    ? project.entities.map((entity) => ({ ...entity, tags: [...(entity.tags || [])] }))
    : [],
  events: Array.isArray(project.events)
    ? project.events.map((event) => ({
        ...event,
        relatedEntityIds: [...(event.relatedEntityIds || [])],
        tags: [...(event.tags || [])],
      }))
    : [],
  entityRelations: Array.isArray(project.entityRelations)
    ? project.entityRelations.map((relation) => ({
        ...relation,
        style: normalizeStyle(relation.style),
      }))
    : [],
  eventLinks: Array.isArray(project.eventLinks)
    ? project.eventLinks.map((link) => ({
        ...link,
        style: normalizeStyle(link.style),
      }))
    : [],
  libraryItems: Array.isArray(project.libraryItems)
    ? project.libraryItems.map((item) => ({ ...item, tags: [...(item.tags || [])] }))
    : [],
  entityNodePositions: normalizePositionMap(project.entityNodePositions),
  eventNodePositions: normalizePositionMap(project.eventNodePositions),
})

const isLegacyBrokenProject = (project: FushengProject) =>
  project.id === LEGACY_BROKEN_PROJECT_ID &&
  (project.title.includes('?') || project.subtitle.includes('?'))

const normalizeProjects = (projects?: FushengProject[]) =>
  Array.isArray(projects) && projects.length
    ? projects.map(normalizeProject).filter((project) => !isLegacyBrokenProject(project))
    : sampleProjects.map(normalizeProject)

const mergeProjects = (localProjects: FushengProject[], remoteProjects: FushengProject[]) => {
  const merged = new Map<string, FushengProject>()

  remoteProjects
    .map(normalizeProject)
    .filter((project) => !isLegacyBrokenProject(project))
    .forEach((project) => merged.set(project.id, project))
  localProjects.map(normalizeProject).forEach((project) => {
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
  normalizeProject({
    ...current,
    title: importedProject.title || current.title,
    subtitle: importedProject.subtitle || current.subtitle,
    category: importedProject.category || current.category,
    templateId: inferTemplateId(importedProject.templateId, importedProject.category || current.category),
    entities: Array.isArray(importedProject.entities) ? importedProject.entities : [],
    events: Array.isArray(importedProject.events) ? importedProject.events : [],
    entityRelations: Array.isArray(importedProject.entityRelations)
      ? importedProject.entityRelations
      : [],
    eventLinks: Array.isArray(importedProject.eventLinks) ? importedProject.eventLinks : [],
    libraryItems: Array.isArray(importedProject.libraryItems) ? importedProject.libraryItems : [],
    entityNodePositions: importedProject.entityNodePositions || {},
    eventNodePositions: importedProject.eventNodePositions || {},
  })

const withoutKey = <T>(record: Record<string, T>, key: string) =>
  Object.fromEntries(Object.entries(record).filter(([id]) => id !== key))

export const useFushengluStore = create<StoreState>()(
  persist(
    (set, get) => {
      const logState = (message: string, details?: Record<string, unknown>) => {
        devLogger.state('useFushengluStore', message, details)
      }

      const logEvent = (message: string, details?: Record<string, unknown>) => {
        devLogger.event('useFushengluStore', message, details)
      }

      const syncProject = async (project: FushengProject) => {
        try {
          await saveProjectToBackend(normalizeProject(project))
          logState('Backend sync succeeded', { projectId: project.id })
          set({ backendStatus: 'online' })
        } catch (error) {
          logState('Backend sync failed', {
            projectId: project.id,
            message: error instanceof Error ? error.message : String(error),
          })
          set({ backendStatus: 'offline' })
        }
      }

      const commitProject = (
        projectId: string,
        updater: (project: FushengProject) => FushengProject,
      ) => {
        let changedProject: FushengProject | undefined

        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return normalizeProject(project)

            changedProject = touchProject(normalizeProject(updater(normalizeProject(project))))
            return changedProject
          }),
        }))

        if (changedProject) void syncProject(changedProject)
      }

      return {
        projects: sampleProjects.map(normalizeProject),
        theme: 'light',
        sidebarCollapsed: false,
        backendStatus: 'checking',

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

        addProject: (draft) => {
          const id = makeId('project')
          const project: FushengProject = normalizeProject({
            ...createProjectFromTemplate(
              draft.templateId,
              id,
              draft.title || '未命名图谱',
              draft.subtitle || '一份新的叙事案卷。',
            ),
            templateId: draft.templateId,
            category: draft.category,
          })

          set((state) => ({ projects: [project, ...state.projects.map(normalizeProject)] }))
          logEvent('Project created', {
            projectId: id,
            templateId: draft.templateId,
            category: draft.category,
          })
          void syncProject(project)
          return id
        },

        updateProjectMeta: (projectId, draft) => {
          commitProject(projectId, (project) => ({
            ...project,
            ...draft,
          }))
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
          void deleteProjectFromBackend(projectId)
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
          commitProject(projectId, (project) => ({
            ...project,
            entities: [...project.entities, { id, ...draft }],
          }))
          logEvent('Entity created', { projectId, entityId: id, type: draft.type })
          return id
        },

        updateEntity: (projectId, entityId, draft) => {
          commitProject(projectId, (project) => ({
            ...project,
            entities: project.entities.map((entity) =>
              entity.id === entityId ? { id: entityId, ...draft } : entity,
            ),
          }))
          logEvent('Entity updated', { projectId, entityId, type: draft.type })
        },

        deleteEntity: (projectId, entityId) => {
          commitProject(projectId, (project) => ({
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
          }))
          logEvent('Entity deleted', { projectId, entityId })
        },

        addEvent: (projectId, draft) => {
          const id = makeId('event')
          commitProject(projectId, (project) => ({
            ...project,
            events: [...project.events, { id, ...draft }],
          }))
          logEvent('Event created', { projectId, eventId: id, eventType: draft.eventType })
          return id
        },

        updateEvent: (projectId, eventId, draft) => {
          commitProject(projectId, (project) => ({
            ...project,
            events: project.events.map((event) =>
              event.id === eventId ? { id: eventId, ...draft } : event,
            ),
          }))
          logEvent('Event updated', { projectId, eventId, eventType: draft.eventType })
        },

        deleteEvent: (projectId, eventId) => {
          commitProject(projectId, (project) => ({
            ...project,
            events: project.events.filter((event) => event.id !== eventId),
            eventLinks: project.eventLinks.filter(
              (link) => link.sourceEventId !== eventId && link.targetEventId !== eventId,
            ),
            eventNodePositions: withoutKey(project.eventNodePositions, eventId),
          }))
          logEvent('Event deleted', { projectId, eventId })
        },

        addEntityRelation: (projectId, draft) => {
          const id = makeId('relation')
          commitProject(projectId, (project) => ({
            ...project,
            entityRelations: [...project.entityRelations, { id, ...draft }],
          }))
          logEvent('Entity relation created', {
            projectId,
            relationId: id,
            relationType: draft.type,
          })
          return id
        },

        updateEntityRelationStyle: (projectId, relationId, style) => {
          commitProject(projectId, (project) => ({
            ...project,
            entityRelations: project.entityRelations.map((relation) =>
              relation.id === relationId ? { ...relation, style } : relation,
            ),
          }))
          logEvent('Entity relation style updated', { projectId, relationId })
        },

        deleteEntityRelation: (projectId, relationId) => {
          commitProject(projectId, (project) => ({
            ...project,
            entityRelations: project.entityRelations.filter((relation) => relation.id !== relationId),
          }))
          logEvent('Entity relation deleted', { projectId, relationId })
        },

        addEventLink: (projectId, draft) => {
          const id = makeId('eventlink')
          commitProject(projectId, (project) => ({
            ...project,
            eventLinks: [...project.eventLinks, { id, ...draft }],
          }))
          logEvent('Event link created', {
            projectId,
            linkId: id,
            linkType: draft.type,
          })
          return id
        },

        updateEventLinkStyle: (projectId, linkId, style) => {
          commitProject(projectId, (project) => ({
            ...project,
            eventLinks: project.eventLinks.map((link) =>
              link.id === linkId ? { ...link, style } : link,
            ),
          }))
          logEvent('Event link style updated', { projectId, linkId })
        },

        deleteEventLink: (projectId, linkId) => {
          commitProject(projectId, (project) => ({
            ...project,
            eventLinks: project.eventLinks.filter((link) => link.id !== linkId),
          }))
          logEvent('Event link deleted', { projectId, linkId })
        },

        updateEntityNodePosition: (projectId, entityId, position) => {
          commitProject(projectId, (project) => ({
            ...project,
            entityNodePositions: {
              ...project.entityNodePositions,
              [entityId]: position,
            },
          }))
        },

        updateEventNodePosition: (projectId, eventId, position) => {
          commitProject(projectId, (project) => ({
            ...project,
            eventNodePositions: {
              ...project.eventNodePositions,
              [eventId]: position,
            },
          }))
        },

        batchUpdateEntityNodePositions: (projectId, positions) => {
          commitProject(projectId, (project) => ({
            ...project,
            entityNodePositions: {
              ...project.entityNodePositions,
              ...positions,
            },
          }))
        },

        batchUpdateEventNodePositions: (projectId, positions) => {
          commitProject(projectId, (project) => ({
            ...project,
            eventNodePositions: {
              ...project.eventNodePositions,
              ...positions,
            },
          }))
        },

        addLibraryItem: (projectId, draft) => {
          const id = makeId('library')
          commitProject(projectId, (project) => ({
            ...project,
            libraryItems: [{ id, createdAt: now(), ...draft }, ...project.libraryItems],
          }))
          logEvent('Library item created', { projectId, itemId: id, kind: draft.kind })
          return id
        },

        deleteLibraryItem: (projectId, itemId) => {
          commitProject(projectId, (project) => ({
            ...project,
            libraryItems: project.libraryItems.filter((item) => item.id !== itemId),
          }))
          logEvent('Library item deleted', { projectId, itemId })
        },

        replaceProjectData: (projectId, importedProject) => {
          commitProject(projectId, (project) => cleanImportedProject(project, importedProject))
          logEvent('Project data replaced', {
            projectId,
            entityCount: importedProject.entities?.length || 0,
            eventCount: importedProject.events?.length || 0,
            libraryItemCount: importedProject.libraryItems?.length || 0,
          })
        },

        restoreSampleData: (projectId) => {
          commitProject(projectId, (project) => ({
            ...createSampleProject(
              project.id,
              project.title,
              project.category,
              project.subtitle,
              project.templateId,
            ),
            updatedAt: now(),
          }))
          logEvent('Sample data restored', { projectId })
        },

        clearProjectData: (projectId) => {
          commitProject(projectId, (project) => ({
            ...project,
            entities: [],
            events: [],
            entityRelations: [],
            eventLinks: [],
            libraryItems: [],
            entityNodePositions: {},
            eventNodePositions: {},
          }))
          logEvent('Project data cleared', { projectId })
        },
      }
    },
    {
      name: 'fushenglu-storage',
      version: 4,
      partialize: (state) => ({
        projects: state.projects.map(normalizeProject),
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<StoreState>
        return {
          ...state,
          projects: normalizeProjects(state.projects),
          theme: state.theme || 'light',
          sidebarCollapsed: Boolean(state.sidebarCollapsed),
          backendStatus: 'checking',
        }
      },
    },
  ),
)
