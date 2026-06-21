import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useReactFlow } from 'reactflow'
import { computeGraphLayoutView, type GraphLayoutView } from '../lib/graphLayoutViews'
import {
  buildEvidenceNextSteps,
  collectGraphFilterOptions,
  countActiveFilters,
  emptyGraphFilters,
  filterGraphRecords,
  getGraphRecords,
} from '../lib/graphWorkbench'
import { getProjectTemplate } from '../templates/projectTemplates'
import type {
  AnalysisNote,
  AnalysisNoteDraft,
  DetailSelection,
  EdgeVisualStyle,
  EntityRelation,
  EntityRelationDraft,
  EventLinkDraft,
  FushengProject,
  GraphMode,
  GraphNodePosition,
} from '../types'
import DetailPanel from './DetailPanel'
import EdgeStyleControls from './EdgeStyleControls'
import GraphCanvas from './GraphCanvas'
import GraphConnectionComposer, { type GraphConnectionDraft } from './GraphConnectionComposer'
import GraphEvidencePanel from './GraphEvidencePanel'
import GraphFilterPanel from './GraphFilterPanel'
import GraphInspectorPanel, { type InspectorTab } from './GraphInspectorPanel'
import GraphToolbar, { type GraphWorkMode } from './GraphToolbar'

type ChainState = {
  nodeIds: string[]
  edgeIds: string[]
  summary: string
}

type Props = {
  project: FushengProject
  graphMode: GraphMode
  eyebrow: string
  title: string
  description: string
  connectionTitle: string
  connectionSubmitLabel: string
  connectionTypes: string[]
  onAddEntityRelation?: (draft: EntityRelationDraft) => string
  onAddEventLink?: (draft: EventLinkDraft) => string
  onUpdateEdgeStyle: (edgeId: string, style: EdgeVisualStyle) => void
  onDeleteEdge: (edgeId: string) => void
  onNodePositionChange: (nodeId: string, position: GraphNodePosition) => void
  onBatchLayout: (positions: Record<string, GraphNodePosition>) => void
  onAddAnalysisNote: (draft: AnalysisNoteDraft) => string
  onDeleteAnalysisNote: (noteId: string) => void
}

const emptyChain = (): ChainState => ({ nodeIds: [], edgeIds: [], summary: '' })

export default function GraphWorkbench({
  project,
  graphMode,
  eyebrow,
  title,
  description,
  connectionTitle,
  connectionSubmitLabel,
  connectionTypes,
  onAddEntityRelation,
  onAddEventLink,
  onUpdateEdgeStyle,
  onDeleteEdge,
  onNodePositionChange,
  onBatchLayout,
  onAddAnalysisNote,
  onDeleteAnalysisNote,
}: Props) {
  const template = getProjectTemplate(project.templateId, project.category)
  const { fitView } = useReactFlow()
  const [searchParams] = useSearchParams()
  const queryFocusNodeId = searchParams.get('focusNodeId')
  const handledQueryFocusRef = useRef<string | null>(null)
  const [workMode, setWorkMode] = useState<GraphWorkMode>('browse')
  const [filters, setFilters] = useState(emptyGraphFilters)
  const [selection, setSelection] = useState<DetailSelection>(
    graphMode === 'entities'
      ? project.entities[0]
        ? { kind: 'entity', id: project.entities[0].id }
        : null
      : project.events[0]
        ? { kind: 'event', id: project.events[0].id }
        : null,
  )
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<InspectorTab>('detail')
  const [immersive, setImmersive] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [layoutStatus, setLayoutStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [fitViewKey, setFitViewKey] = useState(0)
  const [layoutView, setLayoutView] = useState<GraphLayoutView>('free')
  const [layoutPreviewPositions, setLayoutPreviewPositions] =
    useState<Record<string, GraphNodePosition> | undefined>()
  const [chain, setChain] = useState<ChainState>(emptyChain)

  const graph = useMemo(() => getGraphRecords(project, graphMode), [graphMode, project])
  const options = useMemo(() => collectGraphFilterOptions(graph), [graph])
  const filteredGraph = useMemo(() => filterGraphRecords(graph, filters), [filters, graph])
  const visibleNodeIds = useMemo(() => new Set(filteredGraph.nodes.map((node) => node.id)), [filteredGraph.nodes])
  const visibleEdgeIds = useMemo(() => new Set(filteredGraph.edges.map((edge) => edge.id)), [filteredGraph.edges])
  const activeFilterCount = countActiveFilters(filters)
  const savedNotes = useMemo(
    () => project.analysisNotes.filter((note) => note.graphMode === graphMode),
    [graphMode, project.analysisNotes],
  )
  const nodesForComposer = useMemo(
    () => graph.nodes.map((node) => ({ id: node.id, label: node.label })),
    [graph.nodes],
  )
  const fallbackSelection = useMemo<DetailSelection>(
    () =>
      graphMode === 'entities'
        ? project.entities[0]
          ? { kind: 'entity', id: project.entities[0].id }
          : null
        : project.events[0]
          ? { kind: 'event', id: project.events[0].id }
          : null,
    [graphMode, project.entities, project.events],
  )
  const selectionIsValid =
    selection == null
      ? false
      : selection.kind === 'entity'
        ? project.entities.some((entity) => entity.id === selection.id)
        : selection.kind === 'event'
          ? project.events.some((event) => event.id === selection.id)
          : selection.kind === 'entityRelation'
            ? project.entityRelations.some((relation) => relation.id === selection.id)
            : selection.kind === 'eventLink'
              ? project.eventLinks.some((link) => link.id === selection.id)
              : project.libraryItems.some((item) => item.id === selection.id)
  const activeSelection = selectionIsValid ? selection : fallbackSelection
  const selectedEdge =
    activeSelection?.kind === 'entityRelation'
      ? project.entityRelations.find((relation) => relation.id === activeSelection.id)
      : activeSelection?.kind === 'eventLink'
        ? project.eventLinks.find((link) => link.id === activeSelection.id)
        : undefined

  const defaultDraft = useMemo<GraphConnectionDraft>(
    () => ({
      sourceId: nodesForComposer[0]?.id || '',
      targetId: nodesForComposer[1]?.id || '',
      type: connectionTypes[0] || '',
      description: '',
      style: {
        lineStyle: 'solid',
        tone: graphMode === 'entities' ? 'cinnabar' : 'jade',
        animated: false,
      },
    }),
    [connectionTypes, graphMode, nodesForComposer],
  )
  const [draft, setDraft] = useState<GraphConnectionDraft>(defaultDraft)

  const nextSteps = useMemo(
    () => buildEvidenceNextSteps(filteredGraph, chain.nodeIds, chain.edgeIds),
    [chain.edgeIds, chain.nodeIds, filteredGraph],
  )
  const hasLayoutPreview =
    layoutPreviewPositions != null && Object.keys(layoutPreviewPositions).length > 0

  const handleQueryFocus = useCallback(
    (nodeId: string) => {
      if (!visibleNodeIds.has(nodeId)) {
        setFilters(emptyGraphFilters())
      }
      setFocusNodeId(nodeId)
      setSelection({ kind: graphMode === 'entities' ? 'entity' : 'event', id: nodeId })
      setActiveTab('detail')
      setFitViewKey((value) => value + 1)
    },
    [visibleNodeIds, graphMode],
  )

  useEffect(() => {
    if (!queryFocusNodeId) {
      handledQueryFocusRef.current = null
      return
    }

    const focusKey = `${graphMode}:${queryFocusNodeId}`
    if (handledQueryFocusRef.current === focusKey) return

    const nodeExists = graph.nodes.some((node) => node.id === queryFocusNodeId)
    if (!nodeExists) return

    handledQueryFocusRef.current = focusKey
    // Defer state updates to avoid cascading renders
    const timer = window.setTimeout(() => handleQueryFocus(queryFocusNodeId), 0)
    return () => window.clearTimeout(timer)
  }, [graph.nodes, graphMode, queryFocusNodeId, handleQueryFocus])

  const openComposer = (sourceId = defaultDraft.sourceId, targetId = defaultDraft.targetId) => {
    const draftIsValid =
      nodesForComposer.some((node) => node.id === draft.sourceId) &&
      nodesForComposer.some((node) => node.id === draft.targetId) &&
      connectionTypes.includes(draft.type)
    const baseDraft = draftIsValid ? draft : defaultDraft

    setDraft({
      ...baseDraft,
      sourceId,
      targetId,
      type: baseDraft.type || defaultDraft.type,
    })
    setComposerOpen(true)
  }

  const submitConnection = () => {
    if (!draft.sourceId || !draft.targetId || draft.sourceId === draft.targetId || !draft.type.trim()) return

    if (graphMode === 'entities' && onAddEntityRelation) {
      const id = onAddEntityRelation({
        sourceId: draft.sourceId,
        targetId: draft.targetId,
        type: draft.type.trim(),
        description: draft.description.trim(),
        style: draft.style,
      })
      setSelection({ kind: 'entityRelation', id })
      setActiveTab('style')
    }

    if (graphMode === 'events' && onAddEventLink) {
      const id = onAddEventLink({
        sourceEventId: draft.sourceId,
        targetEventId: draft.targetId,
        type: draft.type.trim(),
        description: draft.description.trim(),
        style: draft.style,
      })
      setSelection({ kind: 'eventLink', id })
      setActiveTab('style')
    }

    setDraft(defaultDraft)
    setComposerOpen(false)
  }

  const previewLayoutView = (view: GraphLayoutView) => {
    setLayoutView(view)
    if (view === 'free') {
      setLayoutPreviewPositions(undefined)
      setLayoutStatus('idle')
      return
    }

    try {
      const positions = computeGraphLayoutView(project, graphMode, view)
      setLayoutPreviewPositions(positions)
      setLayoutStatus('idle')
      window.setTimeout(() => fitView({ duration: 280, padding: 0.25 }), 80)
    } catch {
      setLayoutStatus('failed')
      window.setTimeout(() => setLayoutStatus('idle'), 1800)
    }
  }

  const applyLayoutView = () => {
    if (!hasLayoutPreview || !layoutPreviewPositions) return

    try {
      setLayoutStatus('saving')
      const positions = layoutPreviewPositions
      onBatchLayout(positions)
      setLayoutPreviewPositions(undefined)
      setLayoutView('free')
      setLayoutStatus('saved')
      window.setTimeout(() => setLayoutStatus('idle'), 1400)
      window.setTimeout(() => fitView({ duration: 280, padding: 0.25 }), 80)
    } catch {
      setLayoutStatus('failed')
      window.setTimeout(() => setLayoutStatus('idle'), 1800)
    }
  }

  const runAutoLayout = () => {
    previewLayoutView(graphMode === 'entities' ? 'relationship' : 'timeline')
  }

  const saveChain = () => {
    if (!chain.nodeIds.length || !chain.summary.trim()) return

    const startId = chain.nodeIds[0]
    const targetId = chain.nodeIds[chain.nodeIds.length - 1]
    const startLabel = graph.nodes.find((node) => node.id === startId)?.label || '未命名起点'
    const targetLabel = graph.nodes.find((node) => node.id === targetId)?.label || startLabel
    onAddAnalysisNote({
      title: `${startLabel} -> ${targetLabel}`,
      graphMode,
      startId,
      targetId,
      nodeIds: [...chain.nodeIds],
      edgeIds: [...chain.edgeIds],
      summary: chain.summary.trim(),
    })
    setActiveTab('notes')
  }

  const openNote = (note: AnalysisNote) => {
    setChain({
      nodeIds: [...note.nodeIds],
      edgeIds: [...note.edgeIds],
      summary: note.summary,
    })
    setActiveTab('evidence')
    setWorkMode('reasoning')
  }

  const appendStep = (step: { nodeId: string; edgeId: string }) =>
    setChain((value) => ({
      ...value,
      nodeIds: value.nodeIds.includes(step.nodeId) ? value.nodeIds : [...value.nodeIds, step.nodeId],
      edgeIds: value.edgeIds.includes(step.edgeId) ? value.edgeIds : [...value.edgeIds, step.edgeId],
    }))

  const removeLastStep = () =>
    setChain((value) => ({
      ...value,
      nodeIds: value.nodeIds.slice(0, -1),
      edgeIds: value.edgeIds.slice(0, -1),
    }))

  const handleCanvasSelect = (nextSelection: DetailSelection) => {
    setSelection(nextSelection)
    if (!nextSelection) {
      setActiveTab('detail')
      return
    }

    const isNode = nextSelection.kind === 'entity' || nextSelection.kind === 'event'
    const isEdge = nextSelection.kind === 'entityRelation' || nextSelection.kind === 'eventLink'
    setActiveTab(isEdge ? 'style' : 'detail')

    if (workMode === 'reasoning' && isNode) {
      setChain((value) =>
        value.nodeIds.includes(nextSelection.id)
          ? value
          : { ...value, nodeIds: [...value.nodeIds, nextSelection.id] },
      )
      setActiveTab('evidence')
    }
  }

  const handleRelationClick = (relation: EntityRelation) => {
    setSelection({ kind: 'entityRelation', id: relation.id })
    setFocusNodeId(relation.sourceId)
    setActiveTab('style')
  }

  const deleteSelectedEdge = () => {
    if (!selectedEdge) return
    onDeleteEdge(selectedEdge.id)
    setSelection(null)
    setActiveTab('detail')
  }

  const clearFilters = () => setFilters(emptyGraphFilters())

  const detailPanel = (
    <DetailPanel
      project={project}
      selection={activeSelection}
      compactChrome
      onRelationClick={graphMode === 'entities' ? handleRelationClick : undefined}
    />
  )
  const evidencePanel = (
    <GraphEvidencePanel
      graphMode={graphMode}
      nodes={graph.nodes.map((node) => ({ id: node.id, label: node.label }))}
      edges={graph.edges.map((edge) => ({
        id: edge.id,
        type: edge.type,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
      }))}
      chain={chain}
      nextSteps={nextSteps}
      savedNotes={savedNotes}
      onAppendStep={appendStep}
      onRemoveLast={removeLastStep}
      onClear={() => setChain(emptyChain())}
      onSummaryChange={(summary) => setChain((value) => ({ ...value, summary }))}
      onSave={saveChain}
      onOpenNote={openNote}
      onDeleteNote={onDeleteAnalysisNote}
    />
  )
  const stylePanel = selectedEdge ? (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-ink-500">连接样式</p>
        <h3 className="mt-1 font-serif text-xl font-semibold">{selectedEdge.type}</h3>
      </div>
      <EdgeStyleControls
        value={selectedEdge.style}
        onChange={(style) => onUpdateEdgeStyle(selectedEdge.id, style)}
      />
      <button
        type="button"
        onClick={deleteSelectedEdge}
        className="min-h-10 w-full rounded-lg border border-cinnabar/30 bg-cinnabar/5 px-3 text-sm text-cinnabar transition hover:bg-cinnabar/10"
      >
        删除这条连接
      </button>
    </div>
  ) : (
    <p className="archive-card paper-grain rounded-lg border border-dashed border-goldline/25 bg-paper-50/65 p-4 text-sm leading-6 text-ink-500">
      选择一条连接后可以调整线型、颜色、线宽和流动效果。
    </p>
  )
  const notesPanel = (
    <div className="space-y-3">
      {savedNotes.map((note) => (
        <div
          key={note.id}
          className="archive-card paper-grain rounded-lg border border-goldline/20 bg-paper-50/70 p-3"
        >
          <button type="button" onClick={() => openNote(note)} className="block w-full text-left text-sm">
            <strong>{note.title}</strong>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{note.summary}</p>
          </button>
          <button
            type="button"
            onClick={() => onDeleteAnalysisNote(note.id)}
            className="mt-2 text-xs text-cinnabar hover:underline"
          >
            删除札记
          </button>
        </div>
      ))}
      {!savedNotes.length ? <p className="text-sm text-ink-500">还没有保存的分析札记。</p> : null}
    </div>
  )

  return (
    <div
      className={[
        'grid gap-4',
        immersive
          ? 'grid-cols-1'
          : 'xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_360px]',
      ].join(' ')}
    >
      {!immersive ? (
        <div className="min-h-[280px] xl:min-h-[calc(100dvh-9rem)]">
          <GraphFilterPanel filters={filters} options={options} onChange={setFilters} onClear={clearFilters} />
        </div>
      ) : null}

      <section className="archive-card paper-grain relative min-h-[calc(100dvh-9rem)] rounded-lg border border-goldline/25 bg-paper-50/75 p-4 shadow-archive">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm text-ink-500">{eyebrow}</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-700">{description}</p>
          </div>
          <span className="text-xs text-ink-500">
            {filteredGraph.nodes.length} 节点 / {filteredGraph.edges.length} 连接
          </span>
        </div>

        {composerOpen ? (
          <div className="absolute left-4 right-4 top-28 z-20 md:left-auto md:w-[24rem]">
            <GraphConnectionComposer
              open={composerOpen}
              title={connectionTitle}
              sourceLabel={graphMode === 'entities' ? template.entitySingular : template.eventSingular}
              targetLabel={graphMode === 'entities' ? template.entitySingular : template.eventSingular}
              submitLabel={connectionSubmitLabel}
              draft={draft}
              nodes={nodesForComposer}
              types={connectionTypes}
              onDraftChange={setDraft}
              onClose={() => setComposerOpen(false)}
              onSubmit={submitConnection}
            />
          </div>
        ) : null}

        <div className="h-[calc(100dvh-17rem)] min-h-[560px]">
          <GraphCanvas
            project={project}
            mode={graphMode}
            onSelect={handleCanvasSelect}
            onConnectNodes={({ sourceId, targetId }) => openComposer(sourceId, targetId)}
            onNodePositionChange={(nodeId, position) => {
              setLayoutPreviewPositions(undefined)
              setLayoutView('free')
              setLayoutStatus('saving')
              onNodePositionChange(nodeId, position)
              setLayoutStatus('saved')
              window.setTimeout(() => setLayoutStatus('idle'), 1200)
            }}
            focusNodeId={focusNodeId}
            onFocusNodeChange={setFocusNodeId}
            visibleNodeIds={visibleNodeIds}
            visibleEdgeIds={visibleEdgeIds}
            activeChain={workMode === 'reasoning' ? chain : undefined}
            emptyTitle={activeFilterCount ? '没有匹配的图谱内容' : '暂无图谱内容'}
            emptyDescription={activeFilterCount ? '清空筛选或放宽条件后再查看。' : '先添加人物、事件或连接，再进入图谱分析。'}
            layoutStatus={layoutStatus}
            fitViewKey={fitViewKey}
            positionOverrides={layoutPreviewPositions}
            toolbar={
              <GraphToolbar
                mode={workMode}
                activeFilterCount={activeFilterCount}
                immersive={immersive}
                hasFocus={Boolean(focusNodeId)}
                layoutView={layoutView}
                hasLayoutPreview={hasLayoutPreview}
                onModeChange={setWorkMode}
                onLayoutViewChange={previewLayoutView}
                onApplyLayoutView={applyLayoutView}
                onAddConnection={() => openComposer()}
                onAutoLayout={runAutoLayout}
                onFitView={() => setFitViewKey((value) => value + 1)}
                onClearFilters={clearFilters}
                onToggleImmersive={() => setImmersive((value) => !value)}
                onExitFocus={() => setFocusNodeId(null)}
              />
            }
          />
        </div>
      </section>

      {!immersive ? (
        <div className="xl:col-span-2 2xl:col-span-1 2xl:col-start-3">
          <GraphInspectorPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            detail={detailPanel}
            evidence={evidencePanel}
            style={stylePanel}
            notes={notesPanel}
          />
        </div>
      ) : null}
    </div>
  )
}
