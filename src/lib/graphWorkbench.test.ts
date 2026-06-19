import { describe, expect, it } from 'vitest'
import { createFictionSampleProject, createHistorySampleProject } from '../data/sampleData'
import {
  buildEvidenceNextSteps,
  collectGraphFilterOptions,
  countActiveFilters,
  emptyGraphFilters,
  filterGraphRecords,
  getGraphRecords,
  getLinkedNodeIds,
  type GraphFilters,
} from './graphWorkbench'

describe('graphWorkbench utilities', () => {
  it('builds entity graph records and filter options', () => {
    const project = createFictionSampleProject('project-graph-utils')
    const graph = getGraphRecords(project, 'entities')
    const options = collectGraphFilterOptions(graph)

    expect(graph.nodes.length).toBe(project.entities.length)
    expect(graph.edges.length).toBe(project.entityRelations.length)
    expect(options.nodeTypes.length).toBeGreaterThan(0)
    expect(options.edgeTypes.length).toBeGreaterThan(0)
    expect(options.tags.length).toBeGreaterThan(0)
  })

  it('filters event graph records by query and edge type while keeping context', () => {
    const project = createFictionSampleProject('project-filter-utils')
    const graph = getGraphRecords(project, 'events')
    const firstLink = project.eventLinks[0]
    const firstEvent = project.events[0]

    if (!firstLink || !firstEvent) throw new Error('Expected sample event graph')

    const filters: GraphFilters = {
      query: firstEvent.title,
      nodeTypes: [],
      edgeTypes: [firstLink.type],
      tags: [],
      factions: [],
      locations: [],
      year: null,
    }

    const filtered = filterGraphRecords(graph, filters)

    expect(filtered.nodes.some((node) => node.id === firstEvent.id)).toBe(true)
    expect(filtered.nodes.some((node) => node.id === firstLink.targetEventId)).toBe(true)
    expect(filtered.edges).toHaveLength(1)
    expect(filtered.edges[0]?.type).toBe(firstLink.type)
  })

  it('narrows visible nodes when an edge type filter is active', () => {
    const project = createFictionSampleProject('project-edge-filter-utils')
    const graph = getGraphRecords(project, 'entities')
    const relation = project.entityRelations[0]

    if (!relation) throw new Error('Expected sample entity relation')

    const filtered = filterGraphRecords(graph, {
      ...emptyGraphFilters(),
      edgeTypes: [relation.type],
    })

    expect(filtered.edges.every((edge) => edge.type === relation.type)).toBe(true)
    expect(filtered.nodes.map((node) => node.id).sort()).toEqual(
      [relation.sourceId, relation.targetId].sort(),
    )
  })

  it('filters records by historical year', () => {
    const project = createHistorySampleProject('project-year-utils')
    const graph = getGraphRecords(project, 'entities')
    const filtered = filterGraphRecords(graph, {
      ...emptyGraphFilters(),
      year: -205,
    })

    expect(filtered.nodes.length).toBeGreaterThan(0)
    expect(filtered.nodes.every((node) => node.startYear == null || node.startYear <= -205)).toBe(true)
    expect(filtered.nodes.every((node) => node.endYear == null || node.endYear >= -205)).toBe(true)
  })

  it('finds linked nodes and reasoning next steps', () => {
    const project = createFictionSampleProject('project-evidence-utils')
    const graph = getGraphRecords(project, 'entities')
    const firstNode = graph.nodes[0]

    if (!firstNode) throw new Error('Expected graph node')

    const linked = getLinkedNodeIds(graph, firstNode.id)
    const nextSteps = buildEvidenceNextSteps(graph, [firstNode.id], [])

    expect(linked.size).toBeGreaterThan(0)
    expect(nextSteps.length).toBeGreaterThan(0)
    expect(nextSteps[0]).toHaveProperty('edgeId')
    expect(nextSteps[0]).toHaveProperty('nodeId')
  })

  it('counts active filter dimensions', () => {
    expect(
      countActiveFilters({
        ...emptyGraphFilters(),
        query: '刘邦',
        edgeTypes: ['对立'],
        year: -205,
      }),
    ).toBe(3)
  })
})
