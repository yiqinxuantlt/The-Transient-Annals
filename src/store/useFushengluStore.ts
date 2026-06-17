import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSampleProject, sampleProjects } from '../data/sampleData'
import type {
  EntityDraft,
  EntityRelationDraft,
  EventLinkDraft,
  FushengProject,
  LibraryItem,
  ProjectCategory,
  StoryEventDraft,
  ThemeMode,
} from '../types'

type ProjectDraft = {
  title: string
  subtitle: string
  category: ProjectCategory
}

type StoreState = {
  projects: FushengProject[]
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  addProject: (draft: ProjectDraft) => string
  updateProjectMeta: (projectId: string, draft: ProjectDraft) => void
  addEntity: (projectId: string, draft: EntityDraft) => string
  updateEntity: (projectId: string, entityId: string, draft: EntityDraft) => void
  deleteEntity: (projectId: string, entityId: string) => void
  addEvent: (projectId: string, draft: StoryEventDraft) => string
  updateEvent: (projectId: string, eventId: string, draft: StoryEventDraft) => void
  deleteEvent: (projectId: string, eventId: string) => void
  addEntityRelation: (projectId: string, draft: EntityRelationDraft) => string
  deleteEntityRelation: (projectId: string, relationId: string) => void
  addEventLink: (projectId: string, draft: EventLinkDraft) => string
  deleteEventLink: (projectId: string, linkId: string) => void
  addLibraryItem: (
    projectId: string,
    draft: Omit<LibraryItem, 'id' | 'createdAt'>,
  ) => string
  deleteLibraryItem: (projectId: string, itemId: string) => void
  replaceProjectData: (projectId: string, importedProject: Partial<FushengProject>) => void
  restoreSampleData: (projectId: string) => void
  clearProjectData: (projectId: string) => void
}

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

const updateProject = (
  projects: FushengProject[],
  projectId: string,
  updater: (project: FushengProject) => FushengProject,
) => projects.map((project) => (project.id === projectId ? touchProject(updater(project)) : project))

const cleanImportedProject = (
  current: FushengProject,
  importedProject: Partial<FushengProject>,
): FushengProject => ({
  ...current,
  title: importedProject.title || current.title,
  subtitle: importedProject.subtitle || current.subtitle,
  category: importedProject.category || current.category,
  entities: Array.isArray(importedProject.entities) ? importedProject.entities : [],
  events: Array.isArray(importedProject.events) ? importedProject.events : [],
  entityRelations: Array.isArray(importedProject.entityRelations)
    ? importedProject.entityRelations
    : [],
  eventLinks: Array.isArray(importedProject.eventLinks) ? importedProject.eventLinks : [],
  libraryItems: Array.isArray(importedProject.libraryItems) ? importedProject.libraryItems : [],
})

export const useFushengluStore = create<StoreState>()(
  persist(
    (set) => ({
      projects: sampleProjects,
      theme: 'light',

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      addProject: (draft) => {
        const id = makeId('project')
        const project: FushengProject = {
          id,
          title: draft.title || '未命名图谱',
          subtitle: draft.subtitle || '一份新的叙事案卷。',
          category: draft.category,
          updatedAt: now(),
          entities: [],
          events: [],
          entityRelations: [],
          eventLinks: [],
          libraryItems: [],
        }

        set((state) => ({ projects: [project, ...state.projects] }))
        return id
      },

      updateProjectMeta: (projectId, draft) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            ...draft,
          })),
        }))
      },

      addEntity: (projectId, draft) => {
        const id = makeId('entity')
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            entities: [...project.entities, { id, ...draft }],
          })),
        }))
        return id
      },

      updateEntity: (projectId, entityId, draft) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            entities: project.entities.map((entity) =>
              entity.id === entityId ? { id: entityId, ...draft } : entity,
            ),
          })),
        }))
      },

      deleteEntity: (projectId, entityId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            entities: project.entities.filter((entity) => entity.id !== entityId),
            entityRelations: project.entityRelations.filter(
              (relation) => relation.sourceId !== entityId && relation.targetId !== entityId,
            ),
            events: project.events.map((event) => ({
              ...event,
              relatedEntityIds: event.relatedEntityIds.filter((id) => id !== entityId),
            })),
          })),
        }))
      },

      addEvent: (projectId, draft) => {
        const id = makeId('event')
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            events: [...project.events, { id, ...draft }],
          })),
        }))
        return id
      },

      updateEvent: (projectId, eventId, draft) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            events: project.events.map((event) =>
              event.id === eventId ? { id: eventId, ...draft } : event,
            ),
          })),
        }))
      },

      deleteEvent: (projectId, eventId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            events: project.events.filter((event) => event.id !== eventId),
            eventLinks: project.eventLinks.filter(
              (link) => link.sourceEventId !== eventId && link.targetEventId !== eventId,
            ),
          })),
        }))
      },

      addEntityRelation: (projectId, draft) => {
        const id = makeId('relation')
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            entityRelations: [...project.entityRelations, { id, ...draft }],
          })),
        }))
        return id
      },

      deleteEntityRelation: (projectId, relationId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            entityRelations: project.entityRelations.filter((relation) => relation.id !== relationId),
          })),
        }))
      },

      addEventLink: (projectId, draft) => {
        const id = makeId('eventlink')
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            eventLinks: [...project.eventLinks, { id, ...draft }],
          })),
        }))
        return id
      },

      deleteEventLink: (projectId, linkId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            eventLinks: project.eventLinks.filter((link) => link.id !== linkId),
          })),
        }))
      },

      addLibraryItem: (projectId, draft) => {
        const id = makeId('library')
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            libraryItems: [{ id, createdAt: now(), ...draft }, ...project.libraryItems],
          })),
        }))
        return id
      },

      deleteLibraryItem: (projectId, itemId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            libraryItems: project.libraryItems.filter((item) => item.id !== itemId),
          })),
        }))
      },

      replaceProjectData: (projectId, importedProject) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) =>
            cleanImportedProject(project, importedProject),
          ),
        }))
      },

      restoreSampleData: (projectId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...createSampleProject(project.id, project.title, project.category, project.subtitle),
            updatedAt: now(),
          })),
        }))
      },

      clearProjectData: (projectId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            entities: [],
            events: [],
            entityRelations: [],
            eventLinks: [],
            libraryItems: [],
          })),
        }))
      },
    }),
    {
      name: 'fushenglu-storage',
      version: 1,
    },
  ),
)
