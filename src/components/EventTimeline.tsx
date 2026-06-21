import clsx from 'clsx'
import { CalendarDays, Layers, MapPin, UsersRound } from 'lucide-react'
import { useMemo } from 'react'
import { groupEventsForTimeline } from '../lib/recordDisplay'
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
  horizontal?: boolean
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

function combineDotRoles(events: StoryEvent[], eventLinks: EventLink[]): 'source' | 'target' | 'both' | 'none' {
  const roles = events.map((event) => getDotRole(event.id, eventLinks))
  if (roles.includes('both')) return 'both'
  if (roles.includes('source') && roles.includes('target')) return 'both'
  if (roles.includes('source')) return 'source'
  if (roles.includes('target')) return 'target'
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
      aria-label={`选择事件：${event.title}`}
      className={clsx(
        'group relative block w-full overflow-hidden rounded-lg border text-left outline-none transition-all duration-150',
        selected
          ? 'border-cinnabar/30 bg-paper-50 shadow-[0_4px_20px_rgb(159_76_63/0.08)] ring-1 ring-cinnabar/15 dark:border-cinnabar/40 dark:shadow-none'
          : 'border-ink-900/[0.08] bg-paper-50 shadow-[0_1px_3px_rgb(0_0_0/0.04)] hover:border-ink-900/[0.14] hover:shadow-[0_3px_12px_rgb(0_0_0/0.06)] dark:border-ink-900/[0.12] dark:shadow-none dark:hover:border-ink-900/[0.2]',
        compact ? 'p-3.5' : 'p-5',
      )}
    >
      {/* Left accent bar for selected */}
      {selected && (
        <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-cinnabar/60" />
      )}

      <div className="relative z-10">
        {compact ? (
          /* ── Compact layout (horizontal timeline) ── */
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-[0.8125rem] font-semibold leading-snug text-ink-900 line-clamp-2">
                {event.title}
              </h3>
              <span className="shrink-0 rounded bg-ink-900/[0.04] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-500">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded bg-cinnabar/[0.06] px-1.5 py-0.5 text-[10px] text-cinnabar/80">
                <CalendarDays size={10} />
                {event.timeLabel || `顺序 ${event.order}`}
              </span>
              {roleLabel ? (
                <span
                  className={clsx(
                    'rounded px-1.5 py-0.5 text-[10px] font-medium',
                    dotRole === 'source' && 'bg-cinnabar/[0.06] text-cinnabar/80',
                    dotRole === 'target' && 'bg-jade/[0.06] text-jade/80',
                    dotRole === 'both' && 'bg-goldline/[0.08] text-ink-600',
                  )}
                >
                  {roleLabel}
                </span>
              ) : null}
            </div>
            {relatedNames ? (
              <p className="mt-1.5 truncate text-[10px] text-ink-500/70">
                {relatedNames}
              </p>
            ) : null}
          </div>
        ) : (
          /* ── Full layout (vertical timeline) ── */
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="inline-flex min-h-7 items-center gap-1.5 rounded-md bg-cinnabar/[0.06] px-2.5 text-xs text-cinnabar/80">
                  <CalendarDays size={13} />
                  {event.timeLabel || `顺序 ${event.order}`}
                </p>
                <h3 className="mt-3 font-serif text-xl font-semibold text-ink-900">
                  {event.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="w-fit rounded-md bg-ink-900/[0.04] px-2.5 py-1 text-xs font-medium tabular-nums text-ink-500">
                  {String(index + 1).padStart(2, '0')} / 序 {event.order}
                </span>
                {roleLabel ? (
                  <span
                    className={clsx(
                      'w-fit rounded-md px-2 py-0.5 text-[10px] font-medium',
                      dotRole === 'source' && 'bg-cinnabar/[0.06] text-cinnabar/80',
                      dotRole === 'target' && 'bg-jade/[0.06] text-jade/80',
                      dotRole === 'both' && 'bg-goldline/[0.08] text-ink-600',
                    )}
                  >
                    {roleLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-ink-600">
              {event.description || '尚未补充事件描述。'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-600">
              {event.location ? (
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-md bg-cinnabar/[0.06] px-2.5 text-cinnabar/80">
                  <MapPin size={12} />
                  {event.location}
                </span>
              ) : null}
              {relatedNames ? (
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-md bg-jade/[0.06] px-2.5 text-jade/80">
                  <UsersRound size={12} />
                  {relatedNames}
                </span>
              ) : null}
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex min-h-7 items-center rounded-md bg-ink-900/[0.03] px-2.5 text-ink-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   Stacked cards — layered deck effect for grouped events
   ───────────────────────────────────────────────────────────────────── */

const STACK_PEEK_VISIBLE = 36   // px of peek card visible below top card
const STACK_H_PEEK_VISIBLE = 40 // px of peek card visible to the right in horizontal
const STACK_PEEK_OFFSET = 14    // px spacing between successive peek strips
const STACK_H_PEEK_OFFSET = 16  // px spacing for horizontal
const STACK_SCALE_STEP = 0.022  // scale reduction per depth level

function StackedCards({
  events,
  startIndex,
  selectedId,
  onSelect,
  entities,
  eventLinks,
  compact,
  horizontal,
}: {
  events: StoryEvent[]
  startIndex: number
  selectedId?: string
  onSelect: (id: string) => void
  entities: { id: string; name: string }[]
  eventLinks: EventLink[]
  compact?: boolean
  horizontal?: boolean
}) {
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

  // Find the selected card index within this group
  const selectedIdx = events.findIndex((e) => e.id === selectedId)
  const topIdx = selectedIdx >= 0 ? selectedIdx : 0

  const ordered: { event: StoryEvent; origIdx: number }[] = [
    { event: events[topIdx], origIdx: topIdx },
    ...events
      .map((event, origIdx) => ({ event, origIdx }))
      .filter((_, i) => i !== topIdx),
  ]

  const peekVisible = horizontal ? STACK_H_PEEK_VISIBLE : STACK_PEEK_VISIBLE
  const peekSpacing = horizontal ? STACK_H_PEEK_OFFSET : STACK_PEEK_OFFSET
  const peekCount = ordered.length - 1

  return (
    <div
      className={clsx(
        'timeline-card-stack',
        horizontal && 'timeline-stack-horizontal',
      )}
    >
      {ordered.map(({ event, origIdx }, pos) => {
        const isTop = pos === 0
        const depth = pos
        const isSelected = event.id === selectedId

        if (isTop) {
          return (
            <div key={event.id} className="timeline-stack-top">
              <TimelineEventCard
                event={event}
                index={startIndex + origIdx}
                relatedNames={relatedNamesFor(event)}
                selected={isSelected}
                dotRole={getDotRole(event.id, eventLinks)}
                onSelect={onSelect}
                compact={compact}
              />
            </div>
          )
        }

        // Each peek card uses margin-top to pull up behind the top card,
        // leaving only `peekVisible` pixels exposed below the top card's bottom.
        // Successive peek cards are offset further to create a fanned deck effect.
        const marginTop = -(peekVisible + (depth - 1) * (peekVisible - peekSpacing))

        return (
          <div
            key={event.id}
            role="button"
            tabIndex={-1}
            aria-label={`选择事件：${event.title}`}
            className="timeline-stack-peek"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(event.id)
            }}
            style={{
              marginTop,
              opacity: Math.max(0.4, 0.78 - (depth - 1) * 0.18),
              transform: `scale(${1 - depth * STACK_SCALE_STEP})`,
              zIndex: 20 - depth,
            }}
          >
            <div
              className={clsx(
                'overflow-hidden rounded-lg border',
                horizontal ? 'p-3.5' : 'p-4',
              )}
              style={{ borderColor: 'rgb(var(--ink-900) / 0.06)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={clsx(
                    'font-serif font-semibold leading-snug text-ink-900',
                    compact ? 'text-[0.8125rem] line-clamp-1' : 'text-base line-clamp-2',
                  )}
                >
                  {event.title}
                </h3>
                <span className="shrink-0 rounded bg-ink-900/[0.04] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-400">
                  {String(startIndex + origIdx + 1).padStart(2, '0')}
                </span>
              </div>
              {!compact && (
                <p className="mt-1.5 text-xs leading-5 text-ink-500/70 line-clamp-1">
                  {event.description || '尚未补充事件描述。'}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] text-ink-400">
                  <CalendarDays size={10} />
                  {event.timeLabel || `顺序 ${event.order}`}
                </span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Stack count indicator */}
      {peekCount > 0 && (
        <div className="mt-1.5 flex items-center justify-center">
          <span className="inline-flex items-center gap-1 rounded-md border border-ink-900/[0.06] bg-paper-50/80 px-2 py-0.5 text-[10px] font-medium text-ink-400 backdrop-blur-sm dark:border-ink-900/[0.12] dark:bg-paper-100/60">
            <Layers size={10} />
            {events.length} 件
          </span>
        </div>
      )}
    </div>
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
   Horizontal Timeline Components
   ───────────────────────────────────────────────────────────────────── */

function HorizontalTimeline({
  events,
  entities = [],
  eventLinks = [],
  selectedId,
  onSelect,
}: Props) {
  const timelineGroups = useMemo(() => groupEventsForTimeline(events), [events])

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

  if (timelineGroups.length === 0) return <EmptyTimeline />

  return (
    <div className="timeline-horizontal-wrapper">
      {/* Horizontal spine */}
      <div className="timeline-horizontal-spine" aria-hidden="true" />

      <div className="timeline-horizontal-track">
        {timelineGroups.map((group, groupIndex) => {
          const primaryEvent = group.events[0]
          const selected = group.events.some((event) => selectedId === event.id)
          const role = combineDotRoles(group.events, eventLinks)
          const isTop = groupIndex % 2 === 0
          const hasMultiple = group.events.length > 1

          return (
            <div
              key={group.key}
              className={clsx(
                'timeline-horizontal-group',
                isTop ? 'timeline-horizontal-group-top' : 'timeline-horizontal-group-bottom',
              )}
            >
              {/* Event cards — stacked if multiple */}
              <div className="timeline-horizontal-cards">
                {hasMultiple ? (
                  <StackedCards
                    events={group.events}
                    startIndex={group.startIndex}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    entities={entities}
                    eventLinks={eventLinks}
                    compact
                    horizontal
                  />
                ) : (
                  <TimelineEventCard
                    event={primaryEvent}
                    index={group.startIndex}
                    relatedNames={relatedNamesFor(primaryEvent)}
                    selected={selectedId === primaryEvent.id}
                    dotRole={getDotRole(primaryEvent.id, eventLinks)}
                    onSelect={onSelect}
                    compact
                  />
                )}
              </div>

              {/* Vertical connector from spine to card */}
              <div className="timeline-horizontal-connector" aria-hidden="true" />

              {/* Colored spine connector */}
              <div
                className="timeline-horizontal-spine-connector"
                aria-hidden="true"
                style={{
                  background:
                    role === 'both'
                      ? 'linear-gradient(to bottom, rgb(159 76 63 / 0.6), rgb(85 120 111 / 0.06))'
                      : role === 'source'
                        ? 'linear-gradient(to bottom, rgb(159 76 63 / 0.55), rgb(159 76 63 / 0.06))'
                        : role === 'target'
                          ? 'linear-gradient(to bottom, rgb(85 120 111 / 0.55), rgb(85 120 111 / 0.06))'
                          : 'linear-gradient(to bottom, rgb(var(--goldline) / 0.45), rgb(var(--goldline) / 0.06))',
                }}
              />

              {/* Dot on the spine */}
              <button
                type="button"
                className={clsx(
                  'timeline-horizontal-dot',
                  selected && 'timeline-horizontal-dot-selected',
                  role === 'source' && !selected && 'timeline-horizontal-dot-source',
                  role === 'target' && !selected && 'timeline-horizontal-dot-target',
                  role === 'both' && !selected && 'timeline-horizontal-dot-both',
                )}
                onClick={() => onSelect(primaryEvent.id)}
                aria-label={`选择时间节点：${group.label}`}
              >
                <span className="timeline-horizontal-dot-inner" />
              </button>

              {/* Time label */}
              <span className="timeline-horizontal-time-label">
                {group.label}
                {group.events.length > 1 ? (
                  <span className="ml-1 rounded-full bg-goldline/12 px-1.5 py-0.5 text-[10px] text-ink-600">
                    {group.events.length}
                  </span>
                ) : null}
              </span>
            </div>
          )
        })}
      </div>
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
  horizontal,
}: Props) {
  const timelineGroups = useMemo(() => groupEventsForTimeline(events), [events])

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

  if (timelineGroups.length === 0) return <EmptyTimeline />

  /* ──────────────────────────────────────────────────────────────
     Horizontal mode
     ────────────────────────────────────────────────────────────── */
  if (horizontal) {
    return (
      <HorizontalTimeline
        events={events}
        entities={entities}
        eventLinks={eventLinks}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    )
  }

  /* ──────────────────────────────────────────────────────────────
     Compact mode: left-rail (dashboard)
     ────────────────────────────────────────────────────────────── */
  if (compact) {
    return (
      <div className="timeline-compact">
        <div className="timeline-compact-rail" aria-hidden="true" />
        {timelineGroups.flatMap((group) =>
          group.events.map((event, eventIndex) => {
            const index = group.startIndex + eventIndex
            const selected = selectedId === event.id
            const role = getDotRole(event.id, eventLinks)

            return (
              <div key={event.id} className="timeline-compact-item">
                {eventIndex === 0 ? (
                  <p className="mb-2 text-xs text-ink-500">
                    {group.label}
                    {group.events.length > 1 ? ` · 同时段 ${group.events.length} 件` : null}
                  </p>
                ) : null}
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
          }),
        )}
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
        {timelineGroups.map((group, groupIndex) => {
          const isLeft = groupIndex % 2 === 0
          const primaryEvent = group.events[0]
          const selected = group.events.some((event) => selectedId === event.id)
          const role = combineDotRoles(group.events, eventLinks)
          const hasMultiple = group.events.length > 1

          const eventCards = (
            <div className="timeline-card-wrapper">
              {hasMultiple ? (
                <StackedCards
                  events={group.events}
                  startIndex={group.startIndex}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  entities={entities}
                  eventLinks={eventLinks}
                />
              ) : (
                <TimelineEventCard
                  event={primaryEvent}
                  index={group.startIndex}
                  relatedNames={relatedNamesFor(primaryEvent)}
                  selected={selectedId === primaryEvent.id}
                  dotRole={getDotRole(primaryEvent.id, eventLinks)}
                  onSelect={onSelect}
                />
              )}
            </div>
          )

          return (
            <div
              key={group.key}
              className={clsx(
                'timeline-row',
                isLeft ? 'timeline-row-left' : 'timeline-row-right',
              )}
            >
              {/* ── Left cell ── */}
              <div className="timeline-left-cell">
                {isLeft ? eventCards : null}
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
                  onClick={() => onSelect(primaryEvent.id)}
                  aria-label={`选择时间节点：${group.label}`}
                >
                  <span className="timeline-dot-inner" />
                </button>

                {/* Time label below the dot */}
                <span className="timeline-time-label">
                  {group.label}
                  {hasMultiple ? (
                    <span className="mt-1 block rounded-full bg-ink-900/[0.04] px-2 py-0.5 text-[10px] text-ink-500">
                      共 {group.events.length} 件
                    </span>
                  ) : null}
                </span>
              </div>

              {/* ── Right cell ── */}
              <div className="timeline-right-cell">
                {!isLeft ? eventCards : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
