import type {
  EdgeVisualStyle,
  Entity,
  EntityRelation,
  EventLink,
  FushengProject,
  GraphMode,
  StoryEvent,
} from '../types'

export type GraphNodeKind = Entity['type'] | 'event'

export type WorkbenchNode = {
  id: string
  label: string
  kind: GraphNodeKind
  description: string
  tags: string[]
  faction?: string
  location?: string
  startYear?: number
  endYear?: number
}

export type WorkbenchEdge = {
  id: string
  sourceId: string
  targetId: string
  type: string
  description?: string
  startYear?: number
  endYear?: number
  style?: EdgeVisualStyle
}

export type WorkbenchGraph = {
  mode: GraphMode
  nodes: WorkbenchNode[]
  edges: WorkbenchEdge[]
}

export type GraphFilters = {
  query: string
  nodeTypes: string[]
  edgeTypes: string[]
  tags: string[]
  factions: string[]
  locations: string[]
  year: number | null
}

export type GraphFilterOptions = {
  nodeTypes: string[]
  edgeTypes: string[]
  tags: string[]
  factions: string[]
  locations: string[]
  minYear: number | null
  maxYear: number | null
}

export type EvidenceNextStep = {
  edgeId: string
  nodeId: string
  label: string
  edgeType: string
  direction: 'outgoing' | 'incoming'
}

export const emptyGraphFilters = (): GraphFilters => ({
  query: '',
  nodeTypes: [],
  edgeTypes: [],
  tags: [],
  factions: [],
  locations: [],
  year: null,
})

const uniqueSorted = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'zh-CN'))

const isFiniteYear = (year: unknown): year is number => typeof year === 'number' && Number.isFinite(year)

const isActiveAtYear = (item: { startYear?: number; endYear?: number }, year: number | null) => {
  if (year == null) return true
  if (item.startYear != null && year < item.startYear) return false
  if (item.endYear != null && year > item.endYear) return false
  return true
}

const normalizedQuery = (query: string) => query.trim().toLowerCase()

const matchesQuery = (parts: Array<string | undefined>, query: string) => {
  const normalized = normalizedQuery(query)
  if (!normalized) return true
  return parts.filter(Boolean).join(' ').toLowerCase().includes(normalized)
}

const nodeMatchesNonQueryFilters = (node: WorkbenchNode, filters: GraphFilters) => {
  if (filters.nodeTypes.length && !filters.nodeTypes.includes(node.kind)) return false
  if (filters.tags.length && !filters.tags.some((tag) => node.tags.includes(tag))) return false
  if (filters.factions.length && (!node.faction || !filters.factions.includes(node.faction))) return false
  if (filters.locations.length && (!node.location || !filters.locations.includes(node.location))) return false
  return isActiveAtYear(node, filters.year)
}

const edgeMatchesNonQueryFilters = (edge: WorkbenchEdge, filters: GraphFilters) => {
  if (filters.edgeTypes.length && !filters.edgeTypes.includes(edge.type)) return false
  return isActiveAtYear(edge, filters.year)
}

export function getGraphRecords(project: FushengProject, mode: GraphMode): WorkbenchGraph {
  if (mode === 'entities') {
    return {
      mode,
      nodes: project.entities.map((entity: Entity) => ({
        id: entity.id,
        label: entity.name,
        kind: entity.type,
        description: entity.identity || entity.description || '',
        tags: [...entity.tags],
        faction: entity.faction,
        location: entity.type === 'place' ? entity.name : undefined,
        startYear: entity.startYear,
        endYear: entity.endYear,
      })),
      edges: project.entityRelations.map((relation: EntityRelation) => ({
        id: relation.id,
        sourceId: relation.sourceId,
        targetId: relation.targetId,
        type: relation.type,
        description: relation.description,
        startYear: relation.startYear,
        endYear: relation.endYear,
        style: relation.style ? { ...relation.style } : undefined,
      })),
    }
  }

  return {
    mode,
    nodes: project.events.map((event: StoryEvent) => ({
      id: event.id,
      label: event.title,
      kind: 'event',
      description: event.description || event.location || event.eventType || '',
      tags: [...event.tags],
      location: event.location,
      startYear: event.startYear,
      endYear: event.endYear,
    })),
    edges: project.eventLinks.map((link: EventLink) => ({
      id: link.id,
      sourceId: link.sourceEventId,
      targetId: link.targetEventId,
      type: link.type,
      description: link.description,
      startYear: link.startYear,
      endYear: link.endYear,
      style: link.style ? { ...link.style } : undefined,
    })),
  }
}

export function collectGraphFilterOptions(graph: WorkbenchGraph): GraphFilterOptions {
  const years = [
    ...graph.nodes.flatMap((node) => [node.startYear, node.endYear]),
    ...graph.edges.flatMap((edge) => [edge.startYear, edge.endYear]),
  ].filter(isFiniteYear)

  return {
    nodeTypes: uniqueSorted(graph.nodes.map((node) => node.kind)),
    edgeTypes: uniqueSorted(graph.edges.map((edge) => edge.type)),
    tags: uniqueSorted(graph.nodes.flatMap((node) => node.tags)),
    factions: uniqueSorted(graph.nodes.map((node) => node.faction)),
    locations: uniqueSorted(graph.nodes.map((node) => node.location)),
    minYear: years.length ? Math.min(...years) : null,
    maxYear: years.length ? Math.max(...years) : null,
  }
}

export function countActiveFilters(filters: GraphFilters): number {
  return [
    filters.query.trim(),
    filters.year == null ? '' : String(filters.year),
    ...filters.nodeTypes,
    ...filters.edgeTypes,
    ...filters.tags,
    ...filters.factions,
    ...filters.locations,
  ].filter(Boolean).length
}

export function filterGraphRecords(graph: WorkbenchGraph, filters: GraphFilters): WorkbenchGraph {
  const candidateNodes = graph.nodes.filter((node) => nodeMatchesNonQueryFilters(node, filters))
  const candidateNodeIds = new Set(candidateNodes.map((node) => node.id))
  const candidateEdges = graph.edges.filter(
    (edge) =>
      candidateNodeIds.has(edge.sourceId) &&
      candidateNodeIds.has(edge.targetId) &&
      edgeMatchesNonQueryFilters(edge, filters),
  )

  const query = normalizedQuery(filters.query)
  const edgeFilterActive = filters.edgeTypes.length > 0

  if (!query) {
    if (!edgeFilterActive) return { ...graph, nodes: candidateNodes, edges: candidateEdges }

    const relatedNodeIds = new Set<string>()
    for (const edge of candidateEdges) {
      relatedNodeIds.add(edge.sourceId)
      relatedNodeIds.add(edge.targetId)
    }

    return {
      ...graph,
      nodes: candidateNodes.filter((node) => relatedNodeIds.has(node.id)),
      edges: candidateEdges,
    }
  }

  const nodeById = new Map(candidateNodes.map((node) => [node.id, node]))
  const queryNodeIds = new Set(
    candidateNodes
      .filter((node) => matchesQuery([node.label, node.description, node.faction, node.location, ...node.tags], query))
      .map((node) => node.id),
  )
  const edgeIds = new Set<string>()
  const includedNodeIds = new Set<string>(queryNodeIds)

  for (const edge of candidateEdges) {
    const source = nodeById.get(edge.sourceId)
    const target = nodeById.get(edge.targetId)
    const edgeMatches = matchesQuery([edge.type, edge.description, source?.label, target?.label], query)
    const touchesMatchedNode = queryNodeIds.has(edge.sourceId) || queryNodeIds.has(edge.targetId)

    if (!edgeMatches && !touchesMatchedNode) continue

    edgeIds.add(edge.id)
    includedNodeIds.add(edge.sourceId)
    includedNodeIds.add(edge.targetId)
  }

  return {
    ...graph,
    nodes: candidateNodes.filter((node) => includedNodeIds.has(node.id)),
    edges: candidateEdges.filter((edge) => edgeIds.has(edge.id)),
  }
}

export function getLinkedNodeIds(graph: WorkbenchGraph, nodeId: string): Set<string> {
  const linked = new Set<string>([nodeId])
  for (const edge of graph.edges) {
    if (edge.sourceId === nodeId) linked.add(edge.targetId)
    if (edge.targetId === nodeId) linked.add(edge.sourceId)
  }
  return linked
}

export function buildEvidenceNextSteps(
  graph: WorkbenchGraph,
  nodeIds: string[],
  edgeIds: string[],
): EvidenceNextStep[] {
  const lastNodeId = nodeIds[nodeIds.length - 1]
  if (!lastNodeId) return []

  const visitedEdges = new Set(edgeIds)
  const visitedNodes = new Set(nodeIds)
  return graph.edges
    .filter((edge) => !visitedEdges.has(edge.id) && (edge.sourceId === lastNodeId || edge.targetId === lastNodeId))
    .map((edge) => {
      const outgoing = edge.sourceId === lastNodeId
      const nodeId = outgoing ? edge.targetId : edge.sourceId
      const node = graph.nodes.find((item) => item.id === nodeId)
      return {
        edgeId: edge.id,
        nodeId,
        label: node?.label || nodeId,
        edgeType: edge.type,
        direction: outgoing ? 'outgoing' : 'incoming',
      } satisfies EvidenceNextStep
    })
    .sort((a, b) => {
      const aVisited = visitedNodes.has(a.nodeId)
      const bVisited = visitedNodes.has(b.nodeId)
      if (aVisited !== bVisited) return aVisited ? 1 : -1
      return a.label.localeCompare(b.label, 'zh-CN')
    })
}
