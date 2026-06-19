import { describe, expect, it } from 'vitest'
import {
  formatEntityLabel,
  formatEntityOptionLabel,
  formatEntitySecondaryLabel,
  formatEventOptionLabel,
  groupEventsForTimeline,
  hasDuplicateEntityName,
} from './recordDisplay'
import type { Entity, StoryEvent } from '../types'

const entity = (overrides: Partial<Entity>): Entity => ({
  id: overrides.id || 'entity-default',
  name: overrides.name || '刘邦',
  type: overrides.type || 'person',
  tags: overrides.tags || [],
  ...overrides,
})

const event = (overrides: Partial<StoryEvent>): StoryEvent => ({
  id: overrides.id || 'event-default',
  title: overrides.title || '事件',
  timeLabel: overrides.timeLabel || '',
  order: overrides.order || 1,
  relatedEntityIds: overrides.relatedEntityIds || [],
  tags: overrides.tags || [],
  ...overrides,
})

describe('recordDisplay entity labels', () => {
  it('keeps unique entity names concise', () => {
    const entities = [
      entity({ id: 'entity-liu', name: '刘邦', identity: '汉王' }),
      entity({ id: 'entity-xiang', name: '项羽', identity: '楚军统帅' }),
    ]

    expect(formatEntityLabel(entities[0], entities, '历史人物')).toBe('刘邦')
    expect(formatEntityOptionLabel(entities[1], entities, '历史人物')).toBe('项羽')
  })

  it('adds context when entity names collide', () => {
    const entities = [
      entity({ id: 'entity-liu-king', name: '刘邦', identity: '汉王' }),
      entity({ id: 'entity-liu-scribe', name: '刘邦', faction: '史官署' }),
    ]

    expect(hasDuplicateEntityName(entities[0], entities)).toBe(true)
    expect(formatEntityLabel(entities[0], entities, '历史人物')).toBe('刘邦 · 汉王')
    expect(formatEntityLabel(entities[1], entities, '历史人物')).toBe('刘邦 · 史官署')
  })

  it('falls back to type or short id for duplicate names without metadata', () => {
    const entities = [
      entity({ id: 'entity-alpha-123456', name: '无名' }),
      entity({ id: 'entity-beta-654321', name: '无名' }),
    ]

    expect(formatEntitySecondaryLabel(entities[0], '历史人物')).toBe('历史人物')
    expect(formatEntityLabel(entities[1], entities)).toBe('无名 · 档案 beta-6')
  })
})

describe('recordDisplay event labels and timeline groups', () => {
  it('formats event selector labels with time, order, title, and context', () => {
    expect(
      formatEventOptionLabel(
        event({
          id: 'event-banquet',
          title: '鸿门宴',
          timeLabel: '前206年',
          order: 2,
          location: '鸿门',
          eventType: '转折',
        }),
      ),
    ).toBe('前206年 · #2 · 鸿门宴 · 鸿门 · 转折')
  })

  it('groups same-time events while keeping deterministic event order', () => {
    const groups = groupEventsForTimeline([
      event({ id: 'event-c', title: '后续整编', timeLabel: '前206年', order: 3 }),
      event({ id: 'event-a', title: '入关', timeLabel: '前207年', order: 1 }),
      event({ id: 'event-b', title: '鸿门宴', timeLabel: '前206年', order: 2 }),
      event({ id: 'event-d', title: '同年余波', timeLabel: '前207年', order: 4 }),
    ])

    expect(groups.map((group) => [group.label, group.events.map((item) => item.id)])).toEqual([
      ['前207年', ['event-a', 'event-d']],
      ['前206年', ['event-b', 'event-c']],
    ])
    expect(groups[1]?.startIndex).toBe(1)
  })
})
