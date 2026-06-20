import { describe, expect, it } from 'vitest'
import { createFictionSampleProject } from '../data/sampleData'
import { normalizeProjectForStorage } from '../shared/projectNormalization'
import { searchProject } from './projectSearch'

const makeProject = () => {
  const base = normalizeProjectForStorage(createFictionSampleProject('project-search'))
  const firstEntity = base.entities[0]
  const secondEntity = base.entities[1]
  const firstEvent = base.events[0]
  const secondEvent = base.events[1]
  const firstRelation = base.entityRelations[0]
  const firstEventLink = base.eventLinks[0]

  if (!firstEntity || !secondEntity || !firstEvent || !secondEvent || !firstRelation || !firstEventLink) {
    throw new Error('Expected sample data')
  }

  return normalizeProjectForStorage({
    ...base,
    entities: [{ ...firstEntity, name: '秦始皇' }, ...base.entities.slice(1)],
    events: [
      { ...firstEvent, title: '统一六国', description: 'QIN campaign milestone' },
      ...base.events.slice(1),
    ],
    entityRelations: [
      { ...firstRelation, type: '盟友', description: 'Political ALLY with QIN' },
      ...base.entityRelations.slice(1),
    ],
    eventLinks: [
      { ...firstEventLink, type: '因果', description: 'QIN event bridge' },
      ...base.eventLinks.slice(1),
    ],
    libraryItems: [
      {
        id: 'library-search-source',
        title: '史记摘录',
        kind: 'source',
        content: '关于秦始皇的资料笔记',
        tags: ['史料'],
        createdAt: '2026-06-20T00:00:00.000Z',
      },
    ],
    analysisNotes: [
      {
        id: 'analysis-search-note',
        title: '统一路径',
        graphMode: 'entities',
        startId: firstEntity.id,
        nodeIds: [firstEntity.id],
        edgeIds: [firstRelation.id],
        summary: '秦始皇与盟友关系的推理笔记',
        createdAt: '2026-06-20T00:00:00.000Z',
        updatedAt: '2026-06-20T00:00:00.000Z',
      },
      {
        id: 'analysis-event-note',
        title: '事件链路',
        graphMode: 'events',
        startId: firstEvent.id,
        nodeIds: [firstEvent.id, secondEvent.id],
        edgeIds: [firstEventLink.id],
        summary: 'QIN event analysis',
        createdAt: '2026-06-20T00:00:00.000Z',
        updatedAt: '2026-06-20T00:00:00.000Z',
      },
    ],
  })
}

describe('searchProject', () => {
  it('returns empty grouped results for blank queries', () => {
    const result = searchProject(makeProject(), '   ')

    expect(result.total).toBe(0)
    expect(result.groups.every((group) => group.results.length === 0)).toBe(true)
  })

  it('finds Chinese substrings across project records', () => {
    const result = searchProject(makeProject(), '秦始皇')

    expect(result.total).toBeGreaterThan(0)
    expect(result.groups.find((group) => group.kind === 'entities')?.results[0]).toMatchObject({
      title: '秦始皇',
      path: expect.stringContaining('/projects/project-search/relation-graph?focusNodeId='),
    })
    expect(result.groups.find((group) => group.kind === 'library')?.results[0]?.title).toBe('史记摘录')
  })

  it('matches case-insensitive Latin text', () => {
    const result = searchProject(makeProject(), 'ally')

    expect(result.groups.find((group) => group.kind === 'relations')?.results[0]?.title).toContain('盟友')
  })

  it('limits each group to eight results', () => {
    const project = makeProject()
    const expanded = normalizeProjectForStorage({
      ...project,
      entities: Array.from({ length: 12 }, (_, index) => ({
        ...project.entities[0]!,
        id: `entity-match-${index}`,
        name: `Match Entity ${index}`,
      })),
    })

    const result = searchProject(expanded, 'Match Entity')

    expect(result.groups.find((group) => group.kind === 'entities')?.results).toHaveLength(8)
  })

  it('returns navigation targets for each searchable group', () => {
    const result = searchProject(makeProject(), 'QIN')
    const events = result.groups.find((group) => group.kind === 'events')?.results
    const relations = result.groups.find((group) => group.kind === 'relations')?.results
    const notes = result.groups.find((group) => group.kind === 'notes')?.results

    expect(events?.[0]?.path).toContain('/projects/project-search/event-graph?focusNodeId=')
    expect(relations?.map((item) => item.path)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/projects/project-search/relation-graph?focusNodeId='),
        expect.stringContaining('/projects/project-search/event-graph?focusNodeId='),
      ]),
    )
    expect(notes?.[0]?.path).toContain('/projects/project-search/event-graph?focusNodeId=')
  })
})
