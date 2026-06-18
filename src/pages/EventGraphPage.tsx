import { Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import DetailPanel from '../components/DetailPanel'
import EdgeStyleControls from '../components/EdgeStyleControls'
import GraphCanvas from '../components/GraphCanvas'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection, EventLinkDraft } from '../types'

export default function EventGraphPage() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addEventLink = useFushengluStore((state) => state.addEventLink)
  const updateEventLinkStyle = useFushengluStore((state) => state.updateEventLinkStyle)
  const deleteEventLink = useFushengluStore((state) => state.deleteEventLink)
  const updateNodePosition = useFushengluStore((state) => state.updateEventNodePosition)
  const [selection, setSelection] = useState<DetailSelection>(
    project.events[0] ? { kind: 'event', id: project.events[0].id } : null,
  )
  const initialLink = useMemo<EventLinkDraft>(
    () => ({
      sourceEventId: project.events[0]?.id || '',
      targetEventId: project.events[1]?.id || '',
      type: template.eventLinkTypes[0] || '',
      description: '',
      style: { lineStyle: 'solid', tone: 'jade', animated: false },
    }),
    [project.events, template.eventLinkTypes],
  )
  const [draft, setDraft] = useState(initialLink)
  const [composerOpen, setComposerOpen] = useState(false)
  const selectedLink =
    selection?.kind === 'eventLink'
      ? project.eventLinks.find((link) => link.id === selection.id)
      : undefined

  const openComposer = (
    sourceEventId = initialLink.sourceEventId,
    targetEventId = initialLink.targetEventId,
  ) => {
    setDraft((value) => ({
      ...value,
      sourceEventId,
      targetEventId,
    }))
    setComposerOpen(true)
  }

  const submit = () => {
    if (!draft.sourceEventId || !draft.targetEventId || draft.sourceEventId === draft.targetEventId) return
    const id = addEventLink(project.id, draft)
    setSelection({ kind: 'eventLink', id })
    setDraft(initialLink)
    setComposerOpen(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="relative min-h-[calc(100dvh-9rem)] rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
        <div className="mb-5">
          <p className="text-sm text-ink-500">{template.pages.eventGraph.eyebrow}</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">{template.pages.eventGraph.title}</h2>
          <p className="mt-2 text-sm text-ink-700">
            {template.pages.eventGraph.description}
          </p>
        </div>

        {composerOpen ? (
          <section className="absolute left-5 right-5 top-28 z-20 rounded-lg border border-jade/30 bg-paper-50/95 p-4 shadow-archive backdrop-blur md:left-auto md:w-96">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-ink-500">Canvas Composer</p>
                <h3 className="font-serif text-xl font-semibold">{template.pages.eventGraph.composerTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                aria-label="关闭新增事件连接"
              >
                <X size={17} />
              </button>
            </div>
            <div className="grid gap-3">
              <select
                value={draft.sourceEventId}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, sourceEventId: event.target.value }))
                }
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
              >
                {project.events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <select
                value={draft.targetEventId}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, targetEventId: event.target.value }))
                }
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
              >
                {project.events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <select
                value={draft.type}
                onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
              >
                {template.eventLinkTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
                placeholder="连接说明"
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
                添加连接
              </button>
            </div>
          </section>
        ) : null}

        <div className="h-[calc(100dvh-16rem)] min-h-[540px]">
          <GraphCanvas
            project={project}
            mode="events"
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
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-jade/30 bg-paper-50/90 px-4 text-sm text-ink-800 shadow-soft backdrop-blur transition hover:bg-paper-50"
                >
                  <Plus size={17} />
                  添加连接
                </button>
                <span className="hidden min-h-10 items-center rounded-lg border border-ink-900/10 bg-paper-50/80 px-3 text-xs text-ink-600 shadow-soft backdrop-blur md:inline-flex">
                  伏笔、回收、转折可用不同线型
                </span>
              </>
            }
          />
        </div>
      </section>

      <div className="space-y-5">
        <DetailPanel project={project} selection={selection} />
        {selectedLink ? (
          <section className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
            <p className="text-xs text-ink-500">连线样式</p>
            <h3 className="mt-1 font-serif text-xl font-semibold">{selectedLink.type}</h3>
            <div className="mt-4">
              <EdgeStyleControls
                value={selectedLink.style}
                onChange={(style) => updateEventLinkStyle(project.id, selectedLink.id, style)}
              />
            </div>
          </section>
        ) : null}
        <section className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
          <h3 className="font-serif text-xl font-semibold">{template.pages.eventGraph.notesTitle}</h3>
          <div className="mt-4 space-y-3">
            {project.eventLinks.map((link) => (
              <div key={link.id} className="rounded-lg border border-ink-900/10 bg-paper-100/65 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: 'eventLink', id: link.id })}
                    className="text-left text-ink-800"
                  >
                    {link.type}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEventLink(project.id, link.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-cinnabar hover:bg-cinnabar/10"
                    aria-label="删除事件连接"
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
