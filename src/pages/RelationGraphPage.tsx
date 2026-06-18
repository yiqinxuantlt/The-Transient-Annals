import { Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import DetailPanel from '../components/DetailPanel'
import EdgeStyleControls from '../components/EdgeStyleControls'
import GraphCanvas from '../components/GraphCanvas'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection, EntityRelationDraft } from '../types'

export default function RelationGraphPage() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addRelation = useFushengluStore((state) => state.addEntityRelation)
  const updateRelationStyle = useFushengluStore((state) => state.updateEntityRelationStyle)
  const deleteRelation = useFushengluStore((state) => state.deleteEntityRelation)
  const updateNodePosition = useFushengluStore((state) => state.updateEntityNodePosition)
  const [selection, setSelection] = useState<DetailSelection>(
    project.entities[0] ? { kind: 'entity', id: project.entities[0].id } : null,
  )
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
                <span className="hidden min-h-10 items-center rounded-lg border border-ink-900/10 bg-paper-50/80 px-3 text-xs text-ink-600 shadow-soft backdrop-blur md:inline-flex">
                  拖动节点可保存布局
                </span>
              </>
            }
          />
        </div>
      </section>

      <div className="space-y-5">
        <DetailPanel project={project} selection={selection} />
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
            {project.entityRelations.map((relation) => (
              <div key={relation.id} className="rounded-lg border border-ink-900/10 bg-paper-100/65 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: 'entityRelation', id: relation.id })}
                    className="text-left text-ink-800"
                  >
                    {relation.type}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRelation(project.id, relation.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-cinnabar hover:bg-cinnabar/10"
                    aria-label="删除关系"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
