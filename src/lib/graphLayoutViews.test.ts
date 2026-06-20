import { describe, expect, it } from 'vitest'
import { createFictionSampleProject } from '../data/sampleData'
import { normalizeProjectForStorage } from '../shared/projectNormalization'
import { computeGraphLayoutView } from './graphLayoutViews'

const project = normalizeProjectForStorage(createFictionSampleProject('project-layout-view'))

describe('computeGraphLayoutView', () => {
  it('returns existing positions for free entity layout', () => {
    const entity = project.entities[0]
    if (!entity) throw new Error('Expected sample entity')
    const withPosition = {
      ...project,
      entityNodePositions: { [entity.id]: { x: 12, y: 34 } },
    }

    expect(computeGraphLayoutView(withPosition, 'entities', 'free')[entity.id]).toEqual({ x: 12, y: 34 })
  })

  it('computes stable relationship positions for entity graphs', () => {
    const first = computeGraphLayoutView(project, 'entities', 'relationship')
    const second = computeGraphLayoutView(project, 'entities', 'relationship')

    expect(first).toEqual(second)
    expect(Object.keys(first).sort()).toEqual(project.entities.map((entity) => entity.id).sort())
  })

  it('orders event layout by year and order for timeline view', () => {
    const positions = computeGraphLayoutView(project, 'events', 'timeline')
    const sortedEvents = [...project.events].sort(
      (a, b) => (a.startYear ?? a.order) - (b.startYear ?? b.order) || a.order - b.order,
    )

    expect(positions[sortedEvents[0]!.id]!.x).toBeLessThanOrEqual(
      positions[sortedEvents[sortedEvents.length - 1]!.id]!.x,
    )
  })

  it('returns an empty map for empty graphs', () => {
    expect(
      computeGraphLayoutView(
        { ...project, entities: [], entityRelations: [], entityNodePositions: {} },
        'entities',
        'relationship',
      ),
    ).toEqual({})
  })
})
