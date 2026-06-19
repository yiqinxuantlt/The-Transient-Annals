import { describe, expect, it } from 'vitest'
import { normalizeProject, SCHEMA_VERSION } from './schema'

const baseProject = {
  schemaVersion: 1,
  id: 'project-schema-test',
  title: 'Schema Test',
  subtitle: '',
  templateId: 'history',
  category: 'history',
  updatedAt: '2026-06-18T00:00:00.000Z',
  entities: [
    {
      id: 'entity-1',
      name: '刘邦',
      type: 'person',
      tags: [],
      startYear: -209,
      endYear: -195,
    },
    {
      id: 'entity-2',
      name: '项羽',
      type: 'person',
      tags: [],
    },
  ],
  events: [
    {
      id: 'event-1',
      title: '鸿门宴',
      timeLabel: '前206年',
      order: 1,
      relatedEntityIds: ['entity-1', 'missing-entity'],
      tags: [],
      startYear: -206,
      endYear: -206,
    },
  ],
  entityRelations: [
    {
      id: 'relation-valid',
      sourceId: 'entity-1',
      targetId: 'entity-2',
      type: '对立',
      style: {
        lineStyle: 'dashed',
        tone: 'ink',
        edgeType: 'step',
        lineWidth: 4,
        animated: true,
      },
      startYear: -206,
      endYear: -202,
    },
    {
      id: 'relation-orphan',
      sourceId: 'entity-1',
      targetId: 'missing-entity',
      type: '无效关系',
    },
  ],
  eventLinks: [
    {
      id: 'event-link-orphan',
      sourceEventId: 'event-1',
      targetEventId: 'missing-event',
      type: '无效因果',
    },
  ],
  libraryItems: [],
  entityNodePositions: {
    'entity-1': { x: 10, y: 20 },
    'missing-entity': { x: 30, y: 40 },
  },
  eventNodePositions: {
    'event-1': { x: 50, y: 60 },
    'missing-event': { x: 70, y: 80 },
  },
}

describe('server schema normalization', () => {
  it('preserves graph timing fields and complete edge styles', () => {
    const project = normalizeProject(baseProject)

    expect(project.schemaVersion).toBe(SCHEMA_VERSION)
    expect(project.entities[0]?.startYear).toBe(-209)
    expect(project.entities[0]?.endYear).toBe(-195)
    expect(project.events[0]?.startYear).toBe(-206)
    expect(project.entityRelations[0]?.startYear).toBe(-206)
    expect(project.entityRelations[0]?.style).toEqual({
      lineStyle: 'dashed',
      tone: 'ink',
      edgeType: 'step',
      lineWidth: 4,
      animated: true,
    })
  })

  it('removes references and positions for missing graph nodes', () => {
    const project = normalizeProject(baseProject)

    expect(project.events[0]?.relatedEntityIds).toEqual(['entity-1'])
    expect(project.entityRelations.map((relation) => relation.id)).toEqual(['relation-valid'])
    expect(project.eventLinks).toEqual([])
    expect(project.entityNodePositions).toEqual({ 'entity-1': { x: 10, y: 20 } })
    expect(project.eventNodePositions).toEqual({ 'event-1': { x: 50, y: 60 } })
  })

  it('accepts analysis notes and removes missing graph references', () => {
    const payload = {
      ...baseProject,
      analysisNotes: [
        {
          id: 'note-schema-valid',
          title: 'Schema Note',
          graphMode: 'entities',
          startId: 'entity-1',
          targetId: 'missing-entity',
          nodeIds: ['entity-1', 'missing-entity'],
          edgeIds: ['relation-valid', 'relation-orphan'],
          summary: 'Schema keeps valid note references.',
          createdAt: '2026-06-18T00:00:00.000Z',
          updatedAt: '2026-06-18T00:00:00.000Z',
        },
      ],
    }

    const project = normalizeProject(payload)

    expect(project.analysisNotes).toEqual([
      {
        id: 'note-schema-valid',
        title: 'Schema Note',
        graphMode: 'entities',
        startId: 'entity-1',
        targetId: undefined,
        nodeIds: ['entity-1'],
        edgeIds: ['relation-valid'],
        summary: 'Schema keeps valid note references.',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-18T00:00:00.000Z',
      },
    ])
  })
})
