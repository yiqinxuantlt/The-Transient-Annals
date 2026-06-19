import { z } from 'zod'
import { createSampleProject } from '../../src/data/sampleData.ts'
import {
  FUSHENGLU_SCHEMA_VERSION,
  normalizeDatabaseForStorage,
  normalizeProjectForStorage,
  type FushengDatabase,
} from '../../src/shared/projectNormalization.ts'
import type { FushengProject, ProjectTemplateId } from '../../src/types/index.ts'

export const SCHEMA_VERSION = FUSHENGLU_SCHEMA_VERSION

export type { FushengDatabase }

const tagListSchema = z.array(z.string()).default([])
const yearRangeSchema = {
  startYear: z.number().finite().optional(),
  endYear: z.number().finite().optional(),
}
const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

const edgeStyleSchema = z
  .object({
    lineStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
    tone: z.enum(['cinnabar', 'jade', 'goldline', 'ink']).optional(),
    edgeType: z.enum(['straight', 'smoothstep', 'bezier', 'step']).optional(),
    lineWidth: z.number().min(0.5).max(12).optional(),
    animated: z.boolean().optional(),
  })
  .optional()

const entitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['person', 'character', 'organization', 'place', 'other']).default('other'),
  identity: z.string().optional(),
  faction: z.string().optional(),
  motivation: z.string().optional(),
  birth: z.string().optional(),
  death: z.string().optional(),
  dynasty: z.string().optional(),
  roleArc: z.string().optional(),
  description: z.string().optional(),
  avatarUrl: z.string().optional(),
  tags: tagListSchema,
  ...yearRangeSchema,
})

const eventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  timeLabel: z.string().default(''),
  order: z.number().finite().default(1),
  chapter: z.string().optional(),
  eventType: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  relatedEntityIds: z.array(z.string()).default([]),
  tags: tagListSchema,
  ...yearRangeSchema,
})

const entityRelationSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  style: edgeStyleSchema,
  ...yearRangeSchema,
})

const eventLinkSchema = z.object({
  id: z.string().min(1),
  sourceEventId: z.string().min(1),
  targetEventId: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  style: edgeStyleSchema,
  ...yearRangeSchema,
})

const libraryItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['note', 'quote', 'source', 'inspiration']).default('note'),
  content: z.string().default(''),
  tags: tagListSchema,
  createdAt: z.string().default(() => new Date().toISOString()),
})

const analysisNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  graphMode: z.enum(['entities', 'events']),
  startId: z.string().optional(),
  targetId: z.string().optional(),
  nodeIds: z.array(z.string()).default([]),
  edgeIds: z.array(z.string()).default([]),
  summary: z.string().default(''),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
})

export const projectSchema = z
  .object({
    schemaVersion: z.number().optional(),
    id: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().default(''),
    templateId: z.enum(['history', 'fiction']).optional(),
    category: z
      .enum(['history', 'novel', 'script', 'worldbuilding', 'research'])
      .default('research'),
    updatedAt: z.string().default(() => new Date().toISOString()),
    entities: z.array(entitySchema).default([]),
    events: z.array(eventSchema).default([]),
    entityRelations: z.array(entityRelationSchema).default([]),
    eventLinks: z.array(eventLinkSchema).default([]),
    libraryItems: z.array(libraryItemSchema).default([]),
    analysisNotes: z.array(analysisNoteSchema).default([]),
    entityNodePositions: z.record(z.string(), positionSchema).default({}),
    eventNodePositions: z.record(z.string(), positionSchema).default({}),
  })
  .transform((project) =>
    normalizeProjectForStorage({
      ...project,
      templateId: project.templateId as ProjectTemplateId,
    } as FushengProject),
  )

export const databaseSchema = z
  .object({
    schemaVersion: z.number().optional(),
    projects: z.array(projectSchema).default([]),
  })
  .transform(normalizeDatabaseForStorage)

export function normalizeProject(payload: unknown): FushengProject {
  return projectSchema.parse(payload) as FushengProject
}

export function normalizeDatabase(payload: unknown): FushengDatabase {
  return databaseSchema.parse(payload)
}

export function createInitialDatabase(): FushengDatabase {
  return normalizeDatabase({
    schemaVersion: SCHEMA_VERSION,
    projects: [createSampleProject()],
  })
}
