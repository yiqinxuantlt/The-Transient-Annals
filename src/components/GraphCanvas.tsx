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

type GraphConnection = {
  sourceId: string
  targetId: string
}

type Props = {
  project: FushengProject
  mode: 'entities' | 'events'
  compact?: boolean
  toolbar?: ReactNode
  onSelect?: (selection: DetailSelection) => void
  onConnectNodes?: (connection: GraphConnection) => void
  onNodePositionChange?: (nodeId: string, position: GraphNodePosition) => void
}

type EntityNodeData = {
  entity: Entity
  compact?: boolean
}

type EventNodeData = {
  event: StoryEvent
  compact?: boolean
}

type GraphNodeData = EntityNodeData | EventNodeData

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
  const { entity, compact } = data

  return (
    <div
      className={[
        'relative min-w-[196px] rounded-lg border bg-paper-50/95 p-3 text-left text-ink-900 shadow-soft backdrop-blur-sm transition',
        selected ? 'border-cinnabar/60 ring-2 ring-cinnabar/15' : 'border-goldline/35',
        compact ? 'min-w-[154px] p-2' : '',
      ].join(' ')}
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
  const { event, compact } = data

  return (
    <div
      className={[
        'relative min-w-[210px] rounded-lg border bg-paper-50/95 p-4 text-left text-ink-900 shadow-soft backdrop-blur-sm transition',
        selected ? 'border-jade/70 ring-2 ring-jade/15' : 'border-cinnabar/30',
        compact ? 'min-w-[166px] p-3' : '',
      ].join(' ')}
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
    type.includes('转折')
  const lineStyle = style?.lineStyle || (inferredDashed ? 'dashed' : 'solid')
  const tone = style?.tone || fallbackTone
  const animated = style?.animated ?? (type.includes('伏笔') || type.includes('推动') || type.includes('隐瞒'))

  return {
    lineStyle,
    tone,
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
    type: 'smoothstep',
    animated: visual.animated,
    interactionWidth: 24,
    markerEnd: { type: MarkerType.ArrowClosed, color: visual.color },
    style: {
      stroke: visual.color,
      strokeWidth: 2.2,
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

function entityNode(
  entity: Entity,
  index: number,
  compact?: boolean,
  position?: GraphNodePosition,
): Node<GraphNodeData> {
  return {
    id: entity.id,
    type: 'archiveEntity',
    position: position || entityPositions[index % entityPositions.length],
    data: { entity, compact },
  }
}

function eventNode(
  event: StoryEvent,
  index: number,
  compact?: boolean,
  position?: GraphNodePosition,
): Node<GraphNodeData> {
  return {
    id: event.id,
    type: 'archiveEvent',
    position: position || eventPositions[index % eventPositions.length],
    data: { event, compact },
  }
}

function buildGraph(project: FushengProject, mode: Props['mode'], compact?: boolean) {
  if (mode === 'entities') {
    const nodes = project.entities.map((entity, index) =>
      entityNode(entity, index, compact, project.entityNodePositions?.[entity.id]),
    )
    const edges: Edge[] = project.entityRelations.map((relation) =>
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

  const nodes = project.events.map((event, index) =>
    eventNode(event, index, compact, project.eventNodePositions?.[event.id]),
  )
  const edges: Edge[] = project.eventLinks.map((link) =>
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
}: Props) {
  const graph = useMemo(() => buildGraph(project, mode, compact), [compact, mode, project])
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  useEffect(() => {
    const nextGraph = buildGraph(project, mode, compact)
    setNodes(nextGraph.nodes)
    setEdges(nextGraph.edges)
  }, [compact, mode, project, setEdges, setNodes])

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
        onNodeClick={(_, node) =>
          onSelect?.({ kind: mode === 'entities' ? 'entity' : 'event', id: node.id })
        }
        onEdgeClick={(_, edge) =>
          onSelect?.({
            kind: mode === 'entities' ? 'entityRelation' : 'eventLink',
            id: edge.id,
          })
        }
        fitView
        minZoom={0.32}
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
          <MiniMap nodeColor={() => 'rgb(var(--goldline))'} maskColor="rgb(var(--paper-100) / 0.62)" />
        ) : null}
      </ReactFlow>
    </div>
  )
}
