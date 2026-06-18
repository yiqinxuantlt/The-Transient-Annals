import dagre from '@dagrejs/dagre'
import type { Entity, EntityRelation, StoryEvent, EventLink } from '../types'

export type LayoutPositionMap = Record<string, { x: number; y: number }>

export interface LayoutOptions {
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
  nodesep?: number
  ranksep?: number
  edgesep?: number
}

const ENTITY_NODE_WIDTH = 230
const ENTITY_NODE_HEIGHT = 135
const EVENT_NODE_WIDTH = 240
const EVENT_NODE_HEIGHT = 150

/**
 * Run dagre DAG layout on entities + relations.
 * Returns a map of nodeId → { x, y } (top-left corner, absolute coordinates).
 */
export function computeEntityLayout(
  entities: Entity[],
  relations: EntityRelation[],
  opts: LayoutOptions = {},
): LayoutPositionMap {
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: opts.rankdir ?? 'TB',
    nodesep: opts.nodesep ?? 90,
    ranksep: opts.ranksep ?? 130,
    edgesep: opts.edgesep ?? 40,
    marginx: 40,
    marginy: 40,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const entity of entities) {
    g.setNode(entity.id, { width: ENTITY_NODE_WIDTH, height: ENTITY_NODE_HEIGHT })
  }
  for (const rel of relations) {
    if (
      entities.some((e) => e.id === rel.sourceId) &&
      entities.some((e) => e.id === rel.targetId)
    ) {
      g.setEdge(rel.sourceId, rel.targetId)
    }
  }

  dagre.layout(g)

  const positions: LayoutPositionMap = {}
  for (const entity of entities) {
    const node = g.node(entity.id)
    if (node) {
      // dagre returns center coordinates; convert to top-left
      positions[entity.id] = {
        x: Math.round(node.x - ENTITY_NODE_WIDTH / 2),
        y: Math.round(node.y - ENTITY_NODE_HEIGHT / 2),
      }
    }
  }
  return positions
}

/**
 * Run dagre layout on events + event links.
 */
export function computeEventLayout(
  events: StoryEvent[],
  links: EventLink[],
  opts: LayoutOptions = {},
): LayoutPositionMap {
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: opts.rankdir ?? 'LR',
    nodesep: opts.nodesep ?? 80,
    ranksep: opts.ranksep ?? 120,
    edgesep: opts.edgesep ?? 30,
    marginx: 40,
    marginy: 40,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const event of events) {
    g.setNode(event.id, { width: EVENT_NODE_WIDTH, height: EVENT_NODE_HEIGHT })
  }
  for (const link of links) {
    if (
      events.some((e) => e.id === link.sourceEventId) &&
      events.some((e) => e.id === link.targetEventId)
    ) {
      g.setEdge(link.sourceEventId, link.targetEventId)
    }
  }

  dagre.layout(g)

  const positions: LayoutPositionMap = {}
  for (const event of events) {
    const node = g.node(event.id)
    if (node) {
      positions[event.id] = {
        x: Math.round(node.x - EVENT_NODE_WIDTH / 2),
        y: Math.round(node.y - EVENT_NODE_HEIGHT / 2),
      }
    }
  }
  return positions
}
