import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GraphEvidencePanel from './GraphEvidencePanel'

describe('GraphEvidencePanel', () => {
  it('saves an evidence chain with a summary', () => {
    const onSave = vi.fn()

    render(
      <GraphEvidencePanel
        graphMode="entities"
        nodes={[
          { id: 'a', label: '刘邦' },
          { id: 'b', label: '项羽' },
        ]}
        edges={[{ id: 'r', type: '对立', sourceId: 'a', targetId: 'b' }]}
        chain={{ nodeIds: ['a', 'b'], edgeIds: ['r'], summary: '楚汉对立。' }}
        nextSteps={[]}
        savedNotes={[]}
        onAppendStep={vi.fn()}
        onRemoveLast={vi.fn()}
        onClear={vi.fn()}
        onSummaryChange={vi.fn()}
        onSave={onSave}
        onOpenNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '保存证据链' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
