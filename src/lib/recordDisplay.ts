import type { Entity, StoryEvent } from '../types'

const unnamed = '未命名'

const normalizeText = (value?: string) => value?.trim().toLocaleLowerCase() || ''

const shortId = (id: string) => id.replace(/^(entity|event|relation|eventlink)-/, '').slice(0, 6)

export function sortedEventsForDisplay(events: StoryEvent[]) {
  return [...events].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    const titleCompare = a.title.localeCompare(b.title, 'zh-CN')
    if (titleCompare !== 0) return titleCompare
    return a.id.localeCompare(b.id)
  })
}

export function eventTimeNodeLabel(event: StoryEvent) {
  return event.timeLabel.trim() || `顺序 ${event.order}`
}

export type TimelineEventGroup = {
  key: string
  label: string
  events: StoryEvent[]
  startIndex: number
}

export function groupEventsForTimeline(events: StoryEvent[]): TimelineEventGroup[] {
  const groupByKey = new Map<string, TimelineEventGroup>()

  for (const [index, event] of sortedEventsForDisplay(events).entries()) {
    const label = eventTimeNodeLabel(event)
    const key = normalizeText(label) || `order-${event.order}`
    const group = groupByKey.get(key)

    if (group) {
      group.events.push(event)
    } else {
      groupByKey.set(key, { key, label, events: [event], startIndex: index })
    }
  }

  return Array.from(groupByKey.values())
}

export function hasDuplicateEntityName(entity: Entity, entities: Entity[]) {
  const name = normalizeText(entity.name)
  if (!name) return false
  return entities.filter((item) => normalizeText(item.name) === name).length > 1
}

export function entityContext(entity: Entity, typeLabel?: string) {
  return (
    entity.identity?.trim() ||
    entity.faction?.trim() ||
    entity.dynasty?.trim() ||
    typeLabel?.trim() ||
    `档案 ${shortId(entity.id)}`
  )
}

export function formatEntityLabel(entity: Entity, entities: Entity[], typeLabel?: string) {
  const name = entity.name.trim() || unnamed
  return hasDuplicateEntityName(entity, entities) ? `${name} · ${entityContext(entity, typeLabel)}` : name
}

export function formatEntityOptionLabel(entity: Entity, entities: Entity[], typeLabel?: string) {
  return formatEntityLabel(entity, entities, typeLabel)
}

export function formatEntitySecondaryLabel(entity: Entity, typeLabel?: string) {
  return entityContext(entity, typeLabel)
}

export function formatEventOptionLabel(event: StoryEvent) {
  const title = event.title.trim() || unnamed
  const meta = [eventTimeNodeLabel(event), `#${event.order}`]
  const context = [event.location, event.chapter, event.eventType]
    .map((value) => value?.trim())
    .filter(Boolean)

  return `${meta.join(' · ')} · ${title}${context.length ? ` · ${context.join(' · ')}` : ''}`
}
