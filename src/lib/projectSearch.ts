import type { FushengProject, GraphMode } from '../types'

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

const GROUP_LIMIT = 8

const normalize = (value: string) => value.trim().toLocaleLowerCase('zh-CN')

const compact = (values: Array<string | number | null | undefined>) =>
  values
    .filter((value) => value != null && String(value).trim())
    .map((value) => String(value).trim())

const includesQuery = (values: Array<string | number | null | undefined>, query: string) =>
  compact(values).join(' ').toLocaleLowerCase('zh-CN').includes(query)

const clipContext = (values: Array<string | number | null | undefined>) =>
  compact(values).join(' · ').slice(0, 120)

const cap = (results: ProjectSearchResult[]) => results.slice(0, GROUP_LIMIT)

const graphPath = (projectId: string, mode: GraphMode, focusNodeId?: string) => {
  const route = mode === 'entities' ? 'relation-graph' : 'event-graph'
  const basePath = `/projects/${projectId}/${route}`
  return focusNodeId ? `${basePath}?focusNodeId=${encodeURIComponent(focusNodeId)}` : basePath
}

const emptyGroups = (): ProjectSearchGroup[] =>
  GROUPS.map((group) => ({
    ...group,
    results: [],
  }))

export function searchProject(project: FushengProject, rawQuery: string): ProjectSearchResponse {
  const query = normalize(rawQuery)

  if (!query) {
    return { query: rawQuery, total: 0, groups: emptyGroups() }
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
        path: graphPath(project.id, 'entities', entity.id),
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
        path: graphPath(project.id, 'events', event.id),
        focusNodeId: event.id,
      })),
  )

  const entityRelationResults = project.entityRelations
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
        path: graphPath(project.id, 'entities', relation.sourceId),
        focusNodeId: relation.sourceId,
      }
    })

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
        path: graphPath(project.id, 'events', link.sourceEventId),
        focusNodeId: link.sourceEventId,
      }
    })

  const relationResults = cap([...entityRelationResults, ...eventLinkResults])

  const libraryResults = cap(
    project.libraryItems
      .filter((item) => includesQuery([item.title, item.kind, item.content, ...item.tags, item.createdAt], query))
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
        includesQuery(
          [
            note.title,
            note.summary,
            note.graphMode,
            note.startId,
            note.targetId,
            ...note.nodeIds,
            ...note.edgeIds,
          ],
          query,
        ),
      )
      .map((note) => {
        const focusNodeId = note.startId || note.nodeIds[0]

        return {
          id: note.id,
          kind: 'notes' as const,
          title: note.title,
          context: clipContext([note.summary]),
          path: graphPath(project.id, note.graphMode, focusNodeId),
          focusNodeId,
        }
      }),
  )

  const groups: ProjectSearchGroup[] = [
    { kind: 'entities', label: '实体', results: entityResults },
    { kind: 'events', label: '事件', results: eventResults },
    { kind: 'relations', label: '关系', results: relationResults },
    { kind: 'library', label: '资料', results: libraryResults },
    { kind: 'notes', label: '笔记', results: noteResults },
  ]

  return {
    query: rawQuery,
    total: groups.reduce((sum, group) => sum + group.results.length, 0),
    groups,
  }
}
