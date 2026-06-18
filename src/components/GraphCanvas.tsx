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
  currentYear?: number | null
}

type EntityNodeData = {
  entity: Entity
  compact?: boolean
  dimmed?: boolean
}

type EventNodeData = {
  event: StoryEvent
  compact?: boolean
  dimmed?: boolean
}

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

const entityTypeLabel: Record<Entity['type'], string> = {
  person: '人物',
  character: '角色',
  organization: '组织',
  place: '地点',
  other: '其他',
}

function EntityGraphNode({ data, selected }: NodeProps<EntityNodeData>) {
  const { entity, compact, dimmed } = data

  return (
    <div
      className={[
        'min-w-[196px] rounded-lg border bg-paper-50/95 p-3 text-left text-ink-900 shadow-soft backdrop-blur-sm transition-all duration-300',
        selected ? 'border-cinnabar/60 ring-2 ring-cinnabar/15' : 'border-goldline/35',
        compact ? 'min-w-[154px] p-2' : '',
      ].join(' ')}
      style={{ opacity: dimmed ? 0.14 : 1 }}
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
  const { event, compact, dimmed } = data

  return (
    <div
      className={[
        'min-w-[210px] rounded-lg border bg-paper-50/95 p-4 text-left text-ink-900 shadow-soft backdrop-blur-sm transition-all duration-300',
        selected ? 'border-jade/70 ring-2 ring-jade/15' : 'border-cinnabar/30',
        compact ? 'min-w-[166px] p-3' : '',
      ].join(' ')}
      style={{ opacity: dimmed ? 0.14 : 1 }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-ink-500">{event.timeLabel || `顺序 ${event.order}`}</p>
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

const nodeTypes = {
  archiveEntity: EntityGraphNode,
  archiveEvent: EventGraphNode,
}

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
  const animated =
    style?.animated ??
    (type.includes('伏笔') ||
      type.includes('推动') ||
      type.includes('隐瞒') ||
      isConflictRelation(type))

  return {
    lineStyle,
    tone,
    edgeType,
    lineWidth,
    animated,
    color: toneColor[tone],
    dash: dashByLineStyle[lineStyle],
  }
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
    const entities = project.entities.filter((entity) => isValidAtYear(entity, currentYear))
    const visibleEntityIds = new Set(entities.map((entity) => entity.id))
    const relations = project.entityRelations.filter(
      (relation) =>
        isValidAtYear(relation, currentYear) &&
        visibleEntityIds.has(relation.sourceId) &&
        visibleEntityIds.has(relation.targetId),
    )

    const nodes: Node[] = entities.map((entity, index) => ({
      id: entity.id,
      type: 'archiveEntity',
      position: project.entityNodePositions?.[entity.id] || entityPositions[index % entityPositions.length],
      data: { entity, compact } satisfies EntityNodeData,
    }))

    const edges: Edge[] = relations.map((relation) =>
      graphEdge(
        relation.id,
        relation.sourceId,
        relation.targetId,
        relation.type,
        'cinnabar',
        relation.style,
      ),
    )

    return { nodes, edges }
  }

  const events = project.events.filter((event) => isValidAtYear(event, currentYear))
  const visibleEventIds = new Set(events.map((event) => event.id))
  const links = project.eventLinks.filter(
    (link) =>
      isValidAtYear(link, currentYear) &&
      visibleEventIds.has(link.sourceEventId) &&
      visibleEventIds.has(link.targetEventId),
  )

  const nodes: Node[] = events.map((event, index) => ({
    id: event.id,
    type: 'archiveEvent',
    position: project.eventNodePositions?.[event.id] || eventPositions[index % eventPositions.length],
    data: { event, compact } satisfies EventNodeData,
  }))

  const edges: Edge[] = links.map((link) =>
    graphEdge(link.id, link.sourceEventId, link.targetEventId, link.type, 'jade', link.style),
  )

  return { nodes, edges }
}

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
  const graph = useMemo(
    () => buildGraph(project, mode, compact, currentYear),
    [compact, currentYear, mode, project],
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setEdges, setNodes])

  useEffect(() => {
    if (!focusNodeId) {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          data: { ...node.data, dimmed: false },
        })),
      )
      setEdges((prev) =>
        prev.map((edge) => ({
          ...edge,
          style: { ...edge.style, opacity: 1, pointerEvents: 'auto' },
        })),
      )
      return
    }

    const focusConnected = new Set<string>([focusNodeId])
    const activeEdgeIds = new Set<string>()

    for (const edge of graph.edges) {
      if (edge.source === focusNodeId || edge.target === focusNodeId) {
        focusConnected.add(edge.source)
        focusConnected.add(edge.target)
        activeEdgeIds.add(edge.id)
      }
    }

    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        data: { ...node.data, dimmed: !focusConnected.has(node.id) },
      })),
    )
    setEdges((prev) =>
      prev.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: activeEdgeIds.has(edge.id) ? 1 : 0.12,
          pointerEvents: activeEdgeIds.has(edge.id) ? 'auto' : 'none',
        },
      })),
    )
  }, [focusNodeId, graph.edges, setEdges, setNodes])

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
      {focusNodeId ? (
        <div className="absolute right-4 top-4 z-10">
          <button
            type="button"
            onClick={() => onFocusNodeChange?.(null)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-goldline/30 bg-paper-50/92 px-3 text-xs text-ink-700 shadow-soft backdrop-blur transition hover:bg-paper-50 hover:text-ink-900"
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-cinnabar" />
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
          onNodePositionChange?.(node.id, {
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          })
        }}
        onNodeClick={(_, node) => {
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
            nodeColor={() => 'rgb(var(--goldline))'}
            maskColor="rgb(var(--paper-100) / 0.62)"
          />
        ) : null}
      </ReactFlow>
    </div>
  )
}
