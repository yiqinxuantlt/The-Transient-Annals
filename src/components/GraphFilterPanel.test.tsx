import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { emptyGraphFilters } from '../lib/graphWorkbench'
import GraphFilterPanel from './GraphFilterPanel'

describe('GraphFilterPanel', () => {
  it('shows active filter count and clears filters', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()

    render(
      <GraphFilterPanel
        filters={{ ...emptyGraphFilters(), query: '刘邦', edgeTypes: ['对立'] }}
        options={{
          nodeTypes: ['person'],
          edgeTypes: ['对立'],
          tags: ['核心'],
          factions: ['汉军'],
          locations: ['关中'],
          minYear: -210,
          maxYear: -190,
        }}
        onChange={onChange}
        onClear={onClear}
      />,
    )

    expect(screen.getByText('筛选与图层')).toBeInTheDocument()
    expect(screen.getByText('已应用 2 项')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '清空筛选' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
