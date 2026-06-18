import { Crosshair, LayoutGrid, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ReactFlowProvider, useReactFlow } from 'reactflow'
import DetailPanel from '../components/DetailPanel'
import EdgeStyleControls from '../components/EdgeStyleControls'
import GraphCanvas from '../components/GraphCanvas'
import TimeSlider from '../components/TimeSlider'
import { useProject } from '../hooks/useProject'
import { computeEntityLayout } from '../lib/dagreLayout'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection, EntityRelation, EntityRelationDraft } from '../types'

/* ── Inner component (has access to useReactFlow via parent ReactFlowProvider) ── */

function RelationGraphInner() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addRelation = useFushengluStore((state) => state.addEntityRelation)
  const updateRelationStyle = useFushengluStore((state) => state.updateEntityRelationStyle)
  const deleteRelation = useFushengluStore((state) => state.deleteEntityRelation)
  const updateNodePosition = useFushengluStore((state) => state.updateEntityNodePosition)
  const batchUpdatePositions = useFushengluStore((state) => state.batchUpdateEntityNodePositions)
  const [selection, setSelection] = useState<DetailSelection>(
    project.entities[0] ? { kind: 'entity', id: project.entities[0].id } : null,
  )
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const { fitView, getNodes } = useReactFlow()

  const initialRelation = useMemo<EntityRelationDraft>(
    () => ({
      sourceId: project.entities[0]?.id || '',
      targetId: project.entities[1]?.id || '',
      type: template.relationTypes[0] || '',
      description: '',
      style: { lineStyle: 'solid', tone: 'cinnabar', animated: false },
    }),
    [project.entities, template.relationTypes],
  )
  const [draft, setDraft] = useState(initialRelation)
  const [composerOpen, setComposerOpen] = useState(false)
  const selectedRelation =
    selection?.kind === 'entityRelation'
      ? project.entityRelations.find((relation) => relation.id === selection.id)
      : undefined

  /* ── Time slider: compute year range from project data ── */
  const { minYear, maxYear, hasYearData } = useMemo(() => {
    const years: number[] = []
    for (const e of project.entities) {
      if (e.startYear != null) years.push(e.startYear)
      if (e.endYear != null) years.push(e.endYear)
    }
    for (const r of project.entityRelations) {
      if (r.startYear != null) years.push(r.startYear)
      if (r.endYear != null) years.push(r.endYear)
    }
    for (const ev of project.events) {
      if (ev.startYear != null) years.push(ev.startYear)
      if (ev.endYear != null) years.push(ev.endYear)
    }
    for (const el of project.eventLinks) {
      if (el.startYear != null) years.push(el.startYear)
      if (el.endYear != null) years.push(el.endYear)
    }
    if (years.length === 0) return { minYear: 0, maxYear: 0, hasYearData: false }
    return { minYear: Math.min(...years), maxYear: Math.max(...years), hasYearData: true }
  }, [project.entities, project.entityRelations, project.events, project.eventLinks])

  // null means "show all" (no temporal filtering)
  const [currentYear, setCurrentYear] = useState<number | null>(null)

  /* Filtered relations for the sidebar list */
  const visibleRelations = useMemo(() => {
    if (currentYear == null) return project.entityRelations
    return project.entityRelations.filter((r) => {
      if (r.startYear != null && currentYear < r.startYear) return false
      if (r.endYear != null && currentYear > r.endYear) return false
      return true
    })
  }, [project.entityRelations, currentYear])

  const openComposer = (sourceId = initialRelation.sourceId, targetId = initialRelation.targetId) => {
    setDraft((value) => ({
      ...value,
      sourceId,
      targetId,
    }))
    setComposerOpen(true)
  }

  const submit = () => {
    if (!draft.sourceId || !draft.targetId || !draft.type.trim() || draft.sourceId === draft.targetId) return
    const id = addRelation(project.id, { ...draft, type: draft.type.trim() })
    setSelection({ kind: 'entityRelation', id })
    setDraft(initialRelation)
    setComposerOpen(false)
  }

  /** Clicking a relation in the sidebar focuses one endpoint and fits both into view */
  const handleRelationClick = useCallback(
    (relation: EntityRelation) => {
      setSelection({ kind: 'entityRelation', id: relation.id })
      setFocusNodeId(relation.sourceId)
      setTimeout(() => {
        const allNodes = getNodes()
        const targetNodes = allNodes.filter(
          (n) => n.id === relation.sourceId || n.id === relation.targetId,
        )
        fitView({
          nodes: targetNodes.length ? targetNodes : undefined,
          duration: 800,
          padding: 0.4,
        })
      }, 60)
    },
    [fitView, getNodes],
  )

  /** DAG auto-layout: compute positions with dagre, save all at once, then fitView */
  const handleAutoLayout = useCallback(() => {
    const positions = computeEntityLayout(project.entities, project.entityRelations, {
      rankdir: 'TB',
      nodesep: 90,
      ranksep: 130,
    })
    batchUpdatePositions(project.id, positions)
    // Clear focus mode when layout changes
    setFocusNodeId(null)
    // Fit view after positions update
    setTimeout(() => {
      fitView({ duration: 600, padding: 0.3 })
    }, 80)
  }, [project.entities, project.entityRelations, project.id, batchUpdatePositions, fitView])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="relative min-h-[calc(100dvh-9rem)] rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-ink-500">{template.pages.relationGraph.eyebrow}</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold">{template.pages.relationGraph.title}</h2>
            <p className="mt-2 text-sm text-ink-700">
              {template.pages.relationGraph.description}
            </p>
          </div>
        </div>

        {composerOpen ? (
          <section className="absolute left-5 right-5 top-28 z-20 rounded-lg border border-goldline/30 bg-paper-50/95 p-4 shadow-archive backdrop-blur md:left-auto md:w-96">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-ink-500">Canvas Composer</p>
                <h3 className="font-serif text-xl font-semibold">{template.pages.relationGraph.composerTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                aria-label="关闭新增关系"
              >
                <X size={17} />
              </button>
            </div>
            <div className="grid gap-3">
              <select
                value={draft.sourceId}
                onChange={(event) => setDraft((value) => ({ ...value, sourceId: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
              >
                {project.entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
              <select
                value={draft.targetId}
                onChange={(event) => setDraft((value) => ({ ...value, targetId: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
              >
                {project.entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
              <select
                value={draft.type}
                onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
              >
                {template.relationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
                placeholder="关系说明"
                className="min-h-24 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 text-sm outline-none"
              />
              <EdgeStyleControls
                value={draft.style}
                onChange={(style) => setDraft((value) => ({ ...value, style }))}
              />
              <button
                type="button"
                onClick={submit}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 text-sm text-paper-50 transition hover:bg-ink-700"
              >
                <Plus size={17} />
                添加关系
              </button>
            </div>
          </section>
        ) : null}

        <div className="h-[calc(100dvh-16rem)] min-h-[540px]">
          <GraphCanvas
            project={project}
            mode="entities"
            onSelect={setSelection}
            onConnectNodes={({ sourceId, targetId }) => openComposer(sourceId, targetId)}
            onNodePositionChange={(nodeId, position) =>
              updateNodePosition(project.id, nodeId, position)
            }
            focusNodeId={focusNodeId}
            onFocusNodeChange={setFocusNodeId}
            currentYear={currentYear}
            toolbar={
              <>
                <button
                  type="button"
                  onClick={() => openComposer()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-goldline/30 bg-paper-50/90 px-4 text-sm text-ink-800 shadow-soft backdrop-blur transition hover:bg-paper-50"
                >
                  <Plus size={17} />
                  添加关系
                </button>
                <button
                  type="button"
                  onClick={handleAutoLayout}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-goldline/30 bg-paper-50/90 px-4 text-sm text-ink-800 shadow-soft backdrop-blur transition hover:bg-paper-50"
                  title="使用 DAG 算法自动排列节点"
                >
                  <LayoutGrid size={17} />
                  自动整理
                </button>
                <span className="hidden min-h-10 items-center rounded-lg border border-ink-900/10 bg-paper-50/80 px-3 text-xs text-ink-600 shadow-soft backdrop-blur md:inline-flex">
                  点击节点聚焦关系 · 拖动势力框移动整组 · 拖动节点可保存布局
                </span>
              </>
            }
          />
        </div>

        {/* Time Slider — 四维时空探索 */}
        {hasYearData ? (
          <div className="mt-4">
            <TimeSlider
              minYear={minYear}
              maxYear={maxYear}
              currentYear={currentYear}
              onYearChange={setCurrentYear}
            />
          </div>
        ) : null}
      </section>

      <div className="space-y-5">
        <DetailPanel project={project} selection={selection} onRelationClick={handleRelationClick} />
        {selectedRelation ? (
          <section className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
            <p className="text-xs text-ink-500">连线样式</p>
            <h3 className="mt-1 font-serif text-xl font-semibold">{selectedRelation.type}</h3>
            <div className="mt-4">
              <EdgeStyleControls
                value={selectedRelation.style}
                onChange={(style) => updateRelationStyle(project.id, selectedRelation.id, style)}
              />
            </div>
          </section>
        ) : null}
        <section className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
          <h3 className="font-serif text-xl font-semibold">{template.pages.relationGraph.notesTitle}</h3>
          <div className="mt-4 space-y-3">
            {visibleRelations.map((relation) => {
              const isActive = focusNodeId === relation.sourceId || focusNodeId === relation.targetId
              return (
                <div
                  key={relation.id}
                  className={[
                    'rounded-lg border p-3 text-sm transition-all duration-200',
                    isActive
                      ? 'border-cinnabar/40 bg-cinnabar/5 shadow-sm'
                      : 'border-ink-900/10 bg-paper-100/65 hover:border-goldline/30',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleRelationClick(relation)}
                      className="flex flex-1 items-center gap-2 text-left text-ink-800"
                    >
                      <Crosshair
                        size={14}
                        className={isActive ? 'text-cinnabar' : 'text-ink-400'}
                      />
                      <span>{relation.type}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRelation(project.id, relation.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-cinnabar hover:bg-cinnabar/10"
                      aria-label="删除关系"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-ink-500">
                    {project.entities.find((e) => e.id === relation.sourceId)?.name}
                    {' → '}
                    {project.entities.find((e) => e.id === relation.targetId)?.name}
                  </p>
                </div>
              )
            })}
            {currentYear != null && visibleRelations.length < project.entityRelations.length ? (
              <p className="pt-1 text-center text-xs text-ink-400">
                已隐藏 {project.entityRelations.length - visibleRelations.length} 条当前年份不可见的关系
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ── Exported wrapper with ReactFlowProvider ── */

export default function RelationGraphPage() {
  return (
    <ReactFlowProvider>
      <RelationGraphInner />
    </ReactFlowProvider>
  )
}
