import { CalendarDays, MapPin, UsersRound } from 'lucide-react'
import type { Entity, StoryEvent } from '../types'

type Props = {
  events: StoryEvent[]
  entities?: Entity[]
  selectedId?: string
  onSelect: (eventId: string) => void
  compact?: boolean
}

export default function EventTimeline({ events, entities = [], selectedId, onSelect, compact }: Props) {
  const sortedEvents = [...events].sort((a, b) => a.order - b.order)

  if (sortedEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-900/20 bg-paper-50/70 p-8 text-center text-sm text-ink-500">
        还没有事件。新增事件后，时间线会在这里展开。
      </div>
    )
  }

  return (
    <div className="relative space-y-5 pl-8">
      <div className="absolute left-3 top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-goldline via-goldline/55 to-transparent" />
      {sortedEvents.map((event) => {
        const relatedNames = event.relatedEntityIds
          .map((id) => entities.find((entity) => entity.id === id)?.name)
          .filter(Boolean)
          .slice(0, 3)
          .join('、')

        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelect(event.id)}
            className={[
              'group relative block w-full rounded-lg border bg-paper-50 p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-goldline/45 hover:shadow-archive',
              selectedId === event.id
                ? 'border-cinnabar/55 ring-2 ring-cinnabar/12'
                : 'border-ink-900/10',
              compact ? 'p-4' : '',
            ].join(' ')}
          >
            <span className="absolute -left-[34px] top-6 flex h-5 w-5 items-center justify-center rounded-full border border-goldline bg-paper-50 shadow-soft">
              <span className="h-2 w-2 rounded-full bg-cinnabar" />
            </span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full bg-goldline/12 px-3 py-1 text-xs text-ink-700">
                  <CalendarDays size={14} />
                  {event.timeLabel || `顺序 ${event.order}`}
                </p>
                <h3 className="mt-3 font-serif text-xl font-semibold text-ink-900">{event.title}</h3>
              </div>
              <span className="w-fit rounded-full border border-ink-900/10 bg-paper-100/65 px-3 py-1 text-xs text-ink-700">
                序 {event.order}
              </span>
            </div>

            {!compact ? (
              <>
                <p className="mt-4 text-sm leading-7 text-ink-700">
                  {event.description || '尚未补充事件描述。'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-600">
                  {event.location ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cinnabar/10 px-3 py-1 text-cinnabar">
                      <MapPin size={13} />
                      {event.location}
                    </span>
                  ) : null}
                  {relatedNames ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-jade/10 px-3 py-1 text-jade">
                      <UsersRound size={13} />
                      {relatedNames}
                    </span>
                  ) : null}
                  {event.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-goldline/12 px-3 py-1 text-ink-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
