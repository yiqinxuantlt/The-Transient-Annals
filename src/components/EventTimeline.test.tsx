import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventTimeline from './EventTimeline'
import type { StoryEvent } from '../types'

const event = (overrides: Partial<StoryEvent>): StoryEvent => ({
  id: overrides.id || 'event-default',
  title: overrides.title || '事件',
  timeLabel: overrides.timeLabel || '',
  order: overrides.order || 1,
  relatedEntityIds: overrides.relatedEntityIds || [],
  tags: overrides.tags || [],
  ...overrides,
})

describe('EventTimeline', () => {
  it('groups same-time events without merging their selection ids', () => {
    const onSelect = vi.fn()

    render(
      <EventTimeline
        events={[
          event({ id: 'event-entry', title: '入关', timeLabel: '前206年', order: 1 }),
          event({ id: 'event-banquet', title: '鸿门宴', timeLabel: '前206年', order: 2 }),
          event({ id: 'event-border', title: '边境整编', timeLabel: '前205年', order: 3 }),
        ]}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText('共 2 件')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '选择事件：入关' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '选择事件：鸿门宴' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '选择事件：鸿门宴' }))
    expect(onSelect).toHaveBeenCalledWith('event-banquet')
  })
})

