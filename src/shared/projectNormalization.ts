import type {
  AnalysisNote,
  EdgeVisualStyle,
  FushengProject,
  GraphNodePosition,
  ProjectCategory,
  ProjectTemplateId,
} from '../types'

export const FUSHENGLU_SCHEMA_VERSION = 6
export const LEGACY_BROKEN_PROJECT_ID = 'project-zizhi-tongjian'
const colorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export type FushengDatabase = {
  schemaVersion: number
  projects: FushengProject[]
}

export function inferNormalizedTemplateId(
  templateId?: ProjectTemplateId,
  category?: ProjectCategory,
): ProjectTemplateId {
  if (templateId === 'history' || templateId === 'fiction') return templateId
  return category === 'history' ? 'history' : 'fiction'
}

export function normalizePositionMap(
  positions?: Record<string, GraphNodePosition>,
): Record<string, GraphNodePosition> {
  if (!positions || typeof positions !== 'object') return {}

  return Object.fromEntries(
    Object.entries(positions)
      .filter(([, position]) => Number.isFinite(position?.x) && Number.isFinite(position?.y))
      .map(([id, position]) => [id, { x: position.x, y: position.y }]),
  )
}

export function normalizeEdgeStyle(style?: EdgeVisualStyle): EdgeVisualStyle | undefined {
  if (!style) return undefined

  return {
    lineStyle: style.lineStyle,
    tone: style.tone,
    edgeType: style.edgeType,
    lineWidth: Number.isFinite(style.lineWidth) ? style.lineWidth : undefined,
    animated: style.animated,
    customColor: style.customColor && colorPattern.test(style.customColor) ? style.customColor : undefined,
    opacity: Number.isFinite(style.opacity) ? style.opacity : undefined,
    dashLength: Number.isFinite(style.dashLength) ? style.dashLength : undefined,
    dashGap: Number.isFinite(style.dashGap) ? style.dashGap : undefined,
    arrow: style.arrow,
    lineCap: style.lineCap,
    labelVisible: style.labelVisible,
    shadow: style.shadow,
  }
}

function normalizeAnalysisNotes(
  notes: AnalysisNote[] | undefined,
  entityIds: Set<string>,
  eventIds: Set<string>,
  relationIds: Set<string>,
  eventLinkIds: Set<string>,
): AnalysisNote[] {
  if (!Array.isArray(notes)) return []

  return notes
    .filter((note) => note.id && note.title && (note.graphMode === 'entities' || note.graphMode === 'events'))
    .map((note) => {
      const validNodeIds = note.graphMode === 'entities' ? entityIds : eventIds
      const validEdgeIds = note.graphMode === 'entities' ? relationIds : eventLinkIds
      const createdAt = note.createdAt || new Date().toISOString()

      return {
        id: note.id,
        title: note.title,
        graphMode: note.graphMode,
        startId: note.startId && validNodeIds.has(note.startId) ? note.startId : undefined,
        targetId: note.targetId && validNodeIds.has(note.targetId) ? note.targetId : undefined,
        nodeIds: [...(note.nodeIds || [])].filter((nodeId) => validNodeIds.has(nodeId)),
        edgeIds: [...(note.edgeIds || [])].filter((edgeId) => validEdgeIds.has(edgeId)),
        summary: note.summary || '',
        createdAt,
        updatedAt: note.updatedAt || createdAt,
      }
    })
}

export function enforceProjectIntegrity(project: FushengProject): FushengProject {
  const entityIds = new Set(project.entities.map((entity) => entity.id))
  const eventIds = new Set(project.events.map((event) => event.id))
  const events = project.events.map((event) => ({
    ...event,
    relatedEntityIds: event.relatedEntityIds.filter((entityId) => entityIds.has(entityId)),
  }))
  const entityRelations = project.entityRelations.filter(
    (relation) => entityIds.has(relation.sourceId) && entityIds.has(relation.targetId),
  )
  const eventLinks = project.eventLinks.filter(
    (link) => eventIds.has(link.sourceEventId) && eventIds.has(link.targetEventId),
  )
  const relationIds = new Set(entityRelations.map((relation) => relation.id))
  const eventLinkIds = new Set(eventLinks.map((link) => link.id))

  return {
    ...project,
    events,
    entityRelations,
    eventLinks,
    analysisNotes: normalizeAnalysisNotes(
      project.analysisNotes,
      entityIds,
      eventIds,
      relationIds,
      eventLinkIds,
    ),
    entityNodePositions: Object.fromEntries(
      Object.entries(project.entityNodePositions).filter(([entityId]) => entityIds.has(entityId)),
    ),
    eventNodePositions: Object.fromEntries(
      Object.entries(project.eventNodePositions).filter(([eventId]) => eventIds.has(eventId)),
    ),
  }
}

export function normalizeProjectForStorage(project: FushengProject): FushengProject {
  return enforceProjectIntegrity({
    ...project,
    schemaVersion: FUSHENGLU_SCHEMA_VERSION,
    templateId: inferNormalizedTemplateId(project.templateId, project.category),
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
          style: normalizeEdgeStyle(relation.style),
        }))
      : [],
    eventLinks: Array.isArray(project.eventLinks)
      ? project.eventLinks.map((link) => ({
          ...link,
          style: normalizeEdgeStyle(link.style),
        }))
      : [],
    libraryItems: Array.isArray(project.libraryItems)
      ? project.libraryItems.map((item) => ({ ...item, tags: [...(item.tags || [])] }))
      : [],
    analysisNotes: Array.isArray(project.analysisNotes)
      ? project.analysisNotes.map((note) => ({
          ...note,
          nodeIds: [...(note.nodeIds || [])],
          edgeIds: [...(note.edgeIds || [])],
        }))
      : [],
    entityNodePositions: normalizePositionMap(project.entityNodePositions),
    eventNodePositions: normalizePositionMap(project.eventNodePositions),
  })
}

export function normalizeDatabaseForStorage(database: {
  projects?: FushengProject[]
}): FushengDatabase {
  return {
    schemaVersion: FUSHENGLU_SCHEMA_VERSION,
    projects: Array.isArray(database.projects)
      ? database.projects.map(normalizeProjectForStorage)
      : [],
  }
}

export function isLegacyBrokenProject(project: FushengProject) {
  return (
    project.id === LEGACY_BROKEN_PROJECT_ID &&
    (project.title.includes('?') || project.subtitle.includes('?'))
  )
}
