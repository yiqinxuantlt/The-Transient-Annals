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
    return mode === 'entities' ? { ...project.entityNodePositions } : { ...project.eventNodePositions }
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
