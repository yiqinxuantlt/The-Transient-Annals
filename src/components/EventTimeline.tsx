import clsx from 'clsx'
import { CalendarDays, MapPin, UsersRound } from 'lucide-react'
import { useMemo } from 'react'
import { Chrono, type TimelineItem } from 'react-chrono'
import 'react-chrono/dist/style.css'
import type { Entity, StoryEvent } from '../types'

type Props = {
  events: StoryEvent[]
  entities?: Entity[]
  selectedId?: string
  onSelect: (eventId: string) => void
  compact?: boolean
}

type TimelineEventCardProps = {
  event: StoryEvent
  index: number
  relatedNames: string
  selected: boolean
  compact?: boolean
  onSelect: (eventId: string) => void
}

function TimelineEventCard({
  event,
  index,
  relatedNames,
  selected,
  compact,
  onSelect,
}: TimelineEventCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event.id)}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault()
          onSelect(event.id)
        }
      }}
      aria-pressed={selected}
      className={clsx(
        'archive-event-card mountain-wash group relative block w-full overflow-hidden rounded-lg border p-5 text-left shadow-soft outline-none transition duration-200 hover:-translate-y-0.5 hover:border-goldline/50 hover:shadow-archive focus-visible:ring-2 focus-visible:ring-goldline/45',
        selected
          ? 'border-goldline bg-gradient-to-br from-paper-50 to-goldline/10 ring-2 ring-goldline/18'
          : 'border-ink-900/10',
        compact && 'p-4',
      )}
    >
      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-goldline/70 via-cinnabar/45 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex min-h-8 items-center gap-2 rounded-full border border-goldline/20 bg-goldline/12 px-3 text-xs text-ink-700">
              <CalendarDays size={14} />
              {event.timeLabel || `顺序 ${event.order}`}
            </p>
            <h3 className="mt-3 font-serif text-xl font-semibold text-ink-900">{event.title}</h3>
          </div>
          <span className="w-fit rounded-full border border-ink-900/10 bg-paper-50/75 px-3 py-1 text-xs text-ink-700 shadow-sm">
            {String(index + 1).padStart(2, '0')} / 序 {event.order}
          </span>
        </div>

        {!compact ? (
          <>
            <p className="mt-4 text-sm leading-7 text-ink-700">
              {event.description || '尚未补充事件描述。'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-600">
              {event.location ? (
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-cinnabar/10 px-3 text-cinnabar">
                  <MapPin size={13} />
                  {event.location}
                </span>
              ) : null}
              {relatedNames ? (
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-jade/10 px-3 text-jade">
                  <UsersRound size={13} />
                  {relatedNames}
                </span>
              ) : null}
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex min-h-7 items-center rounded-full bg-goldline/12 px-3 text-ink-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </article>
  )
}

export default function EventTimeline({
  events,
  entities = [],
  selectedId,
  onSelect,
  compact,
}: Props) {
  const sortedEvents = useMemo(() => [...events].sort((a, b) => a.order - b.order), [events])
  const entityNameById = useMemo(
    () => new Map(entities.map((entity) => [entity.id, entity.name])),
    [entities],
  )
  const selectedIndex = Math.max(
    0,
    sortedEvents.findIndex((event) => event.id === selectedId),
  )

  if (sortedEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-900/20 bg-paper-50/70 p-8 text-center text-sm text-ink-500">
        还没有事件。新增事件后，时间轴会在这里展开。
      </div>
    )
  }

  const relatedNamesFor = (event: StoryEvent) =>
    event.relatedEntityIds
      .map((id) => entityNameById.get(id))
      .filter(Boolean)
      .slice(0, 3)
      .join('、')

  if (compact) {
    return (
      <div className="relative space-y-6 pl-9">
        <div className="timeline-rail absolute left-3 top-3 h-[calc(100%-1.5rem)] w-[3px] rounded-full" />
        {sortedEvents.map((event, index) => {
          const selected = selectedId === event.id

          return (
            <div key={event.id} className="relative">
              <span
                className={clsx(
                  'absolute -left-[43px] top-6 flex h-7 w-7 items-center justify-center rounded-full border bg-paper-50 shadow-soft transition',
                  selected ? 'border-goldline text-cinnabar' : 'border-goldline/70 text-goldline',
                )}
              >
                <span
                  className={clsx(
                    'h-2.5 w-2.5 rounded-full',
                    selected ? 'bg-cinnabar' : 'bg-goldline',
                  )}
                />
              </span>
              <TimelineEventCard
                event={event}
                index={index}
                relatedNames={relatedNamesFor(event)}
                selected={selected}
                compact
                onSelect={onSelect}
              />
            </div>
          )
        })}
      </div>
    )
  }

  const chronoItems: TimelineItem[] = sortedEvents.map((event) => ({
    id: event.id,
    title: event.timeLabel || `顺序 ${event.order}`,
  }))

  return (
    <div className="fsl-chrono">
      <Chrono
        items={chronoItems}
        mode="alternating"
        activeItemIndex={selectedIndex}
        contentDetailsHeight={420}
        onItemSelected={({ index }: { index: number }) => {
          const event = sortedEvents[index]
          if (event) onSelect(event.id)
        }}
        layout={{
          cardHeight: 'auto',
          cardWidth: 680,
          lineWidth: 3,
          pointSize: 18,
          responsive: { enabled: true, breakpoint: 768 },
        }}
        interaction={{
          autoScroll: false,
          cardHover: true,
          keyboardNavigation: true,
          pointClick: true,
        }}
        display={{ toolbar: { enabled: false } }}
        content={{
          alignment: { horizontal: 'stretch', vertical: 'top' },
          semanticTags: { subtitle: 'span', title: 'h3' },
        }}
        theme={{
          primary: 'rgb(185, 154, 95)',
          secondary: 'rgb(159, 76, 63)',
          cardBgColor: 'transparent',
          cardDetailsColor: 'rgb(37, 33, 27)',
          titleColor: 'rgb(81, 72, 60)',
          titleColorActive: 'rgb(159, 76, 63)',
          textColor: 'rgb(37, 33, 27)',
        }}
      >
        {sortedEvents.map((event, index) => (
          <TimelineEventCard
            key={event.id}
            event={event}
            index={index}
            relatedNames={relatedNamesFor(event)}
            selected={selectedId === event.id}
            onSelect={onSelect}
          />
        ))}
      </Chrono>
    </div>
  )
}
