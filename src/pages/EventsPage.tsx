import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import DetailPanel from '../components/DetailPanel'
import EditorModal from '../components/EditorModal'
import EventCard from '../components/EventCard'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import type { DetailSelection, StoryEvent, StoryEventDraft } from '../types'

const parseTags = (value: string) =>
  value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

const emptyEvent = (order: number): StoryEventDraft => ({
  title: '',
  timeLabel: '',
  order,
  location: '',
  description: '',
  relatedEntityIds: [],
  tags: [],
})

const toDraft = (event: StoryEvent): StoryEventDraft => ({
  title: event.title,
  timeLabel: event.timeLabel,
  order: event.order,
  location: event.location || '',
  description: event.description || '',
  relatedEntityIds: event.relatedEntityIds,
  tags: event.tags,
})

const linkTypes = ['导致', '影响', '转折', '伏笔', '回收', '对照', '背景']

export default function EventsPage() {
  const project = useProject()
  const addEvent = useFushengluStore((state) => state.addEvent)
  const updateEvent = useFushengluStore((state) => state.updateEvent)
  const deleteEvent = useFushengluStore((state) => state.deleteEvent)
  const addEventLink = useFushengluStore((state) => state.addEventLink)
  const deleteEventLink = useFushengluStore((state) => state.deleteEventLink)
  const nextOrder = Math.max(0, ...project.events.map((event) => event.order)) + 1
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<DetailSelection>(
    project.events[0] ? { kind: 'event', id: project.events[0].id } : null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<StoryEventDraft>(() => emptyEvent(nextOrder))
  const [tagText, setTagText] = useState('')
  const initialLink = useMemo(
    () => ({
      sourceEventId: project.events[0]?.id || '',
      targetEventId: project.events[1]?.id || '',
      type: '导致',
      description: '',
    }),
    [project.events],
  )
  const [linkDraft, setLinkDraft] = useState(initialLink)

  const filteredEvents = project.events
    .filter((event) => {
      const text = `${event.title} ${event.timeLabel} ${event.location || ''} ${event.tags.join(' ')}`
      return text.toLowerCase().includes(query.toLowerCase())
    })
    .sort((a, b) => a.order - b.order)

  const openCreate = () => {
    setEditingId(null)
    setDraft(emptyEvent(nextOrder))
    setTagText('')
    setModalOpen(true)
  }

  const openEdit = (event: StoryEvent) => {
    setEditingId(event.id)
    setDraft(toDraft(event))
    setTagText(event.tags.join('，'))
    setModalOpen(true)
  }

  const saveEvent = () => {
    const nextDraft = {
      ...draft,
      title: draft.title.trim(),
      timeLabel: draft.timeLabel.trim(),
      order: Number(draft.order) || nextOrder,
      tags: parseTags(tagText),
    }
    if (!nextDraft.title) return

    if (editingId) {
      updateEvent(project.id, editingId, nextDraft)
      setSelection({ kind: 'event', id: editingId })
    } else {
      const id = addEvent(project.id, nextDraft)
      setSelection({ kind: 'event', id })
    }
    setModalOpen(false)
  }

  const toggleRelatedEntity = (entityId: string) => {
    setDraft((value) => ({
      ...value,
      relatedEntityIds: value.relatedEntityIds.includes(entityId)
        ? value.relatedEntityIds.filter((id) => id !== entityId)
        : [...value.relatedEntityIds, entityId],
    }))
  }

  const submitLink = () => {
    if (!linkDraft.sourceEventId || !linkDraft.targetEventId || linkDraft.sourceEventId === linkDraft.targetEventId) {
      return
    }
    const id = addEventLink(project.id, linkDraft)
    setSelection({ kind: 'eventLink', id })
    setLinkDraft(initialLink)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <div className="rounded-lg border border-ink-900/10 bg-paper-50 p-6 shadow-soft">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-ink-500">Events</p>
              <h2 className="mt-1 font-serif text-3xl font-semibold">事件簿</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-700">
                管理历史事件、章节情节、伏笔节点与回收节点。事件连接会在因果图中呈现。
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-5 text-paper-50 shadow-soft transition hover:bg-ink-700"
            >
              <Plus size={18} />
              新增事件
            </button>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、时间标签、地点或标签"
            className="mt-6 min-h-11 w-full rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none focus:border-goldline"
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredEvents.map((event) => {
            const names = event.relatedEntityIds
              .map((id) => project.entities.find((entity) => entity.id === id)?.name)
              .filter(Boolean) as string[]

            return (
              <EventCard
                key={event.id}
                event={event}
                entityNames={names}
                selected={selection?.kind === 'event' && selection.id === event.id}
                onSelect={() => setSelection({ kind: 'event', id: event.id })}
                onEdit={() => openEdit(event)}
                onDelete={() => {
                  if (window.confirm(`确认删除「${event.title}」？相关事件连接也会移除。`)) {
                    deleteEvent(project.id, event.id)
                    setSelection(null)
                  }
                }}
              />
            )
          })}
        </div>
      </section>

      <div className="space-y-5">
        <DetailPanel project={project} selection={selection} />
        <section className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
          <h3 className="font-serif text-xl font-semibold">因果快记</h3>
          <div className="mt-4 grid gap-3">
            <select
              value={linkDraft.sourceEventId}
              onChange={(event) =>
                setLinkDraft((value) => ({ ...value, sourceEventId: event.target.value }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
            >
              {project.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <select
              value={linkDraft.targetEventId}
              onChange={(event) =>
                setLinkDraft((value) => ({ ...value, targetEventId: event.target.value }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
            >
              {project.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <select
              value={linkDraft.type}
              onChange={(event) => setLinkDraft((value) => ({ ...value, type: event.target.value }))}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm outline-none"
            >
              {linkTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <textarea
              value={linkDraft.description}
              onChange={(event) =>
                setLinkDraft((value) => ({ ...value, description: event.target.value }))
              }
              placeholder="连接说明"
              className="min-h-24 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={submitLink}
              className="min-h-11 rounded-lg bg-ink-900 px-4 text-sm text-paper-50 transition hover:bg-ink-700"
            >
              添加连接
            </button>
          </div>
          <div className="mt-5 space-y-2">
            {project.eventLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-paper-100/65 px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'eventLink', id: link.id })}
                  className="text-left text-ink-700"
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
            ))}
          </div>
        </section>
      </div>

      <EditorModal
        open={modalOpen}
        title={editingId ? '编辑事件' : '新增事件'}
        submitLabel={editingId ? '保存修改' : '创建事件'}
        onClose={() => setModalOpen(false)}
        onSubmit={saveEvent}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            事件标题
            <input
              value={draft.title}
              onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm">
            时间标签
            <input
              value={draft.timeLabel}
              onChange={(event) =>
                setDraft((value) => ({ ...value, timeLabel: event.target.value }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              placeholder="前207年 / 第6章 / 第一幕"
            />
          </label>
          <label className="grid gap-2 text-sm">
            顺序
            <input
              type="number"
              value={draft.order}
              onChange={(event) =>
                setDraft((value) => ({ ...value, order: Number(event.target.value) }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm">
            地点
            <input
              value={draft.location}
              onChange={(event) =>
                setDraft((value) => ({ ...value, location: event.target.value }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            事件描述
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((value) => ({ ...value, description: event.target.value }))
              }
              className="min-h-28 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 outline-none focus:border-goldline"
            />
          </label>
          <div className="grid gap-2 text-sm md:col-span-2">
            相关人物 / 角色
            <div className="grid gap-2 rounded-lg border border-ink-900/10 bg-paper-100/65 p-3 sm:grid-cols-2">
              {project.entities.map((entity) => (
                <label key={entity.id} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={draft.relatedEntityIds.includes(entity.id)}
                    onChange={() => toggleRelatedEntity(entity.id)}
                  />
                  {entity.name}
                </label>
              ))}
            </div>
          </div>
          <label className="grid gap-2 text-sm md:col-span-2">
            标签
            <input
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              placeholder="用逗号分隔，例如：伏笔，转折"
            />
          </label>
        </div>
      </EditorModal>
    </div>
  )
}
