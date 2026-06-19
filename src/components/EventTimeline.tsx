import clsx from 'clsx'
import { CalendarDays, MapPin, UsersRound } from 'lucide-react'
import { useMemo } from 'react'
import type { EventLink, StoryEvent } from '../types'

/* ─────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────── */

type Props = {
  events: StoryEvent[]
  entities?: { id: string; name: string }[]
  eventLinks?: EventLink[]
  selectedId?: string
  onSelect: (eventId: string) => void
  compact?: boolean
}

type TimelineEventCardProps = {
  event: StoryEvent
  index: number
  relatedNames: string
  selected: boolean
  dotRole: 'source' | 'target' | 'both' | 'none'
  onSelect: (eventId: string) => void
  compact?: boolean
}

/* ─────────────────────────────────────────────────────────────────────
   Spine & dot helpers
   ───────────────────────────────────────────────────────────────────── */

const SPINE_STROKE: Record<'source' | 'target' | 'both' | 'none', string> = {
  both: 'linear-gradient(to right, rgb(159 76 63 / 0.6), rgb(85 120 111 / 0.06))',
  source: 'linear-gradient(to right, rgb(159 76 63 / 0.55), rgb(159 76 63 / 0.06))',
  target: 'linear-gradient(to right, rgb(85 120 111 / 0.55), rgb(85 120 111 / 0.06))',
  none: 'linear-gradient(to right, rgb(var(--goldline) / 0.45), rgb(var(--goldline) / 0.06))',
}

const SPINE_STROKE_RTL: Record<'source' | 'target' | 'both' | 'none', string> = {
  both: 'linear-gradient(to left, rgb(159 76 63 / 0.6), rgb(85 120 111 / 0.06))',
  source: 'linear-gradient(to left, rgb(159 76 63 / 0.55), rgb(159 76 63 / 0.06))',
  target: 'linear-gradient(to left, rgb(85 120 111 / 0.55), rgb(85 120 111 / 0.06))',
  none: 'linear-gradient(to left, rgb(var(--goldline) / 0.45), rgb(var(--goldline) / 0.06))',
}

function getDotRole(eventId: string, eventLinks: EventLink[]): 'source' | 'target' | 'both' | 'none' {
  const isSrc = eventLinks.some((l) => l.sourceEventId === eventId)
  const isTgt = eventLinks.some((l) => l.targetEventId === eventId)
  if (isSrc && isTgt) return 'both'
  if (isSrc) return 'source'
  if (isTgt) return 'target'
  return 'none'
}

/* ─────────────────────────────────────────────────────────────────────
   Event Card
   ───────────────────────────────────────────────────────────────────── */

function TimelineEventCard({
  event,
  index,
  relatedNames,
  selected,
  dotRole,
  onSelect,
  compact,
}: TimelineEventCardProps) {
  const roleLabel =
    dotRole === 'both'
      ? '因果交汇'
      : dotRole === 'source'
        ? '因果源头'
        : dotRole === 'target'
          ? '因果终点'
          : undefined

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(event.id)
        }
      }}
      aria-pressed={selected}
      className={clsx(
        'archive-card paper-grain archive-event-card mountain-wash group relative block w-full overflow-hidden rounded-lg border p-5 text-left shadow-soft outline-none transition duration-200 hover:-translate-y-0.5 hover:border-goldline/50 hover:shadow-archive focus-visible:ring-2 focus-visible:ring-goldline/45',
        selected
          ? 'border-goldline bg-gradient-to-br from-paper-50 to-goldline/10 ring-2 ring-goldline/18'
          : 'border-ink-900/10',
        compact && 'p-4',
      )}
    >
      {/* Left accent bar */}
      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-goldline/70 via-cinnabar/45 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex min-h-8 items-center gap-2 rounded-full border border-goldline/20 bg-goldline/12 px-3 text-xs text-ink-700">
              <CalendarDays size={14} />
              {event.timeLabel || `顺序 ${event.order}`}
            </p>
            <h3 className="mt-3 font-serif text-xl font-semibold text-ink-900">
              {event.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="w-fit rounded-full border border-ink-900/10 bg-paper-50/75 px-3 py-1 text-xs text-ink-700 shadow-sm">
              {String(index + 1).padStart(2, '0')} / 序 {event.order}
            </span>
            {roleLabel ? (
              <span
                className={clsx(
                  'w-fit rounded-full px-2.5 py-0.5 text-[10px] font-medium',
                  dotRole === 'source' && 'bg-cinnabar/10 text-cinnabar',
                  dotRole === 'target' && 'bg-jade/10 text-jade',
                  dotRole === 'both' && 'bg-goldline/12 text-ink-700',
                )}
              >
                {roleLabel}
              </span>
            ) : null}
          </div>
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

/* ─────────────────────────────────────────────────────────────────────
   Empty state
   ───────────────────────────────────────────────────────────────────── */

function EmptyTimeline() {
  return (
    <div className="archive-card paper-grain rounded-lg border border-dashed border-goldline/25 bg-paper-50/70 p-8 text-center text-sm text-ink-500">
      还没有事件。新增事件后，时间轴会在这里展开。
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────────────── */

export default function EventTimeline({
  events,
  entities = [],
  eventLinks = [],
  selectedId,
  onSelect,
  compact,
}: Props) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.order - b.order),
    [events],
  )

  const idToName = useMemo(
    () => new Map(entities.map((e) => [e.id, e.name])),
    [entities],
  )

  const relatedNamesFor = (event: StoryEvent) =>
    event.relatedEntityIds
      .map((id) => idToName.get(id))
      .filter(Boolean)
      .slice(0, 3)
      .join('、')

  if (sortedEvents.length === 0) return <EmptyTimeline />

  /* ──────────────────────────────────────────────────────────────
     Compact mode: left-rail (dashboard)
     ────────────────────────────────────────────────────────────── */
  if (compact) {
    return (
      <div className="timeline-compact">
        <div className="timeline-compact-rail" aria-hidden="true" />
        {sortedEvents.map((event, index) => {
          const selected = selectedId === event.id
          const role = getDotRole(event.id, eventLinks)
          return (
            <div key={event.id} className="timeline-compact-item">
              <button
                type="button"
                className={clsx(
                  'timeline-compact-dot',
                  selected && 'timeline-compact-dot-selected',
                )}
                style={{
                  borderColor: selected
                    ? undefined
                    : role === 'source'
                      ? 'rgb(159 76 63 / 0.55)'
                      : role === 'target'
                        ? 'rgb(85 120 111 / 0.55)'
                        : role === 'both'
                          ? 'rgb(185 154 95 / 0.55)'
                          : undefined,
                }}
                onClick={() => onSelect(event.id)}
                aria-label={`选择事件：${event.title}`}
              >
                <span className="timeline-compact-dot-inner" />
              </button>

              <TimelineEventCard
                event={event}
                index={index}
                relatedNames={relatedNamesFor(event)}
                selected={selected}
                dotRole={role}
                compact
                onSelect={onSelect}
              />
            </div>
          )
        })}
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────────
     Full mode: alternating left-right layout
     ────────────────────────────────────────────────────────────── */
  return (
    <div className="timeline-container">
      {/* Central vertical spine */}
      <div className="timeline-spine" aria-hidden="true" />

      <div className="relative">
        {sortedEvents.map((event, index) => {
          const isLeft = index % 2 === 0
          const selected = selectedId === event.id
          const role = getDotRole(event.id, eventLinks)

          return (
            <div
              key={event.id}
              className={clsx(
                'timeline-row',
                isLeft ? 'timeline-row-left' : 'timeline-row-right',
              )}
            >
              {/* ── Left cell ── */}
              <div className="timeline-left-cell">
                {isLeft ? (
                  <div className="timeline-card-wrapper">
                    <TimelineEventCard
                      event={event}
                      index={index}
                      relatedNames={relatedNamesFor(event)}
                      selected={selected}
                      dotRole={role}
                      onSelect={onSelect}
                    />
                  </div>
                ) : null}
              </div>

              {/* ── Center cell: dot, connector, time label ── */}
              <div className="timeline-center-cell">
                {/* Horizontal connector line */}
                <div className="timeline-connector" aria-hidden="true" />

                {/* Colored spine connector (dynamic) */}
                <div
                  className="timeline-spine-connector"
                  aria-hidden="true"
                  style={{
                    background: isLeft
                      ? SPINE_STROKE_RTL[role]
                      : SPINE_STROKE[role],
                    left: isLeft ? 0 : undefined,
                    right: isLeft ? undefined : 0,
                  }}
                />

                {/* Interaction dot */}
                <button
                  type="button"
                  className={clsx(
                    'timeline-dot',
                    selected && 'timeline-dot-selected',
                    role === 'source' && !selected && 'timeline-dot-source',
                    role === 'target' && !selected && 'timeline-dot-target',
                    role === 'both' && !selected && 'timeline-dot-both',
                  )}
                  onClick={() => onSelect(event.id)}
                  aria-label={`选择事件：${event.title}`}
                >
                  <span className="timeline-dot-inner" />
                </button>

                {/* Time label below the dot */}
                <span className="timeline-time-label">
                  {event.timeLabel || `#${event.order}`}
                </span>
              </div>

              {/* ── Right cell ── */}
              <div className="timeline-right-cell">
                {!isLeft ? (
                  <div className="timeline-card-wrapper">
                    <TimelineEventCard
                      event={event}
                      index={index}
                      relatedNames={relatedNamesFor(event)}
                      selected={selected}
                      dotRole={role}
                      onSelect={onSelect}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
