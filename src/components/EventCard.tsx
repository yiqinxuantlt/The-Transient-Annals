import { CalendarDays, MapPin, Pencil, Trash2 } from 'lucide-react'
import type { StoryEvent } from '../types'

type Props = {
  event: StoryEvent
  selected?: boolean
  entityNames?: string[]
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function EventCard({
  event,
  selected,
  entityNames = [],
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  return (
    <article
      className={[
        'archive-card paper-grain rounded-xl border bg-paper-50/70 p-5 text-left shadow-soft backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-archive',
        selected ? 'border-cinnabar/50 ring-2 ring-cinnabar/10' : 'border-goldline/15',
      ].join(' ')}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-ink-500">
              <CalendarDays size={14} />
              {event.timeLabel || `顺序 ${event.order}`}
            </p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-ink-900">{event.title}</h3>
            {event.chapter || event.eventType ? (
              <p className="mt-2 text-xs text-ink-500">
                {[event.chapter, event.eventType].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>
          <span className="rounded-lg border border-goldline/30 bg-paper-50/60 px-3 py-2 text-sm text-ink-700">
            #{event.order}
          </span>
        </div>
        {event.location ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
            <MapPin size={14} />
            {event.location}
          </p>
        ) : null}
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-700">
          {event.description || '尚未补充事件描述。'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {event.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex min-h-7 items-center rounded-full border border-jade/25 bg-jade/10 px-3 text-xs text-ink-700"
            >
              {tag}
            </span>
          ))}
        </div>
        {entityNames.length > 0 ? (
          <p className="mt-4 text-xs text-ink-500">相关：{entityNames.join('、')}</p>
        ) : null}
      </button>
      <div className="mt-5 flex justify-end gap-2 border-t border-ink-900/10 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
          aria-label={`编辑 ${event.title}`}
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-cinnabar transition hover:bg-cinnabar/10"
          aria-label={`删除 ${event.title}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  )
}
