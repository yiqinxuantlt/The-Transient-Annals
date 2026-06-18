import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  ConnectionLineType,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from 'reactflow'
import type {
  DetailSelection,
  EdgeTone,
  EdgeVisualStyle,
  Entity,
  FushengProject,
  GraphNodePosition,
  StoryEvent,
} from '../types'
import AvatarBadge from './AvatarBadge'

/**
 * Phase 1 & 2 graph enhancements:
 * 1. Focus mode (Ego-Network)
 * 2. Semantic edge types
 * 3. Faction stripe + Faction group nodes (sub-flow)
 * 4. DAG auto-layout toolbar button
 */

type GraphConnection = { sourceId: string; targetId: string }

type Props = {
  project: FushengProject
  mode: 'entities' | 'events'
  compact?: boolean
  toolbar?: ReactNode
  onSelect?: (selection: DetailSelection) => void
  onConnectNodes?: (connection: GraphConnection) => void
  onNodePositionChange?: (nodeId: string, position: GraphNodePosition) => void
  focusNodeId?: string | null
  onFocusNodeChange?: (nodeId: string | null) => void
  /** Current timeline year for temporal filtering (undefined = show all) */
  currentYear?: number | null
}

/* ── Node data types ── */

type EntityNodeData = {
  entity: Entity
  compact?: boolean
  focusEgo?: boolean
}

type EventNodeData = {
  event: StoryEvent
  compact?: boolean
  focusEgo?: boolean
}

type FactionGroupData = {
  label: string
  factionColor: string
  width: number
  height: number
  focusEgo?: boolean
}

/* ── Default positions ── */

const entityPositions = [
  { x: 30, y: 120 },
  { x: 330, y: 40 },
  { x: 340, y: 270 },
  { x: 690, y: 120 },
  { x: 1010, y: 90 },
  { x: 720, y: 330 },
  { x: 80, y: 360 },
  { x: 1010, y: 340 },
]

const eventPositions = [
  { x: 40, y: 160 },
  { x: 330, y: 60 },
  { x: 330, y: 300 },
  { x: 650, y: 165 },
  { x: 980, y: 165 },
  { x: 1240, y: 80 },
  { x: 1240, y: 300 },
]

/* ── Entity type labels ── */

const entityTypeLabel: Record<Entity['type'], string> = {
  person: '人物',
  character: '角色',
  organization: '组织',
  place: '地点',
  other: '其他',
}

/* ── Faction → theme color mapping ── */

const factionColorMap: Record<string, string> = {
  '汉军': 'rgb(var(--cinnabar))',
  '楚军': 'rgb(var(--ink-700))',
  '战略地域': 'rgb(var(--goldline))',
  '故乡旧族': 'rgb(var(--goldline))',
  '边境商队': 'rgb(var(--jade))',
  '藏书院': 'rgb(var(--jade))',
  '反派组织': 'rgb(var(--cinnabar))',
  '黑鸦会': 'rgb(var(--cinnabar))',
  '旧址': 'rgb(var(--ink-500))',
}

function getFactionColor(faction?: string): string | undefined {
  if (!faction) return undefined
  return factionColorMap[faction] ?? 'rgb(var(--goldline) / 0.5)'
}

/* ── Group node: excluded factions ── */
const EXCLUDED_GROUP_FACTIONS = new Set(['战略地域', '旧址'])

/* ══════════════════════════════════════════
   Custom Node Components
   ══════════════════════════════════════════ */

function EntityGraphNode({ data, selected }: NodeProps<EntityNodeData>) {
  const { entity, compact, focusEgo } = data
  const factionColor = getFactionColor(entity.faction)

  return (
    <div
      className={[
        'relative min-w-[196px] rounded-lg border bg-paper-50/95 p-3 text-left text-ink-900 shadow-soft backdrop-blur-sm transition-all duration-300',
        selected ? 'border-cinnabar/60 ring-2 ring-cinnabar/15' : 'border-goldline/35',
        compact ? 'min-w-[154px] p-2' : '',
      ].join(' ')}
      style={{
        opacity: focusEgo === false ? 0.1 : 1,
        pointerEvents: focusEgo === false ? 'none' : 'auto',
        borderLeftWidth: factionColor ? '4px' : undefined,
        borderLeftColor: factionColor,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5" />
      <div className="flex items-center gap-3">
        <AvatarBadge entity={entity} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0">
          <p className="text-[11px] text-ink-500">{entityTypeLabel[entity.type]}</p>
          <p className="truncate font-serif text-base font-semibold text-ink-900">{entity.name}</p>
        </div>
      </div>
      {!compact ? (
        <>
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-600">
            {entity.identity || entity.description || '尚未补充档案'}
          </p>
          {entity.tags.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entity.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-full bg-goldline/12 px-2 py-0.5 text-[11px] text-ink-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function EventGraphNode({ data, selected }: NodeProps<EventNodeData>) {
  const { event, compact, focusEgo } = data

  return (
    <div
      className={[
        'relative min-w-[210px] rounded-lg border bg-paper-50/95 p-4 text-left text-ink-900 shadow-soft backdrop-blur-sm transition-all duration-300',
        selected ? 'border-jade/70 ring-2 ring-jade/15' : 'border-cinnabar/30',
        compact ? 'min-w-[166px] p-3' : '',
      ].join(' ')}
      style={{
        opacity: focusEgo === false ? 0.1 : 1,
        pointerEvents: focusEgo === false ? 'none' : 'auto',
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-ink-500">{event.timeLabel || `序 ${event.order}`}</p>
          <p className="mt-1 font-serif text-base font-semibold text-ink-900">{event.title}</p>
        </div>
        <span className="rounded-full bg-jade/10 px-2 py-1 text-[11px] text-jade">#{event.order}</span>
      </div>
      {!compact ? (
        <>
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-600">
            {event.location || event.description || '尚未补充事件描述'}
          </p>
          {event.tags.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-full bg-cinnabar/10 px-2 py-0.5 text-[11px] text-cinnabar">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/** Faction group container node (sub-flow parent) */
function FactionGroupNode({ data }: NodeProps<FactionGroupData>) {
  const { label, factionColor, width, height, focusEgo } = data

  return (
    <div
      className="rounded-xl border-2 border-dashed transition-opacity duration-300"
      style={{
        width,
        height,
        borderColor: factionColor,
        backgroundColor: factionColor.replace(')', ' / 0.04)').replace('rgb(', 'rgb('),
        opacity: focusEgo === false ? 0.15 : 1,
      }}
    >
      <div
        className="absolute -top-3 left-4 rounded-full px-2.5 py-0.5 font-serif text-[11px] font-semibold tracking-wide"
        style={{
          backgroundColor: factionColor.replace(')', ' / 0.12)').replace('rgb(', 'rgb('),
          color: factionColor,
        }}
      >
        {label}
      </div>
    </div>
  )
}

const nodeTypes = {
  archiveEntity: EntityGraphNode,
  archiveEvent: EventGraphNode,
  factionGroup: FactionGroupNode,
}

/* ══════════════════════════════════════════
   Edge Helpers
   ══════════════════════════════════════════ */

const toneColor: Record<EdgeTone, string> = {
  cinnabar: 'rgb(var(--cinnabar))',
  jade: 'rgb(var(--jade))',
  goldline: 'rgb(var(--goldline))',
  ink: 'rgb(var(--ink-700))',
}

const dashByLineStyle = {
  solid: undefined,
  dashed: '8 7',
  dotted: '2 8',
} satisfies Record<NonNullable<EdgeVisualStyle['lineStyle']>, string | undefined>

function isConflictRelation(type: string): boolean {
  return /对立|冲突|战争|敌对|背叛|对抗/.test(type)
}

function isHierarchyRelation(type: string): boolean {
  return /所属|主从|组织|层级|汇报|隶属/.test(type)
}

function inferEdgeType(type: string): NonNullable<EdgeVisualStyle['edgeType']> {
  if (isConflictRelation(type)) return 'straight'
  if (isHierarchyRelation(type)) return 'smoothstep'
  return 'bezier'
}

function visualForEdge(
  type: string,
  fallbackTone: EdgeTone,
  style?: EdgeVisualStyle,
): Required<EdgeVisualStyle> & { color: string; dash?: string } {
  const inferredDashed =
    type.includes('隐瞒') ||
    type.includes('冲突') ||
    type.includes('伏笔') ||
    type.includes('回收') ||
    type.includes('转折') ||
    isConflictRelation(type)
  const lineStyle = style?.lineStyle || (inferredDashed ? 'dashed' : 'solid')
  const tone = style?.tone || fallbackTone
  const edgeType = style?.edgeType || inferEdgeType(type)
  const lineWidth = style?.lineWidth || 2
  const animated = style?.animated ?? (
    type.includes('伏笔') ||
    type.includes('推动') ||
    type.includes('隐瞒') ||
    isConflictRelation(type)
  )

  return { lineStyle, tone, edgeType, lineWidth, animated, color: toneColor[tone], dash: dashByLineStyle[lineStyle] }
}

function graphEdge(
  id: string,
  source: string,
  target: string,
  label: string,
  fallbackTone: EdgeTone,
  style?: EdgeVisualStyle,
): Edge {
  const visual = visualForEdge(label, fallbackTone, style)

  return {
    id,
    source,
    target,
    label,
    type: visual.edgeType,
    animated: visual.animated,
    interactionWidth: 24,
    markerEnd: { type: MarkerType.ArrowClosed, color: visual.color },
    style: {
      stroke: visual.color,
      strokeWidth: visual.lineWidth,
      strokeDasharray: visual.dash,
      strokeLinecap: 'round',
      filter: 'drop-shadow(0 6px 10px rgb(var(--shadow-soft) / 0.13))',
    },
    labelStyle: { fill: 'rgb(var(--ink-800))', fontSize: 12, fontWeight: 700 },
    labelBgStyle: { fill: 'rgb(var(--paper-50))', fillOpacity: 0.92 },
    labelBgPadding: [10, 6],
    labelBgBorderRadius: 9,
  }
}

/* ══════════════════════════════════════════
   Graph Construction
   ══════════════════════════════════════════ */

const GROUP_PADDING = 44
const NODE_APPROX_W = 220
const NODE_APPROX_H = 135

/** Check if an item with optional startYear/endYear is valid at a given year */
function isValidAtYear(
  item: { startYear?: number; endYear?: number },
  year: number | null | undefined,
): boolean {
  if (year == null) return true
  if (item.startYear != null && year < item.startYear) return false
  if (item.endYear != null && year > item.endYear) return false
  return true
}

function buildGraph(project: FushengProject, mode: Props['mode'], compact?: boolean, currentYear?: number | null) {
  if (mode === 'entities') {
    /* ── 0. Filter entities and relations by current year ── */
    const filteredEntities = project.entities.filter((e) => isValidAtYear(e, currentYear))
    const filteredEntityIds = new Set(filteredEntities.map((e) => e.id))
    const filteredRelations = project.entityRelations.filter(
      (r) =>
        isValidAtYear(r, currentYear) &&
        filteredEntityIds.has(r.sourceId) &&
        filteredEntityIds.has(r.targetId),
    )

    /* ── 1. Compute absolute positions for all entity nodes ── */
    const absolutePositions: Record<string, { x: number; y: number }> = {}
    filteredEntities.forEach((entity, index) => {
      absolutePositions[entity.id] =
        project.entityNodePositions?.[entity.id] ||
        entityPositions[index % entityPositions.length]
    })

    /* ── 2. Build faction group nodes (entities with 2+ members) ── */
    const factionMembers = new Map<string, Entity[]>()
    for (const entity of filteredEntities) {
      if (!entity.faction || EXCLUDED_GROUP_FACTIONS.has(entity.faction)) continue
      const list = factionMembers.get(entity.faction) || []
      list.push(entity)
      factionMembers.set(entity.faction, list)
    }

    const factionGroups: Node<FactionGroupData>[] = []
    const entityToFaction = new Map<string, string>()
    const factionAbsolutePositions: Record<string, { x: number; y: number }> = {}

    for (const [faction, members] of factionMembers) {
      if (members.length < 2) continue

      const color = getFactionColor(faction) || 'rgb(var(--goldline) / 0.5)'
      const positions = members.map((m) => absolutePositions[m.id])
      const minX = Math.min(...positions.map((p) => p.x))
      const minY = Math.min(...positions.map((p) => p.y))
      const maxX = Math.max(...positions.map((p) => p.x + NODE_APPROX_W))
      const maxY = Math.max(...positions.map((p) => p.y + NODE_APPROX_H))

      const groupId = `faction-${faction}`
      const groupAbsPos = {
        x: minX - GROUP_PADDING,
        y: minY - GROUP_PADDING - 10,
      }
      factionAbsolutePositions[groupId] = groupAbsPos

      for (const m of members) {
        entityToFaction.set(m.id, groupId)
      }

      factionGroups.push({
        id: groupId,
        type: 'factionGroup',
        position: groupAbsPos,
        data: {
          label: `${faction}阵营`,
          factionColor: color,
          width: maxX - minX + GROUP_PADDING * 2,
          height: maxY - minY + GROUP_PADDING * 2 + 10,
        },
        draggable: true,
        selectable: false,
        style: { zIndex: -1 },
      })
    }

    /* ── 3. Build entity nodes with relative positions if inside a group ── */
    const nodes: Node[] = [...factionGroups]
    for (let i = 0; i < filteredEntities.length; i++) {
      const entity = filteredEntities[i]
      const absPos = absolutePositions[entity.id]
      const parentGroupId = entityToFaction.get(entity.id)
      const groupAbsPos = parentGroupId ? factionAbsolutePositions[parentGroupId] : undefined

      const node: Node<EntityNodeData> = {
        id: entity.id,
        type: 'archiveEntity',
        position: groupAbsPos
          ? { x: absPos.x - groupAbsPos.x, y: absPos.y - groupAbsPos.y }
          : absPos,
        data: { entity, compact },
      }

      if (parentGroupId) {
        node.parentNode = parentGroupId
        node.expandParent = true
      }

      nodes.push(node)
    }

    /* ── 4. Build edges ── */
    const edges: Edge[] = filteredRelations.map((relation) =>
      graphEdge(relation.id, relation.sourceId, relation.targetId, relation.type, 'cinnabar', relation.style),
    )

    return { nodes, edges }
  }

  /* ── Event mode ── */
  const filteredEvents = project.events.filter((e) => isValidAtYear(e, currentYear))
  const filteredEventIds = new Set(filteredEvents.map((e) => e.id))
  const filteredEventLinks = project.eventLinks.filter(
    (l) =>
      isValidAtYear(l, currentYear) &&
      filteredEventIds.has(l.sourceEventId) &&
      filteredEventIds.has(l.targetEventId),
  )
  const nodes: Node[] = filteredEvents.map((event, index) => ({
    id: event.id,
    type: 'archiveEvent' as const,
    position: project.eventNodePositions?.[event.id] || eventPositions[index % eventPositions.length],
    data: { event, compact } satisfies EventNodeData,
  }))
  const edges: Edge[] = filteredEventLinks.map((link) =>
    graphEdge(link.id, link.sourceEventId, link.targetEventId, link.type, 'jade', link.style),
  )
  return { nodes, edges }
}

/* ══════════════════════════════════════════
   GraphCanvas Component
   ══════════════════════════════════════════ */

export default function GraphCanvas({
  project,
  mode,
  compact,
  toolbar,
  onSelect,
  onConnectNodes,
  onNodePositionChange,
  focusNodeId,
  onFocusNodeChange,
  currentYear,
}: Props) {
  const graph = useMemo(() => buildGraph(project, mode, compact, currentYear), [compact, mode, project, currentYear])
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  /* 1. Reset nodes & edges when the underlying graph data changes */
  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setNodes, setEdges])

  /* 2. Apply focus-mode ego-network styling (runs after reset) */
  useEffect(() => {
    const egoNodeIds = new Set<string>()
    const egoEdgeIds = new Set<string>()

    if (focusNodeId) {
      egoNodeIds.add(focusNodeId)
      // Also add the focused node's faction group
      for (const node of graph.nodes) {
        const n = node as Node
        if (n.id === focusNodeId && n.parentNode) {
          egoNodeIds.add(n.parentNode as string)
        }
      }
      for (const edge of graph.edges) {
        if (edge.source === focusNodeId || edge.target === focusNodeId) {
          egoEdgeIds.add(edge.id)
          egoNodeIds.add(edge.source)
          egoNodeIds.add(edge.target)
          // Include faction groups of connected nodes
          for (const node of graph.nodes) {
            const n = node as Node
            if ((n.id === edge.source || n.id === edge.target) && n.parentNode) {
              egoNodeIds.add(n.parentNode as string)
            }
          }
        }
      }
    }

    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        data: {
          ...node.data,
          focusEgo: focusNodeId ? egoNodeIds.has(node.id) : undefined,
        },
      })),
    )

    setEdges((prev) =>
      prev.map((edge) => {
        const inEgo = focusNodeId ? egoEdgeIds.has(edge.id) : true
        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: focusNodeId && !inEgo ? 0.1 : 1,
            pointerEvents: focusNodeId && !inEgo ? 'none' : 'auto',
          },
        }
      }),
    )
  }, [focusNodeId, graph.edges, graph.nodes, setEdges, setNodes])

  const connectNodes = (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return
    onConnectNodes?.({ sourceId: connection.source, targetId: connection.target })
  }

  return (
    <div
      className="relative h-full min-h-[360px] overflow-hidden rounded-lg border border-goldline/25 shadow-soft"
      style={{
        background:
          'radial-gradient(circle at 18% 18%, rgb(var(--goldline) / 0.12), transparent 26%), linear-gradient(135deg, rgb(var(--paper-50) / 0.96), rgb(var(--paper-100) / 0.9))',
      }}
    >
      {/* Focus mode indicator + reset */}
      {focusNodeId ? (
        <div className="absolute right-4 top-4 z-10">
          <button
            type="button"
            onClick={() => onFocusNodeChange?.(null)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-goldline/30 bg-paper-50/92 px-3 text-xs text-ink-700 shadow-soft backdrop-blur transition hover:bg-paper-50 hover:text-ink-900"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cinnabar animate-pulse" />
            退出焦点
          </button>
        </div>
      ) : null}
      {toolbar ? (
        <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">{toolbar}</div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connectNodes}
        onNodeDragStop={(_, node) => {
          if (compact) return
          // For grouped nodes, convert relative position back to absolute for storage
          if (node.parentNode) {
            const parentNode = nodes.find((n) => n.id === node.parentNode)
            if (parentNode) {
              onNodePositionChange?.(node.id, {
                x: Math.round(node.position.x + parentNode.position.x),
                y: Math.round(node.position.y + parentNode.position.y),
              })
              return
            }
          }
          onNodePositionChange?.(node.id, {
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          })
        }}
        onNodeClick={(_, node) => {
          // Skip selection/focus for faction group nodes
          if (node.type === 'factionGroup') return
          onSelect?.({ kind: mode === 'entities' ? 'entity' : 'event', id: node.id })
          if (focusNodeId === node.id) {
            onFocusNodeChange?.(null)
          } else {
            onFocusNodeChange?.(node.id)
          }
        }}
        onEdgeClick={(_, edge) =>
          onSelect?.({
            kind: mode === 'entities' ? 'entityRelation' : 'eventLink',
            id: edge.id,
          })
        }
        onPaneClick={() => {
          if (focusNodeId) onFocusNodeChange?.(null)
        }}
        fitView
        minZoom={0.25}
        maxZoom={1.45}
        snapToGrid
        snapGrid={[12, 12]}
        nodesDraggable={!compact}
        nodesConnectable={!compact && Boolean(onConnectNodes)}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: 'rgb(var(--goldline))', strokeWidth: 2 }}
        elevateEdgesOnSelect
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgb(var(--goldline))" gap={28} size={1} />
        {!compact ? <Controls showInteractive={false} /> : null}
        {!compact ? (
          <MiniMap
            nodeColor={(n) => (n.type === 'factionGroup' ? 'rgb(var(--goldline) / 0.2)' : 'rgb(var(--goldline))')}
            maskColor="rgb(var(--paper-100) / 0.62)"
          />
        ) : null}
      </ReactFlow>
    </div>
  )
}
